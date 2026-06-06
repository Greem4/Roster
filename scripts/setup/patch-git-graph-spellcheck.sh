#!/usr/bin/env bash
# Включает проверку орфографии (русский) в полях Git Graph: Create Branch, Rename и т.д.
# Патч перезаписывается при обновлении расширения — запустите скрипт снова после update.

set -euo pipefail

shopt -s nullglob

OLD='dialogInput\'+n+\'" type="text" value="'
NEW='dialogInput\'+n+\'" type="text" spellcheck="true" lang="ru" value="'

patched=0

for js in "$HOME/.cursor/extensions"/mhutchie.git-graph-*-universal/media/out.min.js; do
  if grep -q 'spellcheck="true" lang="ru"' "$js"; then
    echo "Уже пропатчено: $js"
    continue
  fi
  python3 - "$js" "$OLD" "$NEW" <<'PY'
import sys
path, old, new = sys.argv[1:4]
with open(path, encoding="utf-8") as f:
    data = f.read()
if old not in data:
    print(f"Неизвестная версия Git Graph, пропуск: {path}", file=sys.stderr)
    sys.exit(0)
with open(path, "w", encoding="utf-8") as f:
    f.write(data.replace(old, new, 1))
print(f"Пропатчено: {path}")
PY
  patched=1
done

for view in "$HOME/.cursor/extensions"/mhutchie.git-graph-*-universal/out/gitGraphView.js; do
  if grep -q '<html lang="ru">' "$view"; then
    echo "HTML lang=ru уже есть: $view"
    continue
  fi
  if ! grep -q '<html lang="en">' "$view"; then
    echo "Неизвестный gitGraphView.js, пропуск: $view" >&2
    continue
  fi
  python3 - "$view" <<'PY'
import sys
path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    data = f.read()
with open(path, "w", encoding="utf-8") as f:
    f.write(data.replace('<html lang="en">', '<html lang="ru">', 1))
print(f"HTML lang=ru: {path}")
PY
  patched=1
done

if ! compgen -G "$HOME/.cursor/extensions/mhutchie.git-graph-*-universal/media/out.min.js" > /dev/null; then
  echo "Git Graph не установлен. Extensions → Git Graph." >&2
  exit 1
fi

echo "Готово. Перезагрузите окно Cursor: Command Palette → Developer: Reload Window."
