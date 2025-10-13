#!/usr/bin/env node

/**
 * Скрипт для очистки PWA кэша на продакшн сервере
 * Использование: node scripts/clear-pwa-cache-production.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Очистка PWA кэша на продакшн сервере...');

// Пути к файлам кэша
const cachePaths = [
  '.nuxt/dist/client/sw.js',
  '.nuxt/dist/client/workbox-*.js',
  '.nuxt/dist/client/manifest.webmanifest',
  '.output/public/sw.js',
  '.output/public/workbox-*.js',
  '.output/public/manifest.webmanifest',
  'dist/sw.js',
  'dist/workbox-*.js',
  'dist/manifest.webmanifest'
];

// Функция для удаления файлов по паттерну
function removeFilesByPattern(pattern) {
  try {
    const dir = path.dirname(pattern);
    const filename = path.basename(pattern);
    
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const regex = new RegExp(filename.replace(/\*/g, '.*'));
      
      files.forEach(file => {
        if (regex.test(file)) {
          const filePath = path.join(dir, file);
          try {
            fs.unlinkSync(filePath);
            console.log(`✅ Удален: ${filePath}`);
          } catch (err) {
            console.log(`⚠️ Не удалось удалить: ${filePath} - ${err.message}`);
          }
        }
      });
    }
  } catch (err) {
    console.log(`⚠️ Ошибка при обработке паттерна ${pattern}: ${err.message}`);
  }
}

// Удаляем файлы кэша
cachePaths.forEach(pattern => {
  removeFilesByPattern(pattern);
});

// Очищаем кэш браузера (инструкции для пользователей)
console.log('\n📋 Инструкции для очистки кэша браузера:');
console.log('1. Откройте DevTools (F12)');
console.log('2. Перейдите в Application > Storage');
console.log('3. Нажмите "Clear storage"');
console.log('4. Или выполните в консоли:');
console.log('   navigator.serviceWorker.getRegistrations().then(registrations => {');
console.log('     registrations.forEach(registration => registration.unregister());');
console.log('   });');
console.log('   caches.keys().then(names => {');
console.log('     names.forEach(name => caches.delete(name));');
console.log('   });');

console.log('\n✅ Очистка PWA кэша завершена!');
console.log('🔄 Перезапустите сервер для применения изменений.');
