-- Один раз в консоли БД, если rx_import_medicines ещё нет (ошибка «function does not exist»).
-- После deploy API с миграцией 015 это не нужно — функции создаст Alembic.

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
