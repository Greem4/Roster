#!/usr/bin/env python3
"""Импорт позиций из накладных (фото в папке «Лекарства») в таблицу medicines."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = Path(__file__).resolve().parent / "data" / "medicines-invoices.json"


def parse_expiry(raw: str) -> date:
    """DD/MM/YY → date; 30-е и 31-е число → 1-е того же месяца (раньше считаем просроченным)."""
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$", raw.strip())
    if not m:
        raise ValueError(f"Неверный срок годности: {raw!r}")
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    if d in (30, 31):
        d = 1
    return date(y, mo, d)


def normalize_series(s: str) -> str:
    return s.strip()[:128]


def normalize_name(s: str) -> str:
    return s.strip()[:255]


def load_items() -> list[tuple[str, str, date]]:
    """
    Читает готовый список из data/medicines-invoices.json.
    В файле уже: одна позиция на серию, сроки без 30/31, порядок по возрастанию срока.
    """
    if not DATA_FILE.is_file():
        raise SystemExit(f"Нет файла данных: {DATA_FILE}")
    raw = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise SystemExit(f"{DATA_FILE}: ожидается JSON-массив")

    seen_series: set[str] = set()
    rows: list[tuple[str, str, date]] = []
    for i, entry in enumerate(raw, start=1):
        if not isinstance(entry, dict):
            raise SystemExit(f"{DATA_FILE}[{i}]: ожидается объект")
        try:
            name = normalize_name(str(entry["name"]))
            series = normalize_series(str(entry["series"]))
            expiry = parse_expiry(str(entry["expiry"]))
        except KeyError as e:
            raise SystemExit(f"{DATA_FILE}[{i}]: нет поля {e}") from e
        if series in seen_series:
            raise SystemExit(f"{DATA_FILE}[{i}]: повтор серии {series!r}")
        seen_series.add(series)
        rows.append((name, series, expiry))

    rows.sort(key=lambda row: row[2])
    return rows


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    env_path = ROOT / ".env"
    if env_path.is_file():
        for line in env_path.read_text().splitlines():
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("Задайте DATABASE_URL в окружении или в .env")


def _sql_literal(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main() -> None:
    parser = argparse.ArgumentParser(description="Импорт medicines из накладных")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Очистить таблицу medicines перед вставкой (TRUNCATE)",
    )
    args = parser.parse_args()

    url = _database_url()
    rows = load_items()
    now = datetime.now(timezone.utc).isoformat()

    lines = ["BEGIN;"]
    if args.replace:
        lines.append("TRUNCATE medicines RESTART IDENTITY;")
    for name, series, expiry in rows:
        lines.append(
            "INSERT INTO medicines (name, series, expiry_date, created_by_id, created_at, updated_at)\n"
            f"SELECT {_sql_literal(name)}, {_sql_literal(series)}, {_sql_literal(expiry.isoformat())}::date, "
            f"NULL, {_sql_literal(now)}::timestamptz, {_sql_literal(now)}::timestamptz\n"
            f"WHERE NOT EXISTS (\n"
            f"  SELECT 1 FROM medicines m WHERE m.series = {_sql_literal(series)}\n"
            ");"
        )
    lines.append("COMMIT;")

    sql = "\n".join(lines)

    def count_rows() -> int:
        p = subprocess.run(
            ["psql", url, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-c", "SELECT COUNT(*) FROM medicines;"],
            capture_output=True,
            text=True,
        )
        if p.returncode != 0:
            raise SystemExit(p.stderr or p.stdout)
        return int(p.stdout.strip())

    before = count_rows()

    proc = subprocess.run(
        ["psql", url, "-v", "ON_ERROR_STOP=1"],
        input=sql,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout, file=sys.stderr)
        sys.exit(proc.returncode)

    after = count_rows()

    print(f"Позиций в {DATA_FILE.name}: {len(rows)}")
    if args.replace:
        print(f"Таблица очищена и загружена заново: {after} записей")
    else:
        print(f"Добавлено: {after - before}")
        print(f"Всего в medicines: {after}")


if __name__ == "__main__":
    main()
