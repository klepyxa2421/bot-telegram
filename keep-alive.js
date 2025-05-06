/**
 * Модуль для забезпечення постійної роботи боту в середовищі Replit
 * Використовує простий веб-сервер Express, який отримує періодичні пінги
 * від зовнішнього сервісу (такого як UptimeRobot)
 */

const express = require('express');
const http = require('http');
const config = require('./config');

// Створюємо Express додаток
const app = express();

// Головна сторінка з інформацією про бота
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Telegram Music Bot Status</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              color: #333;
              margin: 20px;
              text-align: center;
          }
          .container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              padding: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
              color: #4CAF50;
          }
          .status {
              padding: 10px;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              background-color: #e8f5e9;
              color: #2e7d32;
          }
          .platforms {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin: 20px 0;
          }
          .platform {
              padding: 10px;
              border-radius: 5px;
              background-color: #f1f1f1;
          }
          ul {
              text-align: left;
              display: inline-block;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>🎵 Telegram Music Bot</h1>
          
          <div class="status">
              ✅ Бот працює та очікує на запити
          </div>
          
          <p>Бот @phasegym_bot дозволяє завантажувати музику з різних платформ, надсилаючи посилання в Telegram.</p>
          
          <div class="platforms">
              <div class="platform" style="color: #FF0000;">YouTube ✅</div>
              <div class="platform" style="color: #FF7700;">SoundCloud ✅</div>
              <div class="platform" style="color: #1DB954;">Spotify ✅</div>
          </div>
          
          <h3>Доступні команди:</h3>
          <ul>
              <li><code>/start</code> - Розпочати роботу з ботом</li>
              <li><code>/help</code> - Отримати допомогу щодо використання</li>
              <li><code>/about</code> - Інформація про бота</li>
              <li><code>/stats</code> - Переглянути статистику завантажень</li>
          </ul>
      </div>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Ендпоінт перевірки здоров'я для моніторингових сервісів
app.get('/health', (req, res) => {
  res.send('OK');
});

/**
 * Запуск веб-сервера
 */
function startKeepAliveServer() {
  const port = config.PORT;
  const server = http.createServer(app);
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`Keep-alive server started on port ${port}`);
  });
  
  return server;
}

module.exports = {
  startKeepAliveServer
};