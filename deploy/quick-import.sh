#!/bin/bash

# Быстрый импорт всех коллекций MongoDB
# Запускать на сервере из директории с JSON файлами

MONGO_URI="mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin"

echo "🚀 Быстрый импорт данных MongoDB"
echo "Директория: $(pwd)"
echo

# Проверяем подключение
if ! mongosh "$MONGO_URI" --quiet --eval "db.version()" > /dev/null 2>&1; then
    echo "❌ Не удалось подключиться к MongoDB"
    exit 1
fi

echo "✅ Подключение к MongoDB успешно"
echo

# Импортируем все файлы
for file in smp-help.*.json; do
    if [ -f "$file" ]; then
        collection=$(echo "$file" | sed 's/smp-help\.\(.*\)\.json/\1/')
        echo -n "📦 $collection... "
        
        if mongoimport --uri="$MONGO_URI" \
            --collection="$collection" \
            --file="$file" \
            --drop \
            --jsonArray \
            --quiet 2>/dev/null; then
            
            count=$(mongosh "$MONGO_URI" --quiet --eval "db.$collection.countDocuments()" 2>/dev/null)
            echo "✅ ($count документов)"
        else
            echo "❌ ошибка"
        fi
    fi
done

echo
echo "✅ Импорт завершён!"
echo
echo "📋 Коллекции в базе:"
mongosh "$MONGO_URI" --quiet --eval "
db.getCollectionNames().forEach(function(name) {
    print('  ' + name + ': ' + db[name].countDocuments());
});
"

