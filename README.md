# Telegram Music Bot (Node.js)

Телеграм-бот для завантаження музики з YouTube, SoundCloud та Spotify.

## Особливості

- Завантаження аудіо з YouTube
- Завантаження треків зі SoundCloud
- Завантаження музики зі Spotify (пошук і завантаження через YouTube)
- Керування через Telegram-інтерфейс
- Статистика завантажень
- Keep-alive механізм для безперервної роботи

## Системні вимоги

- Node.js 14.x або новіше
- npm або yarn

## Встановлення

1. Клонуйте цей репозиторій:
   ```
   git clone https://github.com/your-username/telegram-music-bot.git
   cd telegram-music-bot
   ```

2. Встановіть залежності:
   ```
   npm install
   ```

3. Створіть файл `.env` і додайте необхідні змінні середовища:
   ```
   TELEGRAM_TOKEN=your_telegram_token_here
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   ```

## Запуск

### Звичайний запуск

```
npm start
```

### Запуск в режимі розробки

```
npm run dev
```

### Запуск у фоновому режимі

```
chmod +x run_forever.sh
./run_forever.sh
```

## Keep-Alive механізм

Бот використовує вбудований веб-сервер для підтримки активності на хостингах, таких як Replit. 
Для забезпечення 24/7 роботи рекомендується налаштувати зовнішній моніторинг-сервіс, такий як UptimeRobot,
для регулярних пінгів вашого URL.

## Залежності

- node-telegram-bot-api - для роботи з Telegram Bot API
- ytdl-core - для завантаження з YouTube
- spotify-web-api-node - для роботи з Spotify API
- express - для keep-alive веб-сервера
- dotenv - для керування змінними середовища
- fs-extra - для роботи з файловою системою
- uuid - для генерації унікальних ідентифікаторів
- axios - для HTTP-запитів

## Команди бота

- `/start` - Почати роботу з ботом
- `/help` - Отримати довідку
- `/about` - Інформація про бота
- `/stats` - Статистика завантажень

## Ліцензія

MIT