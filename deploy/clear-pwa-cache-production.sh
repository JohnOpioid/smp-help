#!/bin/bash

# Скрипт очистки PWA кэша для продакшн сервера
# Использование: bash scripts/clear-pwa-cache-production.sh

echo "🧹 Очистка PWA кэша на продакшн сервере..."

# Пути к файлам кэша
CACHE_PATHS=(
    ".nuxt/dist/client/sw.js"
    ".nuxt/dist/client/workbox-*.js"
    ".nuxt/dist/client/manifest.webmanifest"
    ".output/public/sw.js"
    ".output/public/workbox-*.js"
    ".output/public/manifest.webmanifest"
    "dist/sw.js"
    "dist/workbox-*.js"
    "dist/manifest.webmanifest"
)

# Функция для удаления файлов
remove_files() {
    local pattern="$1"
    local dir=$(dirname "$pattern")
    local filename=$(basename "$pattern")
    
    if [ -d "$dir" ]; then
        # Заменяем * на .* для regex
        local regex=$(echo "$filename" | sed 's/\*/.*/')
        
        # Находим и удаляем файлы
        find "$dir" -name "$filename" -type f -delete 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ Очищены файлы по паттерну: $pattern"
        else
            echo "⚠️ Не удалось очистить: $pattern"
        fi
    fi
}

# Удаляем файлы кэша
for pattern in "${CACHE_PATHS[@]}"; do
    remove_files "$pattern"
done

# Очищаем кэш npm (опционально)
if command -v npm &> /dev/null; then
    echo "🧹 Очистка npm кэша..."
    npm cache clean --force 2>/dev/null || true
fi

echo ""
echo "📋 Инструкции для очистки кэша браузера:"
echo "1. Откройте DevTools (F12)"
echo "2. Перейдите в Application > Storage"
echo "3. Нажмите 'Clear storage'"
echo "4. Или выполните в консоли браузера:"
echo ""
echo "navigator.serviceWorker.getRegistrations().then(registrations => {"
echo "  registrations.forEach(registration => registration.unregister());"
echo "});"
echo "caches.keys().then(names => {"
echo "  names.forEach(name => caches.delete(name));"
echo "});"
echo "location.reload();"

echo ""
echo "✅ Очистка PWA кэша завершена!"
echo "🔄 Перезапустите сервер для применения изменений."
