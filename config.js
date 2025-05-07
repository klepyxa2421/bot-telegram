// Завантаження змінних середовища з .env файлу
require('dotenv').config();
const path = require('path');

// Конфігурація бота
module.exports = {
  // Токен Telegram бота
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  
  // Spotify API credentials
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  
  // Налаштування шляхів
  TEMP_DIR: path.resolve(__dirname, 'temp_downloads'),
  
  // Обмеження на файли
  MAX_TELEGRAM_FILE_SIZE: 50 * 1024 * 1024, // 50 МБ максимальний розмір файлу для Telegram
  MAX_DURATION_MINUTES: 20, // Максимальна тривалість відео/аудіо для завантаження
  
  // Налаштування веб-сервера keep-alive
  PORT: process.env.PORT || 8080,
  
  // Повідомлення про помилки
  ERROR_MESSAGES: {
    SPOTIFY_UNAVAILABLE: "⚠️ На жаль, сервіс Spotify тимчасово недоступний. Спробуйте пізніше або використайте інші платформи.",
    DOWNLOAD_FAILED: "❌ Помилка завантаження. Спробуйте інше посилання або звернітьсь пізніше.",
    TOO_LARGE: "⚠️ Файл занадто великий для відправки через Telegram (>50 МБ).",
    TOO_LONG: "⚠️ Відео занадто довге. Максимальна тривалість - 20 хвилин.",
    INVALID_URL: "❌ Невірне посилання. Будь ласка, надішліть коректне посилання на YouTube, SoundCloud або Spotify.",
    UNSUPPORTED_PLATFORM: "❌ Ця платформа не підтримується. Підтримуються: YouTube, SoundCloud та Spotify."
  },
};
