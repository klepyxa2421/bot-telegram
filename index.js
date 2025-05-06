/**
 * Головний файл для запуску бота
 */

const bot = require('./bot');
const keepAlive = require('./keep-alive');
const pingBot = require('./ping-bot');
const utils = require('./utils');

/**
 * Перевірка наявності необхідних змінних середовища
 */
function checkEnvironment() {
  const requiredEnvVars = ['TELEGRAM_TOKEN'];
  const missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these variables in .env file or in your environment');
    process.exit(1);
  }
  
  // Для Spotify змінні не є обов'язковими, але бажані
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.warn('Warning: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set.');
    console.warn('Spotify functionality will be limited.');
  }
}

/**
 * Головна функція для запуску бота
 */
async function main() {
  try {
    console.log('Initializing Telegram Music Bot...');
    
    // Перевіряємо оточення
    checkEnvironment();
    
    // Очищаємо тимчасову директорію
    await utils.clearTempDirectory();
    
    // Запускаємо веб-сервер для keep-alive
    keepAlive.startKeepAliveServer();
    
    // Запускаємо pinger для підтримки активності бота
    pingBot.startPinger();
    
    // Створюємо і запускаємо бота
    bot.setupBot();
    
    console.log('All services started successfully!');
    
  } catch (error) {
    console.error('Failed to start the bot:', error);
    process.exit(1);
  }
}

// Запускаємо головну функцію
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});