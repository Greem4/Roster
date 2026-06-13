"""Схема RosterRX в отдельной БД roster_rx.

Revision ID: rx001
Revises:
Create Date: 2026-06-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "rx001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_RX_PARSE_EXPIRY = """
CREATE OR REPLACE FUNCTION rx_parse_expiry(raw text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts text[];
  d int;
  mo int;
  y int;
BEGIN
  parts := string_to_array(trim(raw), '/');
  IF array_length(parts, 1) IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'Неверный срок годности: %', raw;
  END IF;
  d := parts[1]::int;
  mo := parts[2]::int;
  y := parts[3]::int;
  IF y < 100 THEN
    y := y + 2000;
  END IF;
  IF d IN (30, 31) THEN
    d := 1;
  END IF;
  RETURN make_date(y, mo, d);
END;
$$;
"""

_RX_IMPORT_MEDICINES = """
CREATE OR REPLACE FUNCTION rx_import_medicines(items jsonb)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  v_name text;
  v_series text;
  v_expiry date;
  added int := 0;
  skipped int := 0;
  total int;
BEGIN
  IF jsonb_typeof(items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Ожидается JSON-массив';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(items)
  LOOP
    v_name := left(trim(item->>'name'), 255);
    v_series := left(trim(item->>'series'), 128);
    v_expiry := rx_parse_expiry(item->>'expiry');

    IF v_name IS NULL OR v_name = '' OR v_series IS NULL OR v_series = '' THEN
      RAISE EXCEPTION 'Пустое name или series: %', item;
    END IF;

    BEGIN
      INSERT INTO medicines (name, series, expiry_date, created_by_id, created_at, updated_at)
      VALUES (v_name, v_series, v_expiry, NULL, NOW(), NOW());
      added := added + 1;
    EXCEPTION
      WHEN unique_violation THEN
        skipped := skipped + 1;
    END;
  END LOOP;

  SELECT COUNT(*) INTO total FROM medicines;
  RETURN format('Добавлено: %s, пропущено (серия уже есть): %s, всего: %s', added, skipped, total);
END;
$$;
"""


def upgrade() -> None:
    op.create_table(
        "medicines",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("series", sa.String(length=128), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("series", name="uq_medicines_series"),
    )
    op.create_index("ix_medicines_expiry_date", "medicines", ["expiry_date"])
    op.execute(_RX_PARSE_EXPIRY)
    op.execute(_RX_IMPORT_MEDICINES)


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS rx_import_medicines(jsonb);")
    op.execute("DROP FUNCTION IF EXISTS rx_parse_expiry(text);")
    op.drop_index("ix_medicines_expiry_date", table_name="medicines")
    op.drop_table("medicines")
