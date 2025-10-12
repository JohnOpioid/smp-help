#!/bin/bash

# Полный скрипт диагностики и импорта данных MongoDB
# Запускать на сервере

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    Проверка и импорт данных MongoDB для SMP Help            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo

# Параметры
MONGO_USER="help-smp-user"
MONGO_PASS="vTLJP0L5QFJIJ5Ya"
MONGO_DB="smp-help"
DATA_DIR="/home/mongodb"

log "Параметры подключения:"
echo "  Пользователь: $MONGO_USER"
echo "  База данных: $MONGO_DB"
echo "  Директория данных: $DATA_DIR"
echo

# 1. Проверка подключения
log "1. Проверка подключения к MongoDB..."
if mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/" --quiet --eval "db.version()" > /dev/null 2>&1; then
    log "   Подключение успешно"
else
    error "   Не удалось подключиться к MongoDB"
    exit 1
fi

# 2. Проверка существующих коллекций
log "2. Проверка существующих коллекций..."
echo
mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB" --quiet --eval "
print('📋 Текущие коллекции:');
var collections = db.getCollectionNames();
if (collections.length === 0) {
    print('   ⚠️  База пустая, нет коллекций');
} else {
    collections.forEach(function(name) {
        var count = db[name].countDocuments();
        print('   - ' + name + ': ' + count + ' документов');
    });
}
"
echo

# 3. Проверка наличия JSON файлов
log "3. Проверка JSON файлов в $DATA_DIR..."
if [ ! -d "$DATA_DIR" ]; then
    error "   Директория $DATA_DIR не найдена"
    exit 1
fi

cd "$DATA_DIR"
FILE_COUNT=$(ls -1 smp-help.*.json 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -eq 0 ]; then
    error "   JSON файлы не найдены"
    exit 1
fi

log "   Найдено $FILE_COUNT JSON файлов"
echo

# 4. Импорт данных
warn "⚠️  Импорт удалит существующие данные в коллекциях!"
read -p "Продолжить импорт? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    log "Импорт отменён"
    exit 0
fi

echo
log "4. Начинаем импорт..."
echo

SUCCESS=0
FAILED=0

for file in smp-help.*.json; do
    if [ -f "$file" ]; then
        collection=$(echo "$file" | sed 's/smp-help\.\(.*\)\.json/\1/')
        echo -n "   📦 $collection... "
        
        if mongoimport \
            --host=localhost \
            --port=27017 \
            --username="$MONGO_USER" \
            --password="$MONGO_PASS" \
            --authenticationDatabase=admin \
            --db="$MONGO_DB" \
            --collection="$collection" \
            --file="$file" \
            --drop \
            --jsonArray \
            --quiet 2>/dev/null; then
            
            COUNT=$(mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB" --quiet --eval "db.$collection.countDocuments()" 2>/dev/null)
            echo "✅ ($COUNT документов)"
            SUCCESS=$((SUCCESS + 1))
        else
            echo "❌ ошибка"
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo
log "📊 Результаты импорта:"
log "   ✅ Успешно: $SUCCESS"
if [ "$FAILED" -gt 0 ]; then
    error "   ❌ Ошибок: $FAILED"
fi

# 5. Финальная проверка
echo
log "5. Финальная проверка базы данных..."
echo
mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB" --quiet --eval "
print('📋 Коллекции после импорта:');
var total = 0;
db.getCollectionNames().forEach(function(name) {
    var count = db[name].countDocuments();
    total += count;
    print('   - ' + name + ': ' + count + ' документов');
});
print('');
print('   Всего документов: ' + total);
"

echo
log "6. Проверка критичных коллекций..."

# Проверяем наличие важных коллекций
CRITICAL_COLLECTIONS=("algorithms" "substations" "users" "drugs" "mkbs")
MISSING=0

for coll in "${CRITICAL_COLLECTIONS[@]}"; do
    COUNT=$(mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB" --quiet --eval "db.$coll.countDocuments()" 2>/dev/null)
    if [ "$COUNT" -gt 0 ] 2>/dev/null; then
        log "   ✅ $coll: $COUNT документов"
    else
        error "   ❌ $coll: пусто или не найдено"
        MISSING=$((MISSING + 1))
    fi
done

echo
if [ "$MISSING" -eq 0 ]; then
    log "🎉 Все критичные коллекции на месте!"
else
    warn "⚠️  Не хватает $MISSING критичных коллекций"
fi

echo
log "7. Перезапуск приложения..."
pm2 restart smp-help

echo
log "✅ Готово!"
echo
log "Проверьте:"
log "  - pm2 logs smp-help"
log "  - http://helpsmp.ru/algorithms"
log "  - http://helpsmp.ru/substations"

