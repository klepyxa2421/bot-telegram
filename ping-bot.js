/**
 * Скрипт для підтримки роботи бота через періодичні пінги.
 * Запускається в окремому потоці і періодично виконує запити
 * до веб-сервера keep-alive, щоб підтримувати його активним.
 */

const axios = require('axios');

/**
 * Виконує запит до локального веб-сервера
 * @returns {Promise<void>}
 */
async function pingServer() {
  const url = "http://localhost:8080/health";
  try {
    const response = await axios.get(url, { timeout: 5000 });
    if (response.status === 200) {
      console.log("Ping successful");
    } else {
      console.warn(`Ping failed with status code: ${response.status}`);
    }
  } catch (error) {
    console.error(`Ping error: ${error.message}`);
  }
}

/**
 * Запускає pinger як інтервал
 * @param {number} intervalMinutes - Інтервал в хвилинах
 * @returns {number} - ID інтервалу
 */
function startPinger(intervalMinutes = 5) {
  console.log("Starting pinger");
  
  // Негайно виконуємо перший пінг
  pingServer().catch(error => console.error(`Initial ping error: ${error.message}`));
  
  // Встановлюємо інтервал для регулярних пінгів
  const interval = setInterval(() => {
    pingServer().catch(error => console.error(`Pinger error: ${error.message}`));
  }, intervalMinutes * 60 * 1000);
  
  console.log(`Pinger started with ${intervalMinutes} minutes interval`);
  return interval;
}

module.exports = {
  startPinger
};