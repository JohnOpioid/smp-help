#!/bin/bash

# Скрипт для обучения нейросети
echo "🚀 Запуск обучения нейросети..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js для продолжения."
    exit 1
fi

# Проверяем наличие MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB не найден. Убедитесь, что MongoDB запущен."
fi

# Создаем директорию для данных
mkdir -p data

# Запускаем обучение
echo "📚 Начинаем обучение..."
node scripts/train-ai-model.js

if [ $? -eq 0 ]; then
    echo "✅ Обучение завершено успешно!"
    echo "📊 Модель сохранена в data/ai-model.json"
    echo "🔄 Перезапустите сервер для применения изменений"
else
    echo "❌ Ошибка при обучении"
    exit 1
fi
