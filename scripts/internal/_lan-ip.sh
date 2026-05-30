# Локальный IPv4 Mac в Wi‑Fi/Ethernet (для доступа с телефона в той же сети).
roster_lan_ip() {
  iface=
  for iface in en0 en1 en2; do
    ip=$(ipconfig getifaddr "$iface" 2>/dev/null) || true
    if [ -n "$ip" ]; then
      printf '%s' "$ip"
      return 0
    fi
  done
  return 1
}
