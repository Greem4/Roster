#!/usr/bin/env bash
# Генерация сообщения git-коммита через Cursor Agent (как ✨ в Source Control Cursor).
# Читает staged diff, правила из .cursorrules, копирует результат в буфер обмена.
#
# IntelliJ IDEA: ./scripts/setup/intellij-cursor-commit.sh
# Вручную: ./scripts/internal/cursor-commit-msg.sh [--paste]

set -euo pipefail

INTERNAL="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
source "$INTERNAL/_root.sh"

AGENT="${CURSOR_AGENT_BIN:-$HOME/.local/bin/agent}"
PASTE=0

for arg in "$@"; do
  case "$arg" in
    --paste) PASTE=1 ;;
    -h|--help)
      cat <<'EOF'
Использование: cursor-commit-msg.sh [--paste]

Сгенерировать сообщение коммита по staged diff через Cursor Agent.
Результат копируется в буфер; с --paste — вставка в активное поле (macOS).

Требования: git, Cursor Agent (~/.local/bin/agent), staged изменения.
EOF
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $arg (см. --help)" >&2
      exit 1
      ;;
  esac
done

if ! command -v git >/dev/null 2>&1; then
  echo "git не найден в PATH" >&2
  exit 1
fi

if [ ! -x "$AGENT" ]; then
  echo "Cursor Agent не найден: $AGENT" >&2
  echo "Установите CLI: cursor agent install-shell-integration или см. https://cursor.com/docs/cli/acp" >&2
  exit 1
fi

cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Не git-репозиторий: $ROOT" >&2
  exit 1
fi

if [ -z "$(git diff --cached --name-only)" ]; then
  echo "Нет staged изменений. Отметьте файлы в Commit tool window (⌘0)." >&2
  exit 1
fi

RULES=""
if [ -f "$ROOT/.cursorrules" ]; then
  RULES="$(cat "$ROOT/.cursorrules")"
fi

DIFF="$(git diff --cached)"
if [ -z "$DIFF" ]; then
  echo "Staged diff пуст (возможно, только бинарные файлы)." >&2
  exit 1
fi

# Ограничение размера diff для CLI (стабильность и скорость).
MAX_DIFF_BYTES=120000
DIFF_BYTES="$(printf '%s' "$DIFF" | wc -c | tr -d ' ')"
if [ "$DIFF_BYTES" -gt "$MAX_DIFF_BYTES" ]; then
  DIFF="$(git diff --cached --stat)"
  DIFF="$DIFF

(полный diff обрезан — слишком большой для одного коммита; сгенерируй по stat)"
fi

PROMPT="$(cat <<EOF
Сгенерируй сообщение git-коммита по staged diff ниже.

Ответ: только одна строка текста сообщения, без кавычек, markdown и пояснений.

Правила проекта:
$RULES

Staged diff:
$DIFF
EOF
)"

echo "Cursor Agent: генерация сообщения коммита…" >&2

MSG="$("$AGENT" --print --trust --mode ask --workspace "$ROOT" "$PROMPT" 2>&1 | tail -n 1)"
MSG="$(printf '%s' "$MSG" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//')"

if [ -z "$MSG" ]; then
  echo "Cursor Agent вернул пустой ответ" >&2
  exit 1
fi

if [ "${#MSG}" -gt 72 ]; then
  echo "Предупреждение: длина ${#MSG} > 72 символов (.cursorrules)" >&2
fi

printf '%s' "$MSG" | pbcopy

echo "$MSG"
echo "→ Скопировано в буфер обмена." >&2

if [ "$PASTE" -eq 1 ]; then
  sleep 0.2
  osascript -e 'tell application "System Events" to keystroke "v" using command down' >/dev/null 2>&1 \
    && echo "→ Вставлено в активное поле (Cmd+V)." >&2 \
    || echo "→ Автовставка не удалась — вставьте вручную: Cmd+V." >&2
fi

if command -v osascript >/dev/null 2>&1; then
  osascript -e "display notification \"$MSG\" with title \"Cursor: commit message\"" >/dev/null 2>&1 || true
fi
