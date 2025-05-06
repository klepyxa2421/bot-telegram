const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

/**
 * Форматує розмір файлу з байтів у людино-читабельний формат
 * @param {number} sizeBytes - Розмір у байтах
 * @returns {string} Форматований розмір з одиницями виміру
 */
function formatFileSize(sizeBytes) {
  if (sizeBytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(sizeBytes) / Math.log(k));
  
  return `${parseFloat((sizeBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Видаляє тимчасові файли
 * @param {string} filePath - Повний шлях до файлу для видалення (якщо вказано)
 */
async function cleanupTempFiles(filePath = null) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.unlink(filePath);
      console.log(`Видалено файл: ${filePath}`);
    }
  } catch (error) {
    console.error(`Помилка при видаленні файлу ${filePath}:`, error);
  }
}

/**
 * Очищує всі файли у тимчасовій директорії
 */
async function clearTempDirectory() {
  try {
    if (!fs.existsSync(config.TEMP_DIR)) {
      await fs.mkdir(config.TEMP_DIR, { recursive: true });
      console.log(`Створено директорію: ${config.TEMP_DIR}`);
      return;
    }
    
    const files = await fs.readdir(config.TEMP_DIR);
    for (const file of files) {
      const filePath = path.join(config.TEMP_DIR, file);
      await fs.unlink(filePath);
      console.log(`Видалено файл: ${filePath}`);
    }
    console.log('Тимчасова директорія очищена');
  } catch (error) {
    console.error('Помилка при очищенні тимчасової директорії:', error);
  }
}

module.exports = {
  formatFileSize,
  cleanupTempFiles,
  clearTempDirectory
};