#!/bin/bash

# Скрипт для постійного запуску бота
# Якщо бот зупиниться, скрипт перезапустить його

echo "Starting Telegram Music Bot in forever mode..."

# Встановлюємо змінні середовища з .env файлу, якщо він існує
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(cat .env | xargs)
fi

# Цикл для постійного запуску
while true; do
  echo "$(date): Starting bot..."
  node index.js
  
  # Якщо бот зупинився, виводимо повідомлення і чекаємо 10 секунд перед перезапуском
  echo "$(date): Bot stopped, restarting in 10 seconds..."
  sleep 10
done