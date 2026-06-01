# Общие SSH-опции для B3. Подключать: . "$(dirname "$0")/_ssh-b3.sh"
PI_SSH="${PI_SSH:-greem4@192.168.31.96}"
ROSTER_SSH_SOCKET="${ROSTER_SSH_SOCKET:-$HOME/.ssh/roster-b3-%C}"

_roster_ssh_identity() {
  KEY="${ROSTER_SSH_KEY:-$HOME/.ssh/id_ed25519_roster}"
  if [ -f "$KEY" ]; then
    echo "-i ${KEY}"
  elif [ -f "$HOME/.ssh/id_ed25519" ]; then
    echo "-i $HOME/.ssh/id_ed25519"
  fi
}

# Одно подключение на сессию (ControlPersist), без повторного пароля каждый rsync/ssh.
ROSTER_SSH_BASE="-o ControlMaster=auto -o ControlPath=${ROSTER_SSH_SOCKET} -o ControlPersist=8h -o ServerAliveInterval=60 $(_roster_ssh_identity)"

roster_ssh() {
  # shellcheck disable=SC2086
  ssh $ROSTER_SSH_BASE "$@"
}

roster_rsync() {
  # shellcheck disable=SC2086
  rsync -e "ssh $ROSTER_SSH_BASE" "$@"
}

# Мастер-соединение (пароль или ключ — один раз, дальше переиспользуется).
roster_ssh_ensure_master() {
  if ssh -S "$ROSTER_SSH_SOCKET" -O check "$PI_SSH" 2>/dev/null; then
    return 0
  fi
  echo "SSH к B3 (${PI_SSH})…"
  echo "Пароль спросят один раз за сессию. Чтобы не спрашивало вообще: ./scripts/setup/ssh-key.sh"
  # shellcheck disable=SC2086
  ssh $ROSTER_SSH_BASE -f -N "$PI_SSH" || {
    echo "" >&2
    echo "Не удалось подключиться по SSH." >&2
    echo "  ./scripts/setup/ssh-key.sh   — вход по ключу без пароля" >&2
    echo "  PI_SSH=… в .env             — другой хост" >&2
    return 1
  }
}
