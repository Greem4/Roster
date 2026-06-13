#!/usr/bin/env bash
# Одноразовая настройка IntelliJ IDEA: External Tool «Cursor: commit message».
# После запуска назначьте горячую клавишу (рекомендуем ⌃⌥C) в Keymap.

set -euo pipefail

SETUP="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS="$(cd "$SETUP/.." && pwd)"
ROOT="$(cd "$SCRIPTS/.." && pwd)"
SCRIPT="$SCRIPTS/internal/cursor-commit-msg.sh"
IDEA_DIR="$ROOT/.idea/tools"
XML="$IDEA_DIR/External Tools.xml"

if [ ! -x "$SCRIPT" ]; then
  chmod +x "$SCRIPT"
fi

mkdir -p "$IDEA_DIR"

cat > "$XML" <<EOF
<toolSet name="External Tools">
  <tool name="Cursor: commit message" description="Сгенерировать сообщение коммита через Cursor Agent (как ✨ в Cursor)" showInMainMenu="true" showInProject="false" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="true" showConsoleOnStdErr="true" synchronizeAfterRun="false">
    <exec>
      <option name="COMMAND" value="/bin/bash" />
      <option name="PARAMETERS" value="&quot;$SCRIPT&quot; --paste" />
      <option name="WORKING_DIRECTORY" value="\$ProjectFileDir\$" />
    </exec>
  </tool>
</toolSet>
EOF

cat <<EOF
Готово: External Tool «Cursor: commit message» → $XML

Дальше в IntelliJ IDEA Ultimate:

1. File → Invalidate Caches… → Invalidate and Restart
   (или закройте и откройте проект — IDE подхватит .idea/tools)

2. Settings → Keymap → найдите «Cursor: commit message»
   (External Tools) → назначьте, например: ⌃⌥C

3. В Commit tool window (⌘0):
   - отметьте staged файлы
   - кликните в поле Commit Message
   - ⌃⌥C (или Tools → Cursor: commit message)
   - сообщение вставится автоматически (--paste)

Без IntelliJ: ./scripts/internal/cursor-commit-msg.sh
(результат в буфере — Cmd+V в поле коммита)

Правила сообщений — .cursorrules (те же, что ✨ в Cursor Source Control).
EOF
