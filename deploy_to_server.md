# Інструкція з розгортання на сервері

Ця інструкція допоможе налаштувати Telegram Music Bot на вашому власному сервері для безперервної роботи.

## Системні вимоги

- Ubuntu 20.04 або новіше (або інший Linux-дистрибутив)
- Node.js 14.x або новіше
- npm або yarn
- Доступ до інтернету

## Крок 1: Встановлення Node.js і npm

```bash
# Оновлення пакетів
sudo apt update
sudo apt upgrade -y

# Встановлення Node.js та npm
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Перевірка версій
node -v
npm -v
```

## Крок 2: Клонування репозиторію або завантаження коду

```bash
# Створення директорії для бота
mkdir -p /opt/telegram-music-bot
cd /opt/telegram-music-bot

# Якщо використовуєте Git
git clone https://github.com/your-username/telegram-music-bot.git .

# АБО розпакуйте архів, якщо код завантажений як ZIP
# unzip /path/to/telegram-music-bot.zip -d .
```

## Крок 3: Встановлення залежностей

```bash
npm install
```

## Крок 4: Налаштування змінних середовища

```bash
# Створення .env файлу
cat > .env << EOF
TELEGRAM_TOKEN=your_telegram_token_here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
EOF

# Встановлення правильних дозволів
chmod 600 .env
```

## Крок 5: Налаштування запуску як системної служби

```bash
# Створення файлу системної служби
sudo cat > /etc/systemd/system/telegram-music-bot.service << EOF
[Unit]
Description=Telegram Music Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/telegram-music-bot
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=telegram-music-bot
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Перезавантаження конфігурації systemd
sudo systemctl daemon-reload

# Активація і запуск служби
sudo systemctl enable telegram-music-bot
sudo systemctl start telegram-music-bot
```

## Крок 6: Перевірка роботи бота

```bash
# Перевірка статусу служби
sudo systemctl status telegram-music-bot

# Перегляд логів
sudo journalctl -u telegram-music-bot -f
```

## Додаткові команди

```bash
# Перезапуск бота
sudo systemctl restart telegram-music-bot

# Зупинка бота
sudo systemctl stop telegram-music-bot

# Перегляд інформації про помилки
sudo journalctl -u telegram-music-bot -p err
```

## Налаштування автоматичних оновлень (опціонально)

```bash
# Встановлення unattended-upgrades для автоматичних оновлень безпеки
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Моніторинг стану бота (опціонально)

```bash
# Встановлення утиліти htop для моніторингу ресурсів
sudo apt install htop -y

# Запуск моніторингу
htop
```

## У випадку проблем

- Перевірте, чи всі змінні середовища правильно налаштовані в `.env` файлі
- Переконайтеся, що у системного користувача є права доступу до директорії бота
- Перевірте логи на наявність помилок: `sudo journalctl -u telegram-music-bot -n 100`