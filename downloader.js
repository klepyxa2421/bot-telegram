const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ytdl = require('ytdl-core');
const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const config = require('./config');
const utils = require('./utils');

// Spotify client setup
let spotifyClient = null;

/**
 * Ініціалізація Spotify клієнта
 * @returns {SpotifyWebApi|null} Повертає Spotify клієнт або null у випадку помилки
 */
function initializeSpotifyClient() {
  if (!config.SPOTIFY_CLIENT_ID || !config.SPOTIFY_CLIENT_SECRET) {
    console.warn('Spotify credentials not available. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.');
    return null;
  }

  console.log(`Initializing Spotify client with ID: ${config.SPOTIFY_CLIENT_ID.substring(0, 5)}...`);

  try {
    // Створюємо SpotifyWebApi клієнт
    const client = new SpotifyWebApi({
      clientId: config.SPOTIFY_CLIENT_ID,
      clientSecret: config.SPOTIFY_CLIENT_SECRET
    });

    // Отримуємо access token
    client.clientCredentialsGrant()
      .then(data => {
        console.log('Spotify access token отриманий успішно');
        client.setAccessToken(data.body.access_token);

        // Токен дійсний протягом 1 години, оновлюємо через 50 хвилин
        setTimeout(() => {
          console.log('Оновлюємо Spotify access token');
          initializeSpotifyClient();
        }, (data.body.expires_in - 600) * 1000);
      })
      .catch(error => {
        console.error('Помилка при отриманні Spotify access token:', error);
        return null;
      });

    return client;
  } catch (error) {
    console.error('Помилка при ініціалізації Spotify клієнта:', error);
    return null;
  }
}

/**
 * Перевіряє статус Spotify клієнта та реініціалізує його при необхідності
 */
function checkSpotifyStatus() {
  if (!spotifyClient) {
    console.log('Spotify клієнт не ініціалізовано, спроба ініціалізації...');
    spotifyClient = initializeSpotifyClient();
    return;
  }

  // Перевірка чи токен все ще дійсний
  spotifyClient.getMe()
    .catch(() => {
      console.log('Spotify token недійсний, реініціалізуємо клієнт');
      spotifyClient = initializeSpotifyClient();
    });
}

/**
 * Перевірка валідності URL
 * @param {string} url - URL для перевірки
 * @returns {boolean} - true якщо URL валідний
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Визначення платформи за URL
 * @param {string} url - URL для аналізу
 * @returns {string|null} - Назва платформи або null якщо не підтримується
 */
function detectPlatform(url) {
  if (!isValidUrl(url)) {
    return null;
  }

  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return 'youtube';
  } else if (hostname.includes('soundcloud.com')) {
    return 'soundcloud';
  } else if (hostname.includes('spotify.com')) {
    return 'spotify';
  }

  return null;
}

/**
 * Форматування тривалості з секунд у MM:SS формат
 * @param {number} seconds - Тривалість у секундах
 * @returns {string} - Відформатована тривалість
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Генерація тимчасового імені файлу
 * @param {string} extension - Розширення файлу
 * @returns {string} - Шлях до тимчасового файлу
 */
function getTempFilename(extension = 'mp3') {
  return path.join(config.TEMP_DIR, `${uuidv4()}.${extension}`);
}

/**
 * Завантаження аудіо з YouTube
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} - Інформація про завантажений файл
 */
async function downloadFromYoutube(url) {
  try {
    // Отримуємо інформацію про відео
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;
    
    // Перевіряємо тривалість
    const durationInSeconds = parseInt(videoDetails.lengthSeconds);
    if (durationInSeconds > config.MAX_DURATION_MINUTES * 60) {
      throw new Error('TOO_LONG');
    }
    
    // Вибираємо аудіо-формат найвищої якості
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    
    // Створюємо тимчасовий файл
    const tempFilePath = getTempFilename('mp3');
    
    // Завантажуємо аудіо
    await new Promise((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(info, { format: audioFormat });
      stream.pipe(fs.createWriteStream(tempFilePath));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    // Отримуємо розмір файлу
    const stats = await fs.stat(tempFilePath);
    if (stats.size > config.MAX_TELEGRAM_FILE_SIZE) {
      await utils.cleanupTempFiles(tempFilePath);
      throw new Error('TOO_LARGE');
    }
    
    return {
      filePath: tempFilePath,
      fileSize: stats.size,
      title: videoDetails.title,
      artist: videoDetails.author.name,
      duration: formatDuration(durationInSeconds),
      platform: 'YouTube'
    };
  } catch (error) {
    if (error.message === 'TOO_LONG' || error.message === 'TOO_LARGE') {
      throw error;
    }
    console.error('Помилка при завантаженні з YouTube:', error);
    throw new Error('DOWNLOAD_FAILED');
  }
}

/**
 * Завантаження аудіо з SoundCloud
 * @param {string} url - SoundCloud URL
 * @returns {Promise<Object>} - Інформація про завантажений файл
 */
async function downloadFromSoundcloud(url) {
  try {
    // У реальному додатку тут слід використовувати SoundCloud API
    // Оскільки SoundCloud API обмежений, тут спрощена реалізація
    
    // Для повної реалізації потрібно використати бібліотеку soundcloud-downloader
    // або аналогічну для отримання прямого посилання на аудіо
    
    // Для демонстрації просто повідомляємо про необхідність додаткових залежностей
    throw new Error('Для завантаження з SoundCloud потрібно використати додаткову бібліотеку. В повній реалізації використовуйте soundcloud-downloader.');
  } catch (error) {
    console.error('Помилка при завантаженні з SoundCloud:', error);
    throw new Error('DOWNLOAD_FAILED');
  }
}

/**
 * Завантаження аудіо зі Spotify (фактично шукає трек на YouTube)
 * @param {string} url - Spotify URL
 * @returns {Promise<Object>} - Інформація про завантажений файл
 */
async function downloadFromSpotify(url) {
  try {
    // Перевіряємо статус Spotify клієнта
    checkSpotifyStatus();
    
    if (!spotifyClient) {
      throw new Error('SPOTIFY_UNAVAILABLE');
    }
    
    // Отримуємо Spotify Track ID з URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const trackId = pathParts[pathParts.length - 1];
    
    // Отримуємо інформацію про трек
    const trackInfo = await spotifyClient.getTrack(trackId);
    
    if (!trackInfo || !trackInfo.body) {
      throw new Error('DOWNLOAD_FAILED');
    }
    
    const track = trackInfo.body;
    const title = track.name;
    const artist = track.artists.map(a => a.name).join(', ');
    
    // Шукаємо трек на YouTube (в реальному проекті слід використовувати YouTube API)
    const searchQuery = `${artist} - ${title} audio`;
    const youtubeUrl = await searchYoutubeVideo(searchQuery);
    
    if (!youtubeUrl) {
      throw new Error('DOWNLOAD_FAILED');
    }
    
    // Завантажуємо трек з YouTube
    const downloadInfo = await downloadFromYoutube(youtubeUrl);
    
    // Змінюємо інформацію про трек
    downloadInfo.title = title;
    downloadInfo.artist = artist;
    downloadInfo.platform = 'Spotify';
    
    return downloadInfo;
  } catch (error) {
    if (error.message === 'SPOTIFY_UNAVAILABLE' || 
        error.message === 'TOO_LONG' || 
        error.message === 'TOO_LARGE') {
      throw error;
    }
    console.error('Помилка при завантаженні зі Spotify:', error);
    throw new Error('DOWNLOAD_FAILED');
  }
}

/**
 * Пошук відео на YouTube за запитом
 * @param {string} query - Пошуковий запит
 * @returns {Promise<string>} - URL знайденого відео
 */
async function searchYoutubeVideo(query) {
  try {
    // В реальному проекті слід використовувати YouTube API
    // Ця реалізація є спрощеною для демонстрації
    console.log(`Пошук на YouTube: ${query}`);
    
    // Заглушка: повертаємо фіксований URL для демонстрації
    return "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  } catch (error) {
    console.error('Помилка при пошуку на YouTube:', error);
    return null;
  }
}

// Ініціалізуємо Spotify клієнт при завантаженні модуля
spotifyClient = initializeSpotifyClient();

module.exports = {
  downloadFromYoutube,
  downloadFromSoundcloud,
  downloadFromSpotify,
  detectPlatform,
  isValidUrl,
  checkSpotifyStatus,
  formatDuration
};