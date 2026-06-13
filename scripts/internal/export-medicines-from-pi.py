#!/usr/bin/env python3
"""Снимок medicines с Pi (B3) → scripts/internal/data/medicines-live.json."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "data" / "medicines-live.json"

SQL = """
SELECT COALESCE(
  json_agg(row_to_json(t) ORDER BY t.sort_expiry, t.sort_series),
  '[]'::json
)
FROM (
  SELECT
    name,
    series,
    to_char(expiry_date, 'DD/MM/YY') AS expiry,
    expiry_date AS sort_expiry,
    series AS sort_series
  FROM medicines
  ORDER BY expiry_date, series
) t;
"""


def main() -> None:
    remote = (
        "cd ~/Roster && docker compose exec -T db "
        "psql -U roster -d roster -t -A"
    )
    proc = subprocess.run(
        ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "roster-pi-remote", remote],
        input=SQL,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.stderr or proc.stdout or "Не удалось выгрузить с Pi")

    raw = proc.stdout.strip()
    if not raw:
        raise SystemExit("Пустой ответ с Pi")

    data = json.loads(raw)
    if not isinstance(data, list):
        raise SystemExit("Ожидался JSON-массив")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Записано {len(data)} позиций → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
