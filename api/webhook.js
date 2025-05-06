/**
 * Webhook для Telegram бота для роботи на Vercel
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// Імпортуємо необхідні модулі
const config = require('../config');
const downloader = require('../downloader');
const utils = require('../utils');
const stats = require('../stats');

// Ініціалізуємо Express додаток
const app = express();
app.use(express.json());

// Перевіряємо наявність токену
if (!process.env.TELEGRAM_TOKEN) {
  throw new Error('TELEGRAM_TOKEN не знайдено в змінних середовища.');
}

// Створюємо бота (без polling, тільки webhook)
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);

// Обробники команд бота
async function handleStartCommand(msg) {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  
  // Оновлюємо статистику користувача
  stats.updateUserSeen(msg.from.id.toString());
  
  const welcomeMessage = `
Привіт, ${firstName}! 👋

Я @phasegym_bot - твій помічник для завантаження музики з інтернету! 🎵

Просто надішли мені посилання на трек з YouTube, SoundCloud або Spotify, і я відправлю тобі аудіофайл.

Використовуй команду /help для отримання додаткової інформації.
  `;
  
  await bot.sendMessage(chatId, welcomeMessage);
}

async function handleHelpCommand(msg) {
  const chatId = msg.chat.id;
  
  // Оновлюємо статистику користувача
  stats.updateUserSeen(msg.from.id.toString());
  
  const helpMessage = `
📋 *Довідка по використанню бота @phasegym_bot*

Цей бот дозволяє завантажувати музику з популярних платформ.

*Підтримувані платформи:*
• YouTube
• SoundCloud
• Spotify

*Як користуватися:*
1. Скопіюйте посилання на трек з однієї з підтримуваних платформ
2. Відправте посилання боту
3. Дочекайтеся завантаження та отримайте аудіофайл

*Обмеження:*
• Максимальна тривалість треку: ${config.MAX_DURATION_MINUTES} хвилин
• Максимальний розмір файлу: ${Math.floor(config.MAX_TELEGRAM_FILE_SIZE/1024/1024)} МБ

*Доступні команди:*
/start - Почати роботу з ботом
/help - Отримати цю довідку
/about - Інформація про бота
/stats - Ваша статистика завантажень

*Питання та пропозиції:* @username_тут

Бажаємо приємного користування! 🎵
  `;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}

async function handleAboutCommand(msg) {
  const chatId = msg.chat.id;
  
  // Оновлюємо статистику користувача
  stats.updateUserSeen(msg.from.id.toString());
  
  const aboutMessage = `
ℹ️ *Про бота @phasegym_bot*

Версія: 1.0.0

Цей бот розроблено для зручного завантаження музики з популярних платформ.

*Функції:*
• Завантаження аудіо з YouTube
• Завантаження треків з SoundCloud
• Завантаження музики зі Spotify

*Технічна інформація:*
Бот розроблено з використанням Node.js та Telegram Bot API.

*Розробник:*
@username_тут

Дякуємо за використання нашого бота! 🎵
  `;
  
  await bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
}

async function handleStatsCommand(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Оновлюємо статистику користувача
  stats.updateUserSeen(userId);
  
  // Отримуємо статистику користувача
  const userStats = stats.getUserStats(userId);
  
  // Отримуємо глобальну статистику
  const globalStats = stats.getGlobalStats();
  
  let statsMessage = `
📊 *Ваша статистика завантажень:*

Загальна кількість завантажень: ${userStats.downloads}

`;

  // Додаємо популярні треки користувача, якщо є
  if (userStats.popular_tracks.length > 0) {
    statsMessage += `*Найчастіше ви завантажували:*\n`;
    userStats.popular_tracks.forEach((track, index) => {
      statsMessage += `${index + 1}. ${track.artist} - ${track.title} (${track.count} разів)\n`;
    });
    statsMessage += '\n';
  }
  
  // Додаємо глобальну статистику
  statsMessage += `
*Глобальна статистика:*
Загальна кількість завантажень: ${globalStats.total_downloads}
Кількість користувачів: ${globalStats.user_count}

*Популярні треки:*
`;
  
  // Додаємо глобально популярні треки
  if (globalStats.popular_tracks.length > 0) {
    globalStats.popular_tracks.forEach((track, index) => {
      statsMessage += `${index + 1}. ${track.artist} - ${track.title} (${track.count} разів)\n`;
    });
  } else {
    statsMessage += 'Поки немає даних\n';
  }
  
  await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
}

// Обробник URL-повідомлень
async function handleUrlMessage(msg) {
  // Якщо це команда - ігноруємо
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }
  
  // Якщо це посилання
  if (msg.text) {
    const text = msg.text.trim();
    const chatId = msg.chat.id;
    
    // Оновлюємо статистику користувача
    stats.updateUserSeen(msg.from.id.toString());
    
    // Перевіряємо чи це валідний URL
    if (downloader.isValidUrl(text)) {
      // Визначаємо платформу
      const platform = downloader.detectPlatform(text);
      
      if (!platform) {
        await bot.sendMessage(chatId, config.ERROR_MESSAGES.UNSUPPORTED_PLATFORM);
        return;
      }
      
      // Відправляємо повідомлення про початок завантаження
      const loadingMessage = await bot.sendMessage(
        chatId, 
        `🔄 Отримую інформацію про трек...\n\nПлатформа: ${platform}`
      );
      
      try {
        // Завантажуємо трек в залежності від платформи
        let downloadInfo;
        
        if (platform === 'youtube') {
          await bot.editMessageText(
            '🔄 Завантажую трек з YouTube... Це може зайняти деякий час.', 
            { chat_id: chatId, message_id: loadingMessage.message_id }
          );
          downloadInfo = await downloader.downloadFromYoutube(text);
        } else if (platform === 'soundcloud') {
          await bot.editMessageText(
            '🔄 Завантажую трек з SoundCloud... Це може зайняти деякий час.', 
            { chat_id: chatId, message_id: loadingMessage.message_id }
          );
          downloadInfo = await downloader.downloadFromSoundcloud(text);
        } else if (platform === 'spotify') {
          await bot.editMessageText(
            '🔄 Знаходжу трек зі Spotify... Це може зайняти деякий час.', 
            { chat_id: chatId, message_id: loadingMessage.message_id }
          );
          downloadInfo = await downloader.downloadFromSpotify(text);
        }
        
        // Відправляємо повідомлення про успішне завантаження
        await bot.editMessageText(
          `✅ Трек завантажено! Відправляю файл...\n\nНазва: ${downloadInfo.title}\nВиконавець: ${downloadInfo.artist}\nТривалість: ${downloadInfo.duration}\nРозмір: ${utils.formatFileSize(downloadInfo.fileSize)}`, 
          { chat_id: chatId, message_id: loadingMessage.message_id }
        );
        
        // Відправляємо аудіофайл
        await bot.sendAudio(chatId, downloadInfo.filePath, {
          caption: `🎵 ${downloadInfo.artist} - ${downloadInfo.title}\n\nЗавантажено через @phasegym_bot`,
          performer: downloadInfo.artist,
          title: downloadInfo.title
        });
        
        // Записуємо статистику завантаження
        stats.recordDownload(
          msg.from.id.toString(),
          downloadInfo.title,
          downloadInfo.artist,
          downloadInfo.platform
        );
        
        // Видаляємо тимчасовий файл
        await utils.cleanupTempFiles(downloadInfo.filePath);
        
      } catch (error) {
        console.error('Error downloading:', error);
        
        // Відправляємо повідомлення про помилку
        if (error.message === 'TOO_LONG') {
          await bot.editMessageText(
            config.ERROR_MESSAGES.TOO_LONG, 
            { chat_id: chatId, message_id: loadingMessage.message_id }
          );
        } else if (error.message === 'TOO_LARGE') {
          await bot.editMessageText(
            config.ERROR_MESSAGES.TOO_LARGE, 
            { chat_id: chatId, message_id: loadingMessage.message_id }
          );
        } else if (error.message === 'SPOTIFY_UNAVAILABLE') {
          await bot.editMessageText(
            config.ERROR_MESSAGES.SPOTIFY_UNAVAILABLE, 
            { chat_id: chatId, message_id: loadingMessage.message_id }
          );
        } else {
          await bot.editMessageText(
            config.ERROR_MESSAGES.DOWNLOAD_FAILED, 
            { chat_id: chatId, message_id: loadingMessage.message_id }
          );
        }
      }
    } else {
      // Якщо це не URL - ігноруємо або відправляємо підказку
      if (text.includes('http') || text.includes('www')) {
        await bot.sendMessage(chatId, config.ERROR_MESSAGES.INVALID_URL);
      }
    }
  }
}

// Головний обробник вхідних запитів від Telegram
async function handleUpdate(update) {
  try {
    // Обробка команд
    if (update.message && update.message.text) {
      const text = update.message.text;
      
      if (text === '/start') {
        await handleStartCommand(update.message);
      } else if (text === '/help') {
        await handleHelpCommand(update.message);
      } else if (text === '/about') {
        await handleAboutCommand(update.message);
      } else if (text === '/stats') {
        await handleStatsCommand(update.message);
      } else {
        // Обробка URL
        await handleUrlMessage(update.message);
      }
    }
  } catch (error) {
    console.error('Помилка при обробці оновлення:', error);
  }
}

// Серверлесс-функція для обробки вебхуків
module.exports = async (req, res) => {
  // Відповідь на запити перевірки здоров'я
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Telegram Music Bot is running!' });
  }
  
  // Обробка вебхука від Telegram
  if (req.method === 'POST') {
    const update = req.body;
    
    // Відправляємо відповідь негайно
    res.status(200).end();
    
    // Обробляємо оновлення асинхронно
    await handleUpdate(update);
  } else {
    res.status(405).end(); // Method Not Allowed
  }
};

// Ініціалізація Vercel Dev для локального тестування
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  
  // Ендпоінт для вебхука
  app.post('/api/webhook', async (req, res) => {
    await module.exports(req, res);
  });
  
  // Ендпоінт для перевірки здоров'я
  app.get('/api/webhook', async (req, res) => {
    await module.exports(req, res);
  });
  
  // Запуск сервера
  app.listen(port, () => {
    console.log(`Локальний сервер запущено на порту ${port}`);
    console.log(`Для налаштування вебхука використовуйте URL: https://[your-vercel-url]/api/webhook`);
  });
}