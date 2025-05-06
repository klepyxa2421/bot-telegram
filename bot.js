/**
 * Телеграм-бот для завантаження музики
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const downloader = require('./downloader');
const utils = require('./utils');
const stats = require('./stats');

// Клас Bot для інкапсуляції функціональності
class MusicBot {
  constructor(token) {
    // Створюємо клієнт бота з опцією polling
    this.bot = new TelegramBot(token, { polling: true });
    
    // Ініціалізуємо тимчасову директорію
    this.initTempDirectory();
    
    // Встановлюємо обробники команд та повідомлень
    this.setupCommandHandlers();
    this.setupMessageHandlers();
    
    console.log('Telegram bot initialized');
  }
  
  /**
   * Ініціалізує тимчасову директорію
   */
  async initTempDirectory() {
    try {
      if (!fs.existsSync(config.TEMP_DIR)) {
        await fs.mkdir(config.TEMP_DIR, { recursive: true });
        console.log(`Created temporary directory: ${config.TEMP_DIR}`);
      }
    } catch (error) {
      console.error('Error creating temporary directory:', error);
    }
  }
  
  /**
   * Встановлює обробники команд бота
   */
  setupCommandHandlers() {
    // Команда /start - привітання
    this.bot.onText(/\/start/, async (msg) => {
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
      
      await this.bot.sendMessage(chatId, welcomeMessage);
    });
    
    // Команда /help - довідка
    this.bot.onText(/\/help/, async (msg) => {
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
      
      await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });
    
    // Команда /about - інформація про бота
    this.bot.onText(/\/about/, async (msg) => {
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
      
      await this.bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
    });
    
    // Команда /stats - статистика завантажень
    this.bot.onText(/\/stats/, async (msg) => {
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
      
      await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
    });
  }
  
  /**
   * Встановлює обробники повідомлень бота
   */
  setupMessageHandlers() {
    // Обробник URL повідомлень
    this.bot.on('message', async (msg) => {
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
            await this.bot.sendMessage(chatId, config.ERROR_MESSAGES.UNSUPPORTED_PLATFORM);
            return;
          }
          
          // Відправляємо повідомлення про початок завантаження
          const loadingMessage = await this.bot.sendMessage(
            chatId, 
            `🔄 Отримую інформацію про трек...\n\nПлатформа: ${platform}`
          );
          
          try {
            // Завантажуємо трек в залежності від платформи
            let downloadInfo;
            
            if (platform === 'youtube') {
              await this.bot.editMessageText(
                '🔄 Завантажую трек з YouTube... Це може зайняти деякий час.', 
                { chat_id: chatId, message_id: loadingMessage.message_id }
              );
              downloadInfo = await downloader.downloadFromYoutube(text);
            } else if (platform === 'soundcloud') {
              await this.bot.editMessageText(
                '🔄 Завантажую трек з SoundCloud... Це може зайняти деякий час.', 
                { chat_id: chatId, message_id: loadingMessage.message_id }
              );
              downloadInfo = await downloader.downloadFromSoundcloud(text);
            } else if (platform === 'spotify') {
              await this.bot.editMessageText(
                '🔄 Знаходжу трек зі Spotify... Це може зайняти деякий час.', 
                { chat_id: chatId, message_id: loadingMessage.message_id }
              );
              downloadInfo = await downloader.downloadFromSpotify(text);
            }
            
            // Відправляємо повідомлення про успішне завантаження
            await this.bot.editMessageText(
              `✅ Трек завантажено! Відправляю файл...\n\nНазва: ${downloadInfo.title}\nВиконавець: ${downloadInfo.artist}\nТривалість: ${downloadInfo.duration}\nРозмір: ${utils.formatFileSize(downloadInfo.fileSize)}`, 
              { chat_id: chatId, message_id: loadingMessage.message_id }
            );
            
            // Відправляємо аудіофайл
            await this.bot.sendAudio(chatId, downloadInfo.filePath, {
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
              await this.bot.editMessageText(
                config.ERROR_MESSAGES.TOO_LONG, 
                { chat_id: chatId, message_id: loadingMessage.message_id }
              );
            } else if (error.message === 'TOO_LARGE') {
              await this.bot.editMessageText(
                config.ERROR_MESSAGES.TOO_LARGE, 
                { chat_id: chatId, message_id: loadingMessage.message_id }
              );
            } else if (error.message === 'SPOTIFY_UNAVAILABLE') {
              await this.bot.editMessageText(
                config.ERROR_MESSAGES.SPOTIFY_UNAVAILABLE, 
                { chat_id: chatId, message_id: loadingMessage.message_id }
              );
            } else {
              await this.bot.editMessageText(
                config.ERROR_MESSAGES.DOWNLOAD_FAILED, 
                { chat_id: chatId, message_id: loadingMessage.message_id }
              );
            }
          }
        } else {
          // Якщо це не URL - ігноруємо або відправляємо підказку
          if (text.includes('http') || text.includes('www')) {
            await this.bot.sendMessage(chatId, config.ERROR_MESSAGES.INVALID_URL);
          }
        }
      }
    });
    
    // Обробка помилок
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }
  
  /**
   * Запуск бота
   */
  start() {
    console.log('Bot started. Running forever...');
  }
}

/**
 * Створює і запускає бота
 * @returns {MusicBot} Екземпляр бота
 */
function setupBot() {
  if (!config.TELEGRAM_TOKEN) {
    throw new Error('TELEGRAM_TOKEN не налаштовано. Будь ласка, встановіть змінні середовища.');
  }
  
  // Перевіряємо наявність тимчасової директорії
  if (!fs.existsSync(config.TEMP_DIR)) {
    fs.mkdirSync(config.TEMP_DIR, { recursive: true });
  }
  
  // Створюємо та запускаємо бота
  const bot = new MusicBot(config.TELEGRAM_TOKEN);
  bot.start();
  
  return bot;
}

module.exports = {
  setupBot
};