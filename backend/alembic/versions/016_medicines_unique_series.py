"""Уникальность серии лекарства и обновлённый rx_import_medicines.

Revision ID: 016
Revises: 015
Create Date: 2026-06-13
"""

from typing import Sequence, Union

from alembic import op

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DEDUP_SERIES = """
DELETE FROM medicines a
USING medicines b
WHERE a.id > b.id AND trim(a.series) = trim(b.series);
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
    op.execute(_DEDUP_SERIES)
    op.create_index("uq_medicines_series", "medicines", ["series"], unique=True)
    op.execute(_RX_IMPORT_MEDICINES)


def downgrade() -> None:
    op.execute(
        """
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

    INSERT INTO medicines (name, series, expiry_date, created_by_id, created_at, updated_at)
    SELECT v_name, v_series, v_expiry, NULL, NOW(), NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM medicines m
      WHERE m.name = v_name AND m.series = v_series AND m.expiry_date = v_expiry
    );

    IF FOUND THEN
      added := added + 1;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO total FROM medicines;
  RETURN format('Добавлено: %s, всего в medicines: %s', added, total);
END;
$$;
"""
    )
    op.drop_index("uq_medicines_series", table_name="medicines")
