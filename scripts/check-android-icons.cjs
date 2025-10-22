#!/usr/bin/env node

/**
 * Простой скрипт для копирования существующих иконок Android приложения
 * Работает без ImageMagick, использует существующие файлы
 */

const fs = require('fs');
const path = require('path');

// Пути
const ANDROID_RES_PATH = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const PUBLIC_PATH = path.join(__dirname, '..', 'public');

// Конфигурация размеров
const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const SPLASH_SIZES = {
  'drawable-port-mdpi': { width: 320, height: 480 },
  'drawable-port-hdpi': { width: 480, height: 800 },
  'drawable-port-xhdpi': { width: 720, height: 1280 },
  'drawable-port-xxhdpi': { width: 1080, height: 1920 },
  'drawable-port-xxxhdpi': { width: 1440, height: 2560 },
  'drawable-land-mdpi': { width: 480, height: 320 },
  'drawable-land-hdpi': { width: 800, height: 480 },
  'drawable-land-xhdpi': { width: 1280, height: 720 },
  'drawable-land-xxhdpi': { width: 1920, height: 1080 },
  'drawable-land-xxxhdpi': { width: 2560, height: 1440 }
};

// Функции для вывода
function log(message) {
  console.log(`✅ ${message}`);
}

function warn(message) {
  console.log(`⚠️  ${message}`);
}

function error(message) {
  console.log(`❌ ${message}`);
}

// Проверяем существующие иконки
function checkExistingIcons() {
  console.log('🔍 Проверяем существующие иконки...');
  
  const existingIcons = {};
  
  Object.keys(ICON_SIZES).forEach(dir => {
    const dirPath = path.join(ANDROID_RES_PATH, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      existingIcons[dir] = files.filter(file => file.endsWith('.png'));
    }
  });
  
  return existingIcons;
}

// Проверяем существующие splash screen
function checkExistingSplash() {
  console.log('🔍 Проверяем существующие splash screen...');
  
  const existingSplash = {};
  
  Object.keys(SPLASH_SIZES).forEach(dir => {
    const dirPath = path.join(ANDROID_RES_PATH, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      existingSplash[dir] = files.filter(file => file.endsWith('.png'));
    }
  });
  
  return existingSplash;
}

// Создаем XML конфигурацию
function createXmlConfig() {
  console.log('⚙️ Создаем XML конфигурацию...');
  
  // Создаем директорию values если не существует
  const valuesDir = path.join(ANDROID_RES_PATH, 'values');
  if (!fs.existsSync(valuesDir)) {
    fs.mkdirSync(valuesDir, { recursive: true });
  }
  
  // Создаем директорию mipmap-anydpi-v26 если не существует
  const anydpiDir = path.join(ANDROID_RES_PATH, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) {
    fs.mkdirSync(anydpiDir, { recursive: true });
  }
  
  // ic_launcher_background.xml
  const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#293379</color>
</resources>`;
  
  const backgroundPath = path.join(valuesDir, 'ic_launcher_background.xml');
  fs.writeFileSync(backgroundPath, backgroundXml);
  log('Создан ic_launcher_background.xml');
  
  // ic_launcher.xml (адаптивная иконка)
  const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  const launcherPath = path.join(anydpiDir, 'ic_launcher.xml');
  fs.writeFileSync(launcherPath, launcherXml);
  log('Создан ic_launcher.xml');
  
  // ic_launcher_round.xml
  const roundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  const roundPath = path.join(anydpiDir, 'ic_launcher_round.xml');
  fs.writeFileSync(roundPath, roundXml);
  log('Создан ic_launcher_round.xml');
}

// Основная функция
function main() {
  console.log('🚀 Проверка иконок Android приложения');
  console.log('=====================================\n');
  
  // Проверяем существующие иконки
  const existingIcons = checkExistingIcons();
  const existingSplash = checkExistingSplash();
  
  // Выводим статистику
  console.log('\n📊 Статистика существующих файлов:');
  
  console.log('\n🎨 Иконки приложения:');
  Object.entries(existingIcons).forEach(([dir, files]) => {
    if (files.length > 0) {
      log(`${dir}: ${files.length} файлов (${files.join(', ')})`);
    } else {
      warn(`${dir}: файлы отсутствуют`);
    }
  });
  
  console.log('\n🖼️ Splash Screen:');
  Object.entries(existingSplash).forEach(([dir, files]) => {
    if (files.length > 0) {
      log(`${dir}: ${files.length} файлов (${files.join(', ')})`);
    } else {
      warn(`${dir}: файлы отсутствуют`);
    }
  });
  
  // Создаем XML конфигурацию
  createXmlConfig();
  
  // Проверяем logo.svg
  const logoPath = path.join(PUBLIC_PATH, 'logo.svg');
  if (fs.existsSync(logoPath)) {
    log(`Найден логотип: ${logoPath}`);
    console.log('📋 Логотип содержит:');
    console.log('   - Медицинский символ с крестом');
    console.log('   - Цвета: #293379 (темно-синий), #7ba8da (светло-синий)');
    console.log('   - Размер: 248.69x248.69px');
  } else {
    error(`Логотип не найден: ${logoPath}`);
  }
  
  console.log('\n📋 Рекомендации:');
  console.log('1. Для создания новых иконок установите ImageMagick');
  console.log('2. Затем запустите: npm run generate:icons');
  console.log('3. Или используйте онлайн генераторы иконок');
  console.log('4. Обновите проект: npm run cap:sync');
  
  console.log('\n🎉 Проверка завершена!');
}

// Запускаем скрипт
if (require.main === module) {
  main();
}

module.exports = { checkExistingIcons, checkExistingSplash, createXmlConfig };
