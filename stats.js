const fs = require('fs-extra');
const path = require('path');

// Шлях до файлу зі статистикою
const STATS_FILE = path.join(__dirname, 'user_stats.json');

// Базова структура для статистики
const statsTemplate = {
  users: {},             // Дані за користувачами
  downloads: {},         // Інформація про завантаження
  popular_tracks: [],    // Популярні треки
  total_downloads: 0     // Загальна кількість завантажень
};

// Поточний стан статистики
let stats = { ...statsTemplate };

/**
 * Завантаження статистики з файлу
 */
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf8');
      stats = JSON.parse(data);
      console.log('Статистика успішно завантажена');
    } else {
      console.log('Файл статистики не знайдено, створено нову структуру');
      saveStats(); // Створити файл з порожньою статистикою
    }
  } catch (error) {
    console.error('Помилка при завантаженні статистики:', error);
    stats = { ...statsTemplate }; // Скидаємо до базової структури у випадку помилки
    saveStats(); // Зберігаємо нову структуру
  }
}

/**
 * Збереження статистики у файл
 */
function saveStats() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
  } catch (error) {
    console.error('Помилка при збереженні статистики:', error);
  }
}

/**
 * Оновлення часу останнього використання бота користувачем
 * @param {string} userId - ID користувача Telegram
 */
function updateUserSeen(userId) {
  const now = new Date().toISOString();
  
  if (!stats.users[userId]) {
    stats.users[userId] = {
      first_seen: now,
      last_seen: now,
      downloads: 0,
      downloaded_tracks: {}
    };
  } else {
    stats.users[userId].last_seen = now;
  }
  
  saveStats();
}

/**
 * Створення унікального ключа для треку
 * @param {string} title - Назва треку
 * @param {string} artist - Виконавець
 * @returns {string} - Унікальний ключ
 */
function getTrackKey(title, artist) {
  return `${artist || 'Unknown'} - ${title || 'Untitled'}`.toLowerCase();
}

/**
 * Запис інформації про завантаження треку
 * @param {string} userId - ID користувача Telegram
 * @param {string} title - Назва треку
 * @param {string} artist - Виконавець
 * @param {string} platform - Платформа (YouTube, Spotify, SoundCloud)
 */
function recordDownload(userId, title, artist, platform) {
  const trackKey = getTrackKey(title, artist);
  const now = new Date().toISOString();
  
  // Оновлюємо статистику користувача
  if (!stats.users[userId]) {
    updateUserSeen(userId);
  }
  
  stats.users[userId].downloads += 1;
  
  // Додаємо трек до завантажень користувача
  if (!stats.users[userId].downloaded_tracks[trackKey]) {
    stats.users[userId].downloaded_tracks[trackKey] = {
      count: 1,
      last_download: now,
      platform: platform,
      title: title,
      artist: artist
    };
  } else {
    stats.users[userId].downloaded_tracks[trackKey].count += 1;
    stats.users[userId].downloaded_tracks[trackKey].last_download = now;
  }
  
  // Оновлюємо загальну статистику завантажень
  if (!stats.downloads[trackKey]) {
    stats.downloads[trackKey] = {
      count: 1,
      title: title,
      artist: artist,
      platform: platform,
      last_download: now
    };
  } else {
    stats.downloads[trackKey].count += 1;
    stats.downloads[trackKey].last_download = now;
  }
  
  // Оновлюємо загальну кількість завантажень
  stats.total_downloads += 1;
  
  // Оновлюємо список популярних треків
  updatePopularTracks();
  
  // Зберігаємо зміни
  saveStats();
}

/**
 * Оновлення списку популярних треків
 * @param {number} limit - Кількість треків у списку
 */
function updatePopularTracks(limit = 10) {
  const tracks = Object.entries(stats.downloads)
    .map(([key, data]) => ({
      key,
      title: data.title,
      artist: data.artist,
      count: data.count,
      platform: data.platform
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  stats.popular_tracks = tracks;
}

/**
 * Отримання статистики користувача
 * @param {string} userId - ID користувача Telegram
 * @returns {Object} - Статистика користувача
 */
function getUserStats(userId) {
  if (!stats.users[userId]) {
    return {
      downloads: 0,
      popular_tracks: []
    };
  }
  
  // Отримуємо топ-5 треків користувача
  const userTracks = Object.entries(stats.users[userId].downloaded_tracks)
    .map(([key, data]) => ({
      title: data.title,
      artist: data.artist,
      count: data.count,
      platform: data.platform
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    downloads: stats.users[userId].downloads,
    popular_tracks: userTracks
  };
}

/**
 * Отримання глобальної статистики
 * @returns {Object} - Глобальна статистика
 */
function getGlobalStats() {
  return {
    total_downloads: stats.total_downloads,
    user_count: Object.keys(stats.users).length,
    popular_tracks: stats.popular_tracks.slice(0, 5)
  };
}

// Завантажуємо статистику при старті
loadStats();

module.exports = {
  updateUserSeen,
  recordDownload,
  getUserStats,
  getGlobalStats
};