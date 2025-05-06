#!/bin/bash

# Скрипт для встановлення бота на новому сервері

echo "=== Встановлення Telegram Music Bot ==="
echo "Цей скрипт налаштує всі необхідні компоненти"

# Перевірка наявності Node.js
if command -v node &>/dev/null; then
    NODE_VER=$(node -v)
    echo "Node.js вже встановлено ($NODE_VER)"
else
    echo "Node.js не знайдено. Встановлюю Node.js..."
    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "Node.js встановлено $(node -v)"
fi

# Перевірка наявності npm
if command -v npm &>/dev/null; then
    NPM_VER=$(npm -v)
    echo "npm вже встановлено ($NPM_VER)"
else
    echo "npm не знайдено. Встановлюю npm..."
    sudo apt install -y npm
    echo "npm встановлено $(npm -v)"
fi

# Встановлення залежностей
echo "Встановлення залежностей проекту..."
npm install

# Створення .env файлу
if [ ! -f .env ]; then
    echo "Створення .env файлу..."
    read -p "Введіть токен Telegram бота: " telegram_token
    read -p "Введіть Spotify Client ID (опціонально): " spotify_client_id
    read -p "Введіть Spotify Client Secret (опціонально): " spotify_client_secret
    
    cat > .env << EOF
TELEGRAM_TOKEN=${telegram_token}
SPOTIFY_CLIENT_ID=${spotify_client_id}
SPOTIFY_CLIENT_SECRET=${spotify_client_secret}
EOF
    
    chmod 600 .env
    echo ".env файл створено успішно"
else
    echo ".env файл вже існує"
fi

# Створення тимчасової директорії
mkdir -p temp_downloads
echo "Директорія temp_downloads створена"

# Налаштування прав на запуск
chmod +x run_forever.sh
echo "Права на запуск скрипта run_forever.sh встановлені"

echo "=== Встановлення завершено ==="
echo ""
echo "Для запуску бота виконайте:"
echo "  npm start       # Звичайний запуск"
echo "  ./run_forever.sh  # Запуск з автоматичним перезапуском"
echo ""
echo "Дякуємо за використання Telegram Music Bot!"