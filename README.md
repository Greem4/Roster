# Medicine Infrastructure Runbook

Новый README только про инфраструктуру, которую мы подняли и проверили в работе.

## Что сделано

- Перевели `medicine.greemlab.ru` с GitHub Pages на VPS.
- Подняли схему: `Интернет -> VPS (nginx, 443) -> reverse SSH tunnel -> Pi (локальный сайт на 80)`.
- Выпустили HTTPS сертификат Let's Encrypt для `medicine.greemlab.ru`.
- Настроили постоянный туннель с Pi на VPS.

## Текущая схема

- Домен: `medicine.greemlab.ru`
- VPS (публичный): `176.12.65.86` (Ubuntu 24.04)
- Домашний Pi: `192.168.31.96` (Debian 13)
- Порт туннеля на VPS: `127.0.0.1:18080`
- Локальный веб-сервис на Pi: `127.0.0.1:80`

## DNS (Beget)

Сейчас правильная запись такая:

- `A` запись: `medicine` -> `176.12.65.86`

Старую запись нужно держать отключенной:

- `CNAME medicine -> greem4.github.io`

## VPS: что установлено и настроено

Установлено:

- `nginx`
- `certbot`
- `python3-certbot-nginx`
- `fail2ban`

Nginx vhost:

- файл: `/etc/nginx/sites-available/medicine.greemlab.ru`
- активная ссылка: `/etc/nginx/sites-enabled/medicine.greemlab.ru`
- проксирует `/` на `http://127.0.0.1:18080`

SSL:

- сертификат: `/etc/letsencrypt/live/medicine.greemlab.ru/fullchain.pem`
- ключ: `/etc/letsencrypt/live/medicine.greemlab.ru/privkey.pem`
- автопродление: `certbot.timer`

## Pi: постоянный reverse tunnel

Ключ туннеля:

- приватный ключ: `/home/greem4/.ssh/id_ed25519_vps_tunnel`
- публичный ключ добавлен пользователю `tunnel` на VPS

Файлы и запуск:

- env: `/home/greem4/.config/vps-tunnel/env`
- скрипт: `/home/greem4/.local/bin/start-vps-tunnel.sh`
- лог: `/home/greem4/.config/vps-tunnel/tunnel.log`
- автозапуск после ребута: запись в `crontab` пользователя `greem4`

## Быстрые проверки

```bash
# 1) DNS должен показывать VPS IP
dig +short medicine.greemlab.ru @8.8.8.8

# 2) Снаружи должен быть HTTPS 200
curl -I https://medicine.greemlab.ru

# 3) На VPS должен слушаться tunnel-порт
ssh root@176.12.65.86 "ss -tulpen | sed -n '/127.0.0.1:18080/p'"

# 4) На VPS backend через tunnel должен отвечать
ssh root@176.12.65.86 "curl -I http://127.0.0.1:18080"

# 5) На Pi должен быть жив процесс туннеля
ssh greem4@192.168.31.96 "pgrep -af start-vps-tunnel.sh"
```

## Аварийное восстановление (5 минут)

Если сайт недоступен:

1. Проверить DNS (`dig`).
2. Проверить nginx на VPS:
   ```bash
   ssh root@176.12.65.86 "nginx -t && systemctl reload nginx && systemctl status nginx --no-pager -l"
   ```
3. Проверить tunnel-порт на VPS:
   ```bash
   ssh root@176.12.65.86 "ss -tulpen | sed -n '/127.0.0.1:18080/p'"
   ```
4. Перезапустить туннель на Pi:
   ```bash
   ssh greem4@192.168.31.96 "pkill -f start-vps-tunnel.sh || true; nohup /home/greem4/.local/bin/start-vps-tunnel.sh >/home/greem4/.config/vps-tunnel/tunnel.log 2>&1 &"
   ```
5. Проверить логи туннеля:
   ```bash
   ssh greem4@192.168.31.96 "sed -n '1,120p' /home/greem4/.config/vps-tunnel/tunnel.log"
   ```

## Что улучшить дальше

- Ограничить firewall на VPS только портами `22`, `80`, `443`.
- Сделать отдельного non-root админа на VPS и отключить SSH для `root`.
- Добавить uptime-мониторинг (`Uptime Kuma`/`Better Stack`) на `https://medicine.greemlab.ru`.
- Добавить бэкап конфигов VPS (`/etc/nginx`, `/etc/letsencrypt`) в приватный репозиторий/хранилище.
