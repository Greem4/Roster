#!/usr/bin/env python3
"""Заливка medicines-live.json в БД roster_rx (RX_DATABASE_URL или .env)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LIVE_JSON = Path(__file__).resolve().parent / "data" / "medicines-live.json"

# те же правила, что import-medicines-invoices.py
import re


def parse_expiry(raw: str) -> date:
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$", raw.strip())
    if not m:
        raise ValueError(f"Неверный срок годности: {raw!r}")
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    if d in (30, 31):
        d = 1
    return date(y, mo, d)


def _database_url() -> str:
    url = os.environ.get("RX_DATABASE_URL")
    if url:
        return url
    env_path = ROOT / ".env"
    if env_path.is_file():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("RX_DATABASE_URL="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("Задайте RX_DATABASE_URL")


def _sql_literal(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main() -> None:
    if not LIVE_JSON.is_file():
        raise SystemExit(f"Нет файла: {LIVE_JSON}")

    rows = json.loads(LIVE_JSON.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise SystemExit("medicines-live.json: ожидается массив")

    url = _database_url()
    now = datetime.now(timezone.utc).isoformat()

    lines = [
        "BEGIN;",
        "TRUNCATE medicines RESTART IDENTITY;",
    ]
    for i, entry in enumerate(rows, start=1):
        if not isinstance(entry, dict):
            raise SystemExit(f"[{i}]: ожидается объект")
        name = str(entry["name"]).strip()[:255]
        series = str(entry["series"]).strip()[:128]
        expiry = parse_expiry(str(entry["expiry"]))
        lines.append(
            "INSERT INTO medicines (name, series, expiry_date, created_by_id, created_at, updated_at)\n"
            f"VALUES ({_sql_literal(name)}, {_sql_literal(series)}, "
            f"{_sql_literal(expiry.isoformat())}::date, NULL, "
            f"{_sql_literal(now)}::timestamptz, {_sql_literal(now)}::timestamptz);"
        )
    lines.append("COMMIT;")

    proc = subprocess.run(
        ["psql", url, "-v", "ON_ERROR_STOP=1"],
        input="\n".join(lines),
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        sys.exit(proc.returncode)

    count = subprocess.run(
        ["psql", url, "-t", "-A", "-c", "SELECT COUNT(*) FROM medicines;"],
        capture_output=True,
        text=True,
        check=True,
    )
    print(f"Загружено в roster_rx: {count.stdout.strip()} записей")


if __name__ == "__main__":
    main()
