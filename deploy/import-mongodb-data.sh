#!/bin/bash

# Скрипт для импорта данных MongoDB на production сервер
# Запускать на СЕРВЕРЕ после копирования JSON файлов

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    error "Этот скрипт должен быть запущен от root пользователя"
    exit 1
fi

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       Импорт данных MongoDB для SMP Help                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Параметры подключения
MONGO_DB="smp-help"
MONGO_USER="help-smp-user"
MONGO_PASS="vTLJP0L5QFJIJ5Ya"

# Используем рабочую строку подключения (без указания базы и authSource)
MONGO_URI="mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/"
AUTH_SOURCE="admin"

# Директория с JSON файлами (по умолчанию /home/mongodb)
DATA_DIR="${1:-/home/mongodb}"

log "Параметры:"
echo "  База данных: $MONGO_DB"
echo "  Пользователь: $MONGO_USER"
echo "  Auth Source: $AUTH_SOURCE"
echo "  Директория с данными: $DATA_DIR"
echo

# Проверяем директорию с данными
if [ ! -d "$DATA_DIR" ]; then
    error "Директория $DATA_DIR не найдена!"
    error "Использование: $0 [путь_к_директории_с_json]"
    error "Пример: $0 /home/mongodb"
    exit 1
fi

# Проверяем подключение к MongoDB
log "Проверяем подключение к MongoDB..."
if mongosh "$MONGO_URI" --quiet --eval "db.version()" > /dev/null 2>&1; then
    log "✅ Подключение к MongoDB успешно"
else
    error "❌ Не удалось подключиться к MongoDB"
    error "Проверьте учётные данные и убедитесь, что MongoDB запущен"
    exit 1
fi

# Подсчитываем файлы
JSON_FILES=$(find "$DATA_DIR" -name "*.json" | wc -l)
if [ "$JSON_FILES" -eq 0 ]; then
    error "В директории $DATA_DIR не найдено JSON файлов"
    exit 1
fi

log "Найдено JSON файлов: $JSON_FILES"
echo

# Список коллекций для импорта (в правильном порядке)
COLLECTIONS=(
    "users"
    "categories"
    "drugcategories"
    "drugs"
    "drugs2"
    "mkbcategories"
    "mkbs"
    "localstatuscategories"
    "localstatuses"
    "algorithmcategories"
    "algorithmsections"
    "algorithms"
    "instructions"
    "regions"
    "regionphones"
    "substations"
    "shifttemplates"
    "shifts"
    "shiftalternations"
    "feedbacks"
)

warn "⚠️  ВНИМАНИЕ: Это удалит существующие данные в коллекциях!"
read -p "Продолжить импорт? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    log "Импорт отменён"
    exit 0
fi

echo
log "Начинаем импорт данных..."
echo

# Счётчики
SUCCESS_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

# Импортируем каждую коллекцию
for collection in "${COLLECTIONS[@]}"; do
    JSON_FILE="$DATA_DIR/smp-help.$collection.json"
    
    if [ -f "$JSON_FILE" ]; then
        echo -n "📦 Импортируем $collection... "
        
        # Проверяем размер файла
        FILE_SIZE=$(stat -f%z "$JSON_FILE" 2>/dev/null || stat -c%s "$JSON_FILE" 2>/dev/null)
        FILE_SIZE_MB=$((FILE_SIZE / 1024 / 1024))
        
        if [ "$FILE_SIZE_MB" -gt 10 ]; then
            echo "(файл большой: ${FILE_SIZE_MB}MB, может занять время)"
        else
            echo
        fi
        
        # Импортируем с заменой существующих данных
        if mongoimport --uri="$MONGO_URI" \
            --db="$MONGO_DB" \
            --collection="$collection" \
            --file="$JSON_FILE" \
            --drop \
            --jsonArray \
            --authenticationDatabase=admin \
            --quiet; then
            
            # Подсчитываем количество документов
            DOC_COUNT=$(mongosh "${MONGO_URI}${MONGO_DB}" --quiet --eval "db.$collection.countDocuments()" 2>/dev/null || echo "?")
            log "  ✅ $collection импортирован ($DOC_COUNT документов)"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            error "  ❌ Ошибка импорта $collection"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        warn "  ⚠️  Файл не найден: $JSON_FILE"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    fi
done

echo
log "📊 Результаты импорта:"
log "  ✅ Успешно: $SUCCESS_COUNT"
log "  ❌ Ошибок: $FAILED_COUNT"
log "  ⚠️  Пропущено: $SKIPPED_COUNT"

echo
log "🔍 Проверяем базу данных..."

# Проверяем коллекции в базе
mongosh "${MONGO_URI}${MONGO_DB}" --quiet --eval "
print('📋 Коллекции в базе:');
print('');
db.getCollectionNames().forEach(function(name) {
    var count = db[name].countDocuments();
    print('  - ' + name + ': ' + count + ' документов');
});
"

echo
log "🎉 Импорт завершён!"
echo
log "🔧 Перезапустите приложение для применения изменений:"
log "  pm2 restart smp-help"
echo
log "🌐 Проверьте сайт: http://helpsmp.ru"

