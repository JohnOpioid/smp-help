#!/usr/bin/env node

/**
 * Скрипт для автоматической генерации иконок Android приложения
 * Создает все необходимые размеры из одного исходного файла
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Пути
const ANDROID_RES_PATH = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const ICONS_SOURCE_PATH = path.join(__dirname, '..', 'assets', 'icons');
const PUBLIC_PATH = path.join(__dirname, '..', 'public');

// Проверяем наличие ImageMagick
function checkImageMagick() {
  try {
    execSync('magick -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    try {
      execSync('convert -version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Создаем директории
function createDirectories() {
  console.log('📁 Создаем директории...');
  
  // Создаем директории для иконок
  Object.keys(ICON_SIZES).forEach(dir => {
    const dirPath = path.join(ANDROID_RES_PATH, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Создана директория: ${dir}`);
    }
  });
  
  // Создаем директории для splash screen
  Object.keys(SPLASH_SIZES).forEach(dir => {
    const dirPath = path.join(ANDROID_RES_PATH, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Создана директория: ${dir}`);
    }
  });
}

// Генерируем иконки
function generateIcons(sourceIconPath) {
  console.log('🎨 Генерируем иконки...');
  
  Object.entries(ICON_SIZES).forEach(([dir, size]) => {
    const outputPath = path.join(ANDROID_RES_PATH, dir, 'ic_launcher.png');
    const foregroundPath = path.join(ANDROID_RES_PATH, dir, 'ic_launcher_foreground.png');
    const roundPath = path.join(ANDROID_RES_PATH, dir, 'ic_launcher_round.png');
    
    try {
      // Основная иконка
      execSync(`magick "${sourceIconPath}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'ignore' });
      
      // Foreground (для адаптивных иконок)
      execSync(`magick "${sourceIconPath}" -resize ${size}x${size} "${foregroundPath}"`, { stdio: 'ignore' });
      
      // Round иконка
      execSync(`magick "${sourceIconPath}" -resize ${size}x${size} "${roundPath}"`, { stdio: 'ignore' });
      
      console.log(`✅ Создана иконка ${size}x${size} в ${dir}`);
    } catch (error) {
      console.error(`❌ Ошибка создания иконки для ${dir}:`, error.message);
    }
  });
}

// Генерируем splash screen
function generateSplashScreens(sourceSplashPath, sourceIconPath) {
  console.log('🖼️ Генерируем splash screen...');
  
  Object.entries(SPLASH_SIZES).forEach(([dir, dimensions]) => {
    const outputPath = path.join(ANDROID_RES_PATH, dir, 'splash.png');
    
    try {
      if (fs.existsSync(sourceSplashPath)) {
        // Используем готовый PNG файл
        execSync(`magick "${sourceSplashPath}" -resize ${dimensions.width}x${dimensions.height}! "${outputPath}"`, { stdio: 'ignore' });
      } else {
        // Создаем splash screen из SVG логотипа
        const tempIconPath = path.join(ICONS_SOURCE_PATH, 'temp-icon.png');
        
        // Конвертируем SVG в PNG
        execSync(`magick "${sourceIconPath}" -resize 200x200 "${tempIconPath}"`, { stdio: 'ignore' });
        
        // Создаем splash screen с логотипом по центру
        execSync(`magick -size ${dimensions.width}x${dimensions.height} xc:"#f8fafc" "${tempIconPath}" -gravity center -composite "${outputPath}"`, { stdio: 'ignore' });
        
        // Удаляем временный файл
        if (fs.existsSync(tempIconPath)) {
          fs.unlinkSync(tempIconPath);
        }
      }
      
      console.log(`✅ Создан splash ${dimensions.width}x${dimensions.height} в ${dir}`);
    } catch (error) {
      console.error(`❌ Ошибка создания splash для ${dir}:`, error.message);
    }
  });
}

// Создаем XML конфигурацию
function createXmlConfig() {
  console.log('⚙️ Создаем XML конфигурацию...');
  
  // ic_launcher_background.xml
  const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#293379</color>
</resources>`;
  
  const backgroundPath = path.join(ANDROID_RES_PATH, 'values', 'ic_launcher_background.xml');
  fs.writeFileSync(backgroundPath, backgroundXml);
  console.log('✅ Создан ic_launcher_background.xml');
  
  // ic_launcher.xml (адаптивная иконка)
  const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  const launcherPath = path.join(ANDROID_RES_PATH, 'mipmap-anydpi-v26', 'ic_launcher.xml');
  fs.writeFileSync(launcherPath, launcherXml);
  console.log('✅ Создан ic_launcher.xml');
  
  // ic_launcher_round.xml
  const roundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  const roundPath = path.join(ANDROID_RES_PATH, 'mipmap-anydpi-v26', 'ic_launcher_round.xml');
  fs.writeFileSync(roundPath, roundXml);
  console.log('✅ Создан ic_launcher_round.xml');
}

// Основная функция
function main() {
  console.log('🚀 Генератор иконок Android приложения');
  console.log('=====================================\n');
  
  // Проверяем ImageMagick
  if (!checkImageMagick()) {
    console.error('❌ ImageMagick не найден!');
    console.log('Установите ImageMagick: https://imagemagick.org/script/download.php');
    process.exit(1);
  }
  
  // Проверяем исходные файлы
  const sourceIconPath = path.join(PUBLIC_PATH, 'logo.svg');
  const sourceSplashPath = path.join(ICONS_SOURCE_PATH, 'splash-screen.png');
  
  if (!fs.existsSync(sourceIconPath)) {
    console.error(`❌ Исходная иконка не найдена: ${sourceIconPath}`);
    console.log('Убедитесь, что файл logo.svg существует в папке public/');
    process.exit(1);
  }
  
  if (!fs.existsSync(sourceSplashPath)) {
    console.error(`❌ Исходный splash screen не найден: ${sourceSplashPath}`);
    console.log('Создайте файл splash-screen.png (1080x1920px) в папке assets/icons/');
    console.log('Или используйте существующий logo.svg для создания splash screen');
    process.exit(1);
  }
  
  try {
    // Создаем директории
    createDirectories();
    
    // Генерируем иконки
    generateIcons(sourceIconPath);
    
    // Генерируем splash screen
    generateSplashScreens(sourceSplashPath, sourceIconPath);
    
    // Создаем XML конфигурацию
    createXmlConfig();
    
    console.log('\n🎉 Все иконки успешно созданы!');
    console.log('📱 Теперь выполните: npm run cap:sync');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

// Запускаем скрипт
if (require.main === module) {
  main();
}

module.exports = { generateIcons, generateSplashScreens, createXmlConfig };
