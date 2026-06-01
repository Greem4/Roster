#!/usr/bin/env python3
"""Добавляет на Pi второй reverse-forward SSH (127.0.0.1:22022) в start-vps-tunnel.sh."""
from pathlib import Path
import sys

TUNNEL_SCRIPT = Path("/home/greem4/.local/bin/start-vps-tunnel.sh")
MARKER = "127.0.0.1:22022:127.0.0.1:22"
OLD = (
    '    -R "${REMOTE_BIND_ADDR}:${REMOTE_BIND_PORT}:'
    '${LOCAL_TARGET_ADDR}:${LOCAL_TARGET_PORT}" \\\n'
)
NEW = OLD + f'    -R "{MARKER}" \\\n'


def main() -> int:
    if not TUNNEL_SCRIPT.is_file():
        print(f"Нет {TUNNEL_SCRIPT}", file=sys.stderr)
        return 1
    text = TUNNEL_SCRIPT.read_text()
    if MARKER in text:
        print("already_patched")
        return 0
    if OLD not in text:
        print("pattern not found in tunnel script", file=sys.stderr)
        return 1
    TUNNEL_SCRIPT.write_text(text.replace(OLD, NEW, 1))
    print("patched_ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
