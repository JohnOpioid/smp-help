#!/bin/bash

# Интерактивный универсальный скрипт для SMP Help
# Поддерживает чистую установку и обновление
# Запускать от root пользователя

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Функции для вывода
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

question() {
    echo -e "${CYAN}[ВОПРОС]${NC} $1"
}

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    error "Этот скрипт должен быть запущен от root пользователя"
    exit 1
fi

# Проверяем версию Node.js если установлена
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log "Текущая версия Node.js: $NODE_VERSION"
    
    # Проверяем, что версия Node.js подходящая
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 20 ]; then
        warn "⚠️ Текущая версия Node.js ($NODE_VERSION) может быть несовместима с проектом"
        warn "⚠️ Рекомендуется версия Node.js 20 или выше"
        warn "⚠️ Скрипт установит Node.js 20 автоматически"
    fi
else
    log "ℹ️ Node.js не установлен, будет установлен автоматически"
fi

# Функция для ввода данных с проверкой
read_input() {
    local prompt="$1"
    local var_name="$2"
    local is_password="$3"
    local default_value="$4"
    
    if [ "$is_password" = "true" ]; then
        if [ -n "$default_value" ]; then
            question "$prompt (по умолчанию: скрыто)"
        else
            question "$prompt"
        fi
        read -s input
        echo
    else
        if [ -n "$default_value" ]; then
            question "$prompt (по умолчанию: $default_value)"
        else
            question "$prompt"
        fi
        read input
    fi
    
    if [ -z "$input" ] && [ -n "$default_value" ]; then
        input="$default_value"
    fi
    
    eval "$var_name='$input'"
}

# Функция для генерации случайного пароля
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Функция для генерации JWT секрета
generate_jwt_secret() {
    # Используем hex вместо base64 чтобы избежать проблем с многострочными значениями
    openssl rand -hex 32
}

# Заголовок
clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SMP Help Deployment                     ║"
echo "║              Интерактивный скрипт установки                 ║"
echo "║                                                              ║"
echo "║  Поддерживает:                                               ║"
echo "║  • Чистую установку на новый сервер                         ║"
echo "║  • Обновление существующего проекта                         ║"
echo "║  • Настройку всех компонентов                              ║"
echo "║  • Автоматическую настройку домена                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Определяем режим работы
echo
question "Выберите режим работы:"
echo "1) Чистая установка (новый сервер)"
echo "2) Обновление проекта (git pull + rebuild + restart)"
echo "3) Полное обновление (с переустановкой зависимостей)"
echo "4) Переустановка (удалить все и установить заново)"
read -p "Введите номер (1-4): " mode

case $mode in
    1) INSTALL_MODE="fresh" ;;
    2) INSTALL_MODE="quick-update" ;;
    3) INSTALL_MODE="full-update" ;;
    4) INSTALL_MODE="reinstall" ;;
    *) error "Неверный выбор"; exit 1 ;;
esac

log "Выбран режим: $INSTALL_MODE"

# Для режимов обновления пытаемся прочитать существующую конфигурацию
if [[ "$INSTALL_MODE" == "quick-update" || "$INSTALL_MODE" == "full-update" ]]; then
    log "Попытка прочитать существующую конфигурацию..."
    
    # Пути по умолчанию
    DEFAULT_PROJECT_NAME="smp-help"
    DEFAULT_DOMAIN="helpsmp.ru"
    DEFAULT_WORK_DIR="/var/www/html/helpsmp.ru"
    
    # Пытаемся прочитать конфигурацию PM2
    if [ -f "$DEFAULT_WORK_DIR/ecosystem.config.cjs" ]; then
        log "✅ Найдена конфигурация PM2"
        
        # Читаем параметры из конфигурации
        PROJECT_NAME=$(grep "name:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*name: '\(.*\)'.*/\1/" | head -1)
        WORK_DIR=$(grep "cwd:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*cwd: '\(.*\)'.*/\1/" | head -1)
        
        # Читаем MONGODB_URI и парсим его
        MONGODB_URI_LINE=$(grep "MONGODB_URI:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | head -1)
        MONGO_USER=$(echo "$MONGODB_URI_LINE" | sed "s/.*mongodb:\/\/\([^:]*\):.*/\1/")
        MONGO_PASS=$(echo "$MONGODB_URI_LINE" | sed "s/.*:\/\/[^:]*:\([^@]*\)@.*/\1/")
        MONGO_DB=$(echo "$MONGODB_URI_LINE" | sed "s/.*@[^\/]*\/\([^?']*\).*/\1/")
        
        # Читаем JWT_SECRET
        JWT_SECRET=$(grep "JWT_SECRET:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*JWT_SECRET: '\(.*\)'.*/\1/" | head -1)
        
        # Читаем API ключи
        GIGACHAT_API_KEY=$(grep "GIGACHAT_API_KEY:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*GIGACHAT_API_KEY: '\(.*\)'.*/\1/" | head -1)
        GIGACHAT_CLIENT_ID=$(grep "GIGACHAT_CLIENT_ID:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*GIGACHAT_CLIENT_ID: '\(.*\)'.*/\1/" | head -1)
        GIGACHAT_SCOPE=$(grep "GIGACHAT_SCOPE:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*GIGACHAT_SCOPE: '\(.*\)'.*/\1/" | head -1)
        YAMAPS_API_KEY=$(grep "YAMAPS_API_KEY:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*YAMAPS_API_KEY: '\(.*\)'.*/\1/" | head -1)
        
        # Читаем SMTP настройки
        SMTP_HOST=$(grep "SMTP_HOST:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*SMTP_HOST: '\(.*\)'.*/\1/" | head -1)
        SMTP_PORT=$(grep "SMTP_PORT:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*SMTP_PORT: '\(.*\)'.*/\1/" | head -1)
        SMTP_USER=$(grep "SMTP_USER:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*SMTP_USER: '\(.*\)'.*/\1/" | head -1)
        SMTP_PASS=$(grep "SMTP_PASS:" "$DEFAULT_WORK_DIR/ecosystem.config.cjs" | sed "s/.*SMTP_PASS: '\(.*\)'.*/\1/" | head -1)
        
        # Определяем остальные параметры
        PROJECT_USER="root"
        DOMAIN=$(echo "$WORK_DIR" | sed 's/\/var\/www\/html\///')
        GITHUB_REPO="$DEFAULT_PROJECT_NAME"
        GITHUB_USER="JohnOpioid"
        INSTALL_MONGODB="no"
        
        log "✅ Конфигурация прочитана из существующего файла"
        log "Проект: $PROJECT_NAME"
        log "Домен: $DOMAIN"
        log "Рабочая директория: $WORK_DIR"
        log "MongoDB: $MONGO_DB (пользователь: $MONGO_USER)"
        
        # Спрашиваем только GitHub токен
        echo
        question "Эти настройки будут использованы для обновления."
        read_input "Введите GitHub Personal Access Token" GITHUB_TOKEN "true" ""
        
        # Генерируем URL репозитория
        if [ -n "$GITHUB_TOKEN" ]; then
            GITHUB_URL="https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$GITHUB_REPO.git"
        else
            GITHUB_URL="https://github.com/$GITHUB_USER/$GITHUB_REPO.git"
        fi
        
        # Устанавливаем пути
        CLONE_DIR="/home/smp-help"
        PROJECT_DIR="$CLONE_DIR/$GITHUB_REPO"
        LOG_DIR="/var/log/$PROJECT_NAME"
        
        # Пропускаем остальной сбор информации
        SKIP_INPUT=true
    else
        log "⚠️  Конфигурация не найдена, требуется ввод параметров"
        SKIP_INPUT=false
    fi
else
    SKIP_INPUT=false
fi

# Сбор информации о проекте (только если не пропускаем)
if [ "$SKIP_INPUT" != "true" ]; then
echo
info "=== СБОР ИНФОРМАЦИИ О ПРОЕКТЕ ==="

read_input "Введите название проекта" PROJECT_NAME "false" "smp-help"
read_input "Введите имя пользователя для проекта" PROJECT_USER "false" "root"
read_input "Введите домен вашего сайта (например: helpsmp.ru)" DOMAIN "false" "helpsmp.ru"

# Информация о домене
echo
info "ℹ️ Домен будет использоваться для:"
info "  - Настройки Nginx конфигурации"
info "  - SSL сертификата (www.$DOMAIN и $DOMAIN)"
info "  - Переменных окружения (NUXT_PUBLIC_APP_URL)"
info "  - API базового URL (NUXT_PUBLIC_API_BASE_URL)"
echo
warn "⚠️ ВАЖНО: Убедитесь, что домен $DOMAIN настроен в DNS и указывает на IP этого сервера!"
warn "⚠️ Для SSL сертификата домен должен быть доступен из интернета!"

# Информация о GitHub
echo
info "=== НАСТРОЙКА GITHUB ==="

read_input "Введите GitHub username" GITHUB_USER "false" "JohnOpioid"
read_input "Введите GitHub Personal Access Token" GITHUB_TOKEN "true" ""
read_input "Введите название репозитория" GITHUB_REPO "false" "$PROJECT_NAME"

# Генерируем URL репозитория
if [ -n "$GITHUB_TOKEN" ]; then
    GITHUB_URL="https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$GITHUB_REPO.git"
else
    GITHUB_URL="https://github.com/$GITHUB_USER/$GITHUB_REPO.git"
fi

# Настройки базы данных
echo
info "=== НАСТРОЙКА MONGODB ==="
echo

# Спрашиваем, нужно ли устанавливать MongoDB
question "Установить MongoDB 8.0 на сервере? (y/N)"
echo "  - Выберите 'y' если MongoDB не установлен"
echo "  - Выберите 'N' если MongoDB уже установлен"
read -p "> " install_mongo_choice

if [[ $install_mongo_choice =~ ^[Yy]$ ]]; then
    INSTALL_MONGODB="yes"
    log "MongoDB будет установлен автоматически"
else
    INSTALL_MONGODB="no"
    log "MongoDB должен быть уже установлен на сервере"
fi

echo
read_input "Введите название базы данных" MONGO_DB "false" "$PROJECT_NAME"
read_input "Введите имя пользователя MongoDB" MONGO_USER "false" "help-smp-user"
read_input "Введите пароль MongoDB пользователя" MONGO_PASS "true" ""

if [ -z "$MONGO_PASS" ]; then
    # Генерируем пароль если не указан
    MONGO_PASS=$(generate_password 16)
    log "Сгенерирован пароль для MongoDB: $MONGO_PASS"
else
    log "Используется указанный пароль MongoDB"
fi

# Настройки безопасности
echo
info "=== НАСТРОЙКИ БЕЗОПАСНОСТИ ==="

# Генерируем JWT секрет
JWT_SECRET=$(generate_jwt_secret)
log "Сгенерирован JWT секрет"

read_input "Введите пароль для пользователя $PROJECT_USER" USER_PASSWORD "true" ""

# Настройки AI (опционально)
echo
info "=== НАСТРОЙКИ AI (ОПЦИОНАЛЬНО) ==="

read_input "Введите GigaChat API Key (или оставьте пустым)" GIGACHAT_API_KEY "true" ""
read_input "Введите GigaChat Client ID (или оставьте пустым)" GIGACHAT_CLIENT_ID "false" ""
read_input "Введите GigaChat Scope (или оставьте пустым)" GIGACHAT_SCOPE "false" ""

# Настройки email (опционально)
echo
info "=== НАСТРОЙКИ EMAIL (ОПЦИОНАЛЬНО) ==="

read_input "Введите SMTP Host (или оставьте пустым)" SMTP_HOST "false" ""
read_input "Введите SMTP Port (или оставьте пустым)" SMTP_PORT "false" "587"
read_input "Введите SMTP User (или оставьте пустым)" SMTP_USER "false" ""
read_input "Введите SMTP Password (или оставьте пустым)" SMTP_PASS "true" ""

# Настройки Yandex Maps
echo
info "=== НАСТРОЙКИ YANDEX MAPS ==="

read_input "Введите Yandex Maps API Key" YAMAPS_API_KEY "false" "0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c"

# Устанавливаем пути после ввода всех данных
CLONE_DIR="/home/smp-help"
PROJECT_DIR="$CLONE_DIR/$GITHUB_REPO"
WORK_DIR="/var/www/html/$DOMAIN"
LOG_DIR="/var/log/$PROJECT_NAME"

fi
# Конец блока SKIP_INPUT

# Подтверждение настроек
echo
info "=== ПОДТВЕРЖДЕНИЕ НАСТРОЕК ==="

echo "Проект: $PROJECT_NAME"
echo "Пользователь: $PROJECT_USER"
echo "Домен: $DOMAIN"
echo "Рабочая директория: $WORK_DIR"
echo "GitHub: $GITHUB_URL"
echo "MongoDB DB: $MONGO_DB"
echo "MongoDB User: $MONGO_USER"
echo "MongoDB Password: $MONGO_PASS"
echo "JWT Secret: [скрыто]"
echo "GigaChat API Key: $([ -n "$GIGACHAT_API_KEY" ] && echo "[установлен]" || echo "[не установлен]")"
echo "SMTP: $([ -n "$SMTP_HOST" ] && echo "[настроен]" || echo "[не настроен]")"
echo "Yandex Maps: $YAMAPS_API_KEY"

echo
read -p "Продолжить с этими настройками? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    log "Установка отменена пользователем"
    exit 0
fi

log "Начинаем установку с выбранными настройками..."

# Выводим пути
info "Пути проекта:"
info "  - Клонирование репозитория: $PROJECT_DIR"
info "  - Рабочая директория (собранный проект): $WORK_DIR"
info "  - Логи: $LOG_DIR"

# Функция установки зависимостей
install_dependencies() {
    log "📦 Устанавливаем системные зависимости..."
    
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    # Устанавливаем Node.js 20
    log "📦 Устанавливаем Node.js 20..."
    
    # Проверяем, есть ли уже Node.js
    if command -v node >/dev/null 2>&1; then
        CURRENT_NODE=$(node --version)
        log "ℹ️ Обнаружена существующая версия Node.js: $CURRENT_NODE"
        
        # Удаляем старую версию если она устарела
        NODE_MAJOR=$(echo $CURRENT_NODE | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 20 ]; then
            log "🗑️ Удаляем устаревшую версию Node.js..."
            apt remove nodejs -y 2>/dev/null || true
        fi
    fi
    
    # Устанавливаем Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Проверяем установку
    NEW_NODE=$(node --version)
    NEW_NPM=$(npm --version)
    log "✅ Node.js установлен: $NEW_NODE"
    log "✅ npm установлен: $NEW_NPM"
    
    # Устанавливаем или проверяем MongoDB
    if [ "$INSTALL_MONGODB" = "yes" ]; then
        log "📦 Устанавливаем MongoDB 8.0..."
        
        # Установка зависимостей
        apt install -y wget curl gnupg software-properties-common
        
        # Импорт GPG ключа MongoDB
        wget -qO - https://www.mongodb.org/static/pgp/server-8.0.asc | apt-key add -
        
        # Определяем версию Ubuntu
        UBUNTU_CODENAME=$(lsb_release -cs)
        log "Версия Ubuntu: $UBUNTU_CODENAME"
        
        # Добавление репозитория MongoDB
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
        
        # Обновление и установка
        apt update
        apt install -y mongodb-org
        
        # Запуск MongoDB
        systemctl start mongod
        systemctl enable mongod
        
        # Ждём запуска
        log "Ожидаем запуска MongoDB..."
        sleep 5
        
        if systemctl is-active --quiet mongod; then
            log "✅ MongoDB 8.0 установлен и запущен"
        else
            error "❌ Не удалось запустить MongoDB"
            error "Проверьте логи: sudo journalctl -u mongod -n 50"
            exit 1
        fi
    else
        log "📦 Проверяем MongoDB..."
        
        if ! command -v mongosh >/dev/null 2>&1; then
            error "MongoDB не установлен!"
            error "Запустите скрипт заново и выберите установку MongoDB"
            exit 1
        fi
        
        log "✅ MongoDB уже установлен"
        
        # Проверяем, что MongoDB запущен
        if ! systemctl is-active --quiet mongod; then
            log "⚙️  Запускаем MongoDB..."
            systemctl start mongod
            systemctl enable mongod
            sleep 3
        fi
        
        if systemctl is-active --quiet mongod; then
            log "✅ MongoDB работает"
        else
            error "❌ Не удалось запустить MongoDB"
            error "Проверьте логи: sudo journalctl -u mongod -n 50"
            exit 1
        fi
    fi
    
    # Устанавливаем Nginx
    log "📦 Устанавливаем Nginx..."
    apt install -y nginx
    
    # Устанавливаем PM2
    log "📦 Устанавливаем PM2..."
    npm install -g pm2
    
    # Устанавливаем Certbot
    log "📦 Устанавливаем Certbot..."
    apt install -y certbot python3-certbot-nginx
    
    log "✅ Системные зависимости установлены"
}

# Функция создания директорий
setup_directories() {
    log "📁 Настраиваем директории..."
    
    # Создаем директорию для клонирования
    mkdir -p $CLONE_DIR
    
    # Создаем рабочую директорию для собранного проекта
    mkdir -p $WORK_DIR
    
    # Создаем директорию для логов
    mkdir -p $LOG_DIR
    
    # Устанавливаем права
    if [ "$PROJECT_USER" != "root" ]; then
        chown -R $PROJECT_USER:$PROJECT_USER $CLONE_DIR
        chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
        chown -R $PROJECT_USER:$PROJECT_USER $LOG_DIR
    fi
    
    log "✅ Директории созданы:"
    log "  - $CLONE_DIR (для репозитория)"
    log "  - $WORK_DIR (для собранного проекта)"
    log "  - $LOG_DIR (для логов)"
}

# Функция настройки MongoDB
setup_mongodb() {
    log "🗄️ Настраиваем MongoDB..."
    
    # Проверяем, что MongoDB доступен
    if ! systemctl is-active --quiet mongod; then
        error "MongoDB не запущен"
        exit 1
    fi
    
    # Если MongoDB только что установлен, нужно создать пользователя
    if [ "$INSTALL_MONGODB" = "yes" ]; then
        log "Создаём пользователя MongoDB..."
        
        # Создаём пользователя через последовательные команды mongosh
        mongosh --quiet << MONGOEOF
use admin
db.createUser({
  user: "$MONGO_USER",
  pwd: "$MONGO_PASS",
  roles: [
    { role: "readWrite", db: "$MONGO_DB" },
    { role: "dbAdmin", db: "$MONGO_DB" }
  ]
})
exit
MONGOEOF
        
        if [ $? -eq 0 ]; then
            log "✅ Пользователь $MONGO_USER создан успешно"
        else
            warn "⚠️  Не удалось создать пользователя (возможно уже существует)"
        fi
        
        # Включаем аутентификацию в конфиге MongoDB
        log "Настраиваем аутентификацию MongoDB..."
        
        if ! grep -q "^security:" /etc/mongod.conf; then
            echo "" >> /etc/mongod.conf
            echo "security:" >> /etc/mongod.conf
            echo "  authorization: enabled" >> /etc/mongod.conf
            
            log "Перезапускаем MongoDB с аутентификацией..."
            systemctl restart mongod
            sleep 5
        fi
    fi
    
    # Проверяем подключение с указанными учётными данными
    log "Проверяем подключение к MongoDB..."
    
    if mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB" --quiet --eval "db.version()" > /dev/null 2>&1; then
        log "✅ Подключение к MongoDB успешно!"
        log "✅ Пользователь $MONGO_USER имеет доступ к базе $MONGO_DB"
    else
        warn "⚠️  Не удалось подключиться к MongoDB с указанными учётными данными"
        warn "⚠️  Возможно, пользователь не существует или пароль неверный"
        warn "⚠️  Приложение попытается подключиться с этими данными"
        
        if [ "$INSTALL_MONGODB" = "no" ]; then
            warn "⚠️  Если подключение не удастся, создайте пользователя вручную:"
            warn "     mongosh"
            warn "     use admin"
            warn "     db.createUser({user: '$MONGO_USER', pwd: '$MONGO_PASS', roles: [{role: 'readWrite', db: '$MONGO_DB'}]})"
            warn "     exit"
        fi
    fi
}

# Функция клонирования и сборки проекта
clone_and_build() {
    log "📥 Клонируем и собираем проект..."
    
    # Переходим в директорию для клонирования
    cd $CLONE_DIR
    
    # Проверяем, существует ли директория и является ли она Git репозиторием
    if [ -d "$PROJECT_DIR" ]; then
        cd $PROJECT_DIR
        
        # Проверяем, является ли это Git репозиторием
        if git rev-parse --git-dir > /dev/null 2>&1; then
            log "📁 Репозиторий существует, обновляем..."
            git pull origin main
        else
            log "⚠️  Директория существует, но не является Git репозиторием"
            log "Удаляем и клонируем заново..."
            cd $CLONE_DIR
            rm -rf "$PROJECT_DIR"
            git clone $GITHUB_URL $PROJECT_DIR
            cd $PROJECT_DIR
        fi
    else
        log "📥 Клонируем репозиторий..."
        git clone $GITHUB_URL $PROJECT_DIR
        cd $PROJECT_DIR
    fi
        
    # Создаем файл окружения
    log "⚙️ Создаем конфигурацию окружения..."
    cat > .env.production << EOF
# Production Environment Variables
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://$DOMAIN/api
NUXT_PUBLIC_APP_URL=https://$DOMAIN
PORT=3000

# MongoDB
MONGODB_URI=mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB

# JWT Secret
JWT_SECRET=$JWT_SECRET

# AI Configuration
GIGACHAT_API_KEY=$GIGACHAT_API_KEY
GIGACHAT_CLIENT_ID=$GIGACHAT_CLIENT_ID
GIGACHAT_SCOPE=$GIGACHAT_SCOPE
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1

# Email Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# Yandex Maps
YAMAPS_API_KEY=$YAMAPS_API_KEY
EOF
    
    # Устанавливаем зависимости
    log "📦 Устанавливаем зависимости..."
    npm install
    
    # Проверяем версию Node.js
    NODE_VERSION=$(node --version)
    log "📋 Версия Node.js: $NODE_VERSION"
    
    # Собираем проект
    log "🔨 Собираем проект..."
    if npm run build; then
        log "✅ Проект собран успешно"
    else
        error "❌ Ошибка сборки проекта"
        error "📋 Проверьте логи выше для диагностики"
        exit 1
    fi
}

# Функция копирования файлов
copy_files() {
    log "📁 Копируем собранные файлы в рабочую директорию..."
    
    # Сохраняем конфигурацию PM2 если существует
    if [ -f "$WORK_DIR/ecosystem.config.cjs" ]; then
        log "Сохраняем конфигурацию PM2..."
        cp "$WORK_DIR/ecosystem.config.cjs" "/tmp/ecosystem.config.cjs.backup"
    fi
    
    # Очищаем рабочую директорию
    log "Очищаем $WORK_DIR..."
    rm -rf $WORK_DIR/*
    
    # Проверяем, что сборка существует
    if [ ! -d "$PROJECT_DIR/.output" ]; then
        error "Директория сборки не найдена: $PROJECT_DIR/.output"
        exit 1
    fi
    
    # Копируем собранные файлы из репозитория в рабочую директорию
    log "Копируем из $PROJECT_DIR/.output в $WORK_DIR..."
    
    # Nuxt 3 создаёт структуру .output/server/ и .output/public/
    # Копируем server в корень, public тоже в корень
    if [ -d "$PROJECT_DIR/.output/server" ]; then
        cp -r $PROJECT_DIR/.output/server/* $WORK_DIR/
        log "✅ Серверные файлы скопированы"
    else
        error "Директория .output/server не найдена"
        exit 1
    fi
    
    if [ -d "$PROJECT_DIR/.output/public" ]; then
        cp -r $PROJECT_DIR/.output/public/* $WORK_DIR/ 2>/dev/null || true
        log "✅ Статические файлы скопированы"
    fi
    
    # Восстанавливаем конфигурацию PM2 если была сохранена
    # (для режимов update это важно, чтобы не потерять настройки)
    if [ -f "/tmp/ecosystem.config.cjs.backup" ]; then
        cp "/tmp/ecosystem.config.cjs.backup" "$WORK_DIR/ecosystem.config.cjs"
        log "✅ Конфигурация PM2 восстановлена"
        # Удаляем backup после восстановления
        rm -f "/tmp/ecosystem.config.cjs.backup"
    fi
    
    # Устанавливаем права
    if [ "$PROJECT_USER" != "root" ]; then
        chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
    fi
    chmod -R 755 $WORK_DIR
    
    # Проверяем, что index.mjs существует
    if [ -f "$WORK_DIR/index.mjs" ]; then
        log "✅ Файлы скопированы успешно"
    else
        error "❌ index.mjs не найден в $WORK_DIR"
        error "Проверьте сборку проекта"
        exit 1
    fi
}

# Функция настройки PM2
setup_pm2() {
    log "⚙️ Настраиваем PM2..."
    
    # Переходим в рабочую директорию
    cd $WORK_DIR
    
    # Проверяем, есть ли index.mjs
    if [ ! -f "index.mjs" ]; then
        error "❌ Файл index.mjs не найден в $WORK_DIR"
        return 1
    fi
    
    # Проверяем права на файл
    chmod +x index.mjs
    
    # Проверяем синтаксис
    if ! node --check index.mjs; then
        error "❌ Синтаксис index.mjs некорректен"
        return 1
    fi
    
    # Проверяем, существует ли уже конфигурация PM2
    if [ -f "$WORK_DIR/ecosystem.config.cjs" ]; then
        log "✅ Конфигурация PM2 уже существует, используем её"
        log "Если нужно пересоздать конфигурацию, удалите файл вручную"
    else
        log "Создаём новую конфигурацию PM2..."
        
        # Создаем конфигурацию PM2 для ES модулей
        # Используем шаблон с плейсхолдерами для безопасной подстановки
        cat > $WORK_DIR/ecosystem.config.cjs << 'EOFCONFIG'
module.exports = {
  apps: [{
    name: 'PROJECT_NAME_PLACEHOLDER',
    script: './index.mjs',
    cwd: 'WORK_DIR_PLACEHOLDER',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NUXT_PUBLIC_API_BASE_URL: 'NUXT_PUBLIC_API_BASE_URL_PLACEHOLDER',
      NUXT_PUBLIC_APP_URL: 'NUXT_PUBLIC_APP_URL_PLACEHOLDER',
      MONGODB_URI: 'MONGODB_URI_PLACEHOLDER',
      JWT_SECRET: 'JWT_SECRET_PLACEHOLDER',
      ADMIN_SETUP_TOKEN: 'your-admin-token-here',
      GIGACHAT_API_KEY: 'GIGACHAT_API_KEY_PLACEHOLDER',
      GIGACHAT_CLIENT_ID: 'GIGACHAT_CLIENT_ID_PLACEHOLDER',
      GIGACHAT_SCOPE: 'GIGACHAT_SCOPE_PLACEHOLDER',
      GIGACHAT_API_URL: 'https://gigachat.devices.sberbank.ru/api/v1',
      SMTP_HOST: 'SMTP_HOST_PLACEHOLDER',
      SMTP_PORT: 'SMTP_PORT_PLACEHOLDER',
      SMTP_USER: 'SMTP_USER_PLACEHOLDER',
      SMTP_PASS: 'SMTP_PASS_PLACEHOLDER',
      YAMAPS_API_KEY: 'YAMAPS_API_KEY_PLACEHOLDER'
    },
    log_file: 'LOG_DIR_PLACEHOLDER/smp-help.log',
    out_file: 'LOG_DIR_PLACEHOLDER/smp-help-out.log',
    error_file: 'LOG_DIR_PLACEHOLDER/smp-help-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOFCONFIG
    
    # Заменяем плейсхолдеры на реальные значения
    sed -i "s|PROJECT_NAME_PLACEHOLDER|$PROJECT_NAME|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|WORK_DIR_PLACEHOLDER|$WORK_DIR|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|NUXT_PUBLIC_API_BASE_URL_PLACEHOLDER|https://$DOMAIN/api|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|NUXT_PUBLIC_APP_URL_PLACEHOLDER|https://$DOMAIN|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|MONGODB_URI_PLACEHOLDER|mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB?authSource=admin|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|JWT_SECRET_PLACEHOLDER|$JWT_SECRET|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|GIGACHAT_API_KEY_PLACEHOLDER|$GIGACHAT_API_KEY|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|GIGACHAT_CLIENT_ID_PLACEHOLDER|$GIGACHAT_CLIENT_ID|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|GIGACHAT_SCOPE_PLACEHOLDER|$GIGACHAT_SCOPE|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|SMTP_HOST_PLACEHOLDER|$SMTP_HOST|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|SMTP_PORT_PLACEHOLDER|$SMTP_PORT|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|SMTP_USER_PLACEHOLDER|$SMTP_USER|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|SMTP_PASS_PLACEHOLDER|$SMTP_PASS|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|YAMAPS_API_KEY_PLACEHOLDER|$YAMAPS_API_KEY|g" $WORK_DIR/ecosystem.config.cjs
    sed -i "s|LOG_DIR_PLACEHOLDER|$LOG_DIR|g" $WORK_DIR/ecosystem.config.cjs
        
        # Устанавливаем права на конфигурацию
        if [ "$PROJECT_USER" != "root" ]; then
            chown $PROJECT_USER:$PROJECT_USER $WORK_DIR/ecosystem.config.cjs
        fi
        chmod 644 $WORK_DIR/ecosystem.config.cjs
        
        log "✅ Конфигурация PM2 создана"
    fi
    
    # Запускаем PM2
    cd $WORK_DIR
    
    # Останавливаем старые процессы
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    
    # Запускаем приложение
    pm2 start ecosystem.config.cjs
    
    # Ждем немного
    sleep 3
    
    # Проверяем статус
    pm2 status
    
    # Сохраняем конфигурацию
    pm2 save
    pm2 startup
    
    # Проверяем, что PM2 запустился
    if pm2 status | grep -q "$PROJECT_NAME.*online"; then
        log "✅ PM2 настроен и приложение запущено"
    else
        warn "⚠️ PM2 настроен, но приложение может не работать"
        log "📋 Проверьте логи: pm2 logs $PROJECT_NAME"
        
        # Пробуем создать CommonJS версию как fallback
        log "🔧 Создаем CommonJS версию как fallback..."
        cd $WORK_DIR
        
        # Создаем CommonJS версию
        cat > index.js << 'EOF'
const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const { join, extname } = require('path');

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('SMP Help Server is running!');
    } else if (pathname.startsWith('/_nuxt/')) {
      const filePath = join(process.cwd(), pathname);
      if (existsSync(filePath)) {
        const file = readFileSync(filePath);
        const ext = extname(filePath);
        let contentType = 'application/javascript';
        
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'application/javascript';
        if (ext === '.json') contentType = 'application/json';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(file);
      } else {
        res.writeHead(404);
        res.end('File not found');
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(\`SMP Help Server running on port \${PORT}\`);
});
EOF
        
        # Создаем конфигурацию PM2 для CommonJS
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: './index.js',
    cwd: '$WORK_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NUXT_PUBLIC_API_BASE_URL: 'https://$DOMAIN/api',
      NUXT_PUBLIC_APP_URL: 'https://$DOMAIN',
      MONGODB_URI: 'mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB',
      JWT_SECRET: '$JWT_SECRET',
      ADMIN_SETUP_TOKEN: 'your-admin-token-here',
      GIGACHAT_API_KEY: '$GIGACHAT_API_KEY',
      GIGACHAT_CLIENT_ID: '$GIGACHAT_CLIENT_ID',
      GIGACHAT_SCOPE: '$GIGACHAT_SCOPE',
      GIGACHAT_API_URL: 'https://gigachat.devices.sberbank.ru/api/v1',
      SMTP_HOST: '$SMTP_HOST',
      SMTP_PORT: '$SMTP_PORT',
      SMTP_USER: '$SMTP_USER',
      SMTP_PASS: '$SMTP_PASS',
      YAMAPS_API_KEY: '$YAMAPS_API_KEY'
    },
    log_file: '$LOG_DIR/smp-help.log',
    out_file: '$LOG_DIR/smp-help-out.log',
    error_file: '$LOG_DIR/smp-help-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
        
        # Останавливаем старые процессы
        pm2 stop $PROJECT_NAME 2>/dev/null || true
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        
        # Запускаем приложение
        pm2 start ecosystem.config.js
        
        # Ждем немного
        sleep 3
        
        # Проверяем статус
        pm2 status
        
        # Сохраняем конфигурацию
        pm2 save
        
        if pm2 status | grep -q "$PROJECT_NAME.*online"; then
            log "✅ PM2 настроен с CommonJS версией"
        else
            error "❌ PM2 не удалось настроить"
        fi
    fi
}

# Функция настройки Nginx
setup_nginx() {
    log "🌐 Настраиваем Nginx..."
    
    # Создаем конфигурацию Nginx
    cat > /etc/nginx/sites-available/$DOMAIN << 'EOFNGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # Корневая директория для статических файлов
    root WORK_DIR_PLACEHOLDER;
    
    # Проксирование динамических запросов на Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Статические файлы Nuxt (_nuxt/)
    location /_nuxt/ {
        alias WORK_DIR_PLACEHOLDER/_nuxt/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Фавиконка и другие статические файлы
    location ~* \.(ico|css|js|gif|jpeg|jpg|png|woff|woff2|ttf|svg|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    access_log /var/log/nginx/DOMAIN_PLACEHOLDER.access.log;
    error_log /var/log/nginx/DOMAIN_PLACEHOLDER.error.log;
}
EOFNGINX
    
    # Заменяем плейсхолдеры
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN
    sed -i "s|WORK_DIR_PLACEHOLDER|$WORK_DIR|g" /etc/nginx/sites-available/$DOMAIN
    
    # Активируем конфигурацию
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Проверяем конфигурацию
    nginx -t
    
    # Перезапускаем Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    log "✅ Nginx настроен"
}

# Функция настройки firewall
setup_firewall() {
    log "🔥 Настраиваем firewall..."
    
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw --force enable
    
    log "✅ Firewall настроен"
}

# Функция создания скриптов управления
create_management_scripts() {
    log "📝 Создаем скрипты управления..."
    
    # Определяем директорию для скриптов
    if [ "$PROJECT_USER" = "root" ]; then
        SCRIPTS_DIR="/root"
    else
        SCRIPTS_DIR="/home/$PROJECT_USER"
    fi
    
    # Скрипт обновления
    cat > $SCRIPTS_DIR/update-app.sh << EOFUPDATE
#!/bin/bash

set -e

echo "🔄 Обновляем $PROJECT_NAME..."

# Переменные
PROJECT_DIR="$PROJECT_DIR"
WORK_DIR="$WORK_DIR"
PROJECT_NAME="$PROJECT_NAME"

cd \$PROJECT_DIR

echo "📥 Получаем изменения из GitHub..."
git pull origin main

echo "📦 Устанавливаем зависимости..."
npm install

echo "🔨 Собираем проект..."
npm run build

echo "📁 Копируем файлы в рабочую директорию..."
# Сохраняем конфигурацию PM2
cp \$WORK_DIR/ecosystem.config.cjs /tmp/eco.backup 2>/dev/null || true

rm -rf \$WORK_DIR/*
cp -r .output/server/* \$WORK_DIR/
cp -r .output/public/* \$WORK_DIR/ 2>/dev/null || true

# Восстанавливаем конфигурацию
cp /tmp/eco.backup \$WORK_DIR/ecosystem.config.cjs 2>/dev/null || true

chmod -R 755 \$WORK_DIR

echo "🚀 Перезапускаем приложение..."
pm2 restart \$PROJECT_NAME

echo "✅ Обновление завершено!"
pm2 status
EOFUPDATE
    
    # Устанавливаем права на скрипт
    if [ "$PROJECT_USER" != "root" ]; then
        chown $PROJECT_USER:$PROJECT_USER $SCRIPTS_DIR/update-app.sh
    fi
    chmod +x $SCRIPTS_DIR/update-app.sh
    
    # Скрипт запуска
    cat > $SCRIPTS_DIR/start-app.sh << EOFSTART
#!/bin/bash

# Переменные
WORK_DIR="$WORK_DIR"
PROJECT_NAME="$PROJECT_NAME"

echo "🚀 Запускаем \$PROJECT_NAME..."

cd \$WORK_DIR

pm2 stop \$PROJECT_NAME 2>/dev/null || true
pm2 delete \$PROJECT_NAME 2>/dev/null || true

# Запускаем приложение
if [ -f "\$WORK_DIR/ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs
else
    echo "❌ Конфигурация PM2 не найдена"
    exit 1
fi

echo "✅ Приложение запущено!"
pm2 status
EOFSTART
    
    # Устанавливаем права на скрипт
    if [ "$PROJECT_USER" != "root" ]; then
        chown $PROJECT_USER:$PROJECT_USER $SCRIPTS_DIR/start-app.sh
    fi
    chmod +x $SCRIPTS_DIR/start-app.sh
    
    # Скрипт исправления PM2
    cat > $SCRIPTS_DIR/fix-pm2.sh << 'EOF'
#!/bin/bash

echo "🔧 Исправляем проблемы с PM2..."

cd $WORK_DIR

# Проверяем, есть ли index.mjs
if [ -f "index.mjs" ]; then
    echo "✅ Найден index.mjs"
    
    # Проверяем права
    chmod +x index.mjs
    
    # Проверяем синтаксис
    if node --check index.mjs; then
        echo "✅ Синтаксис index.mjs корректен"
    else
        echo "❌ Синтаксис index.mjs некорректен"
        exit 1
    fi
    
    # Останавливаем PM2
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    
    # Запускаем ES модули
    pm2 start ecosystem.config.cjs
    
    # Ждем
    sleep 3
    
    # Проверяем статус
    pm2 status
    
else
    echo "❌ index.mjs не найден"
    exit 1
fi

echo "✅ PM2 исправлен!"
EOF
    
    # Устанавливаем права на скрипт
    if [ "$PROJECT_USER" != "root" ]; then
        chown $PROJECT_USER:$PROJECT_USER $SCRIPTS_DIR/fix-pm2.sh
    fi
    chmod +x $SCRIPTS_DIR/fix-pm2.sh
    
    log "✅ Скрипты управления созданы"
}

# Функция проверки DNS домена
check_domain_dns() {
    log "🔍 Проверяем DNS настройки домена $DOMAIN..."
    
    if command -v nslookup >/dev/null 2>&1; then
        DOMAIN_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        if [ -n "$DOMAIN_IP" ]; then
            log "✅ Домен $DOMAIN указывает на IP: $DOMAIN_IP"
            
            # Получаем IP сервера
            SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "неизвестно")
            if [ "$SERVER_IP" != "неизвестно" ]; then
                if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
                    log "✅ DNS настроен правильно!"
                else
                    warn "⚠️ DNS указывает на другой IP ($DOMAIN_IP), а сервер имеет IP: $SERVER_IP"
                    warn "⚠️ Настройте DNS записи для правильной работы домена"
                fi
            else
                warn "⚠️ Не удалось определить IP сервера"
            fi
        else
            warn "⚠️ Не удалось получить IP домена $DOMAIN"
        fi
    else
        warn "⚠️ nslookup не найден, проверьте DNS настройки вручную"
    fi
}

# Функция проверки статуса
check_status() {
    log "🔍 Проверяем статус сервисов..."
    
    # Проверяем MongoDB
    if systemctl is-active --quiet mongod; then
        log "✅ MongoDB работает"
    else
        error "❌ MongoDB не работает"
    fi
    
    # Проверяем Nginx
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx работает"
    else
        error "❌ Nginx не работает"
    fi
    
    # Проверяем PM2
    log "🔍 Проверяем PM2..."
    PM2_STATUS=$(pm2 status 2>/dev/null)
    if echo "$PM2_STATUS" | grep -q "$PROJECT_NAME.*online"; then
        log "✅ PM2 приложение работает"
    elif echo "$PM2_STATUS" | grep -q "$PROJECT_NAME.*stopped"; then
        error "❌ PM2 приложение остановлено"
        log "📋 Логи PM2:"
        pm2 logs $PROJECT_NAME --lines 10
    elif echo "$PM2_STATUS" | grep -q "$PROJECT_NAME.*errored"; then
        error "❌ PM2 приложение с ошибкой"
        log "📋 Логи PM2:"
        pm2 logs $PROJECT_NAME --lines 10
    else
        error "❌ PM2 приложение не найдено"
        log "📋 Статус PM2:"
        echo "$PM2_STATUS"
    fi
    
    # Проверяем порт
    log "🔍 Проверяем порт 3000..."
    if command -v netstat >/dev/null 2>&1; then
        PORT_STATUS=$(netstat -tlnp | grep ":3000")
        if [ -n "$PORT_STATUS" ]; then
            log "✅ Приложение слушает порт 3000"
            echo "$PORT_STATUS"
        else
            error "❌ Приложение не слушает порт 3000"
        fi
    elif command -v ss >/dev/null 2>&1; then
        PORT_STATUS=$(ss -tlnp | grep ":3000")
        if [ -n "$PORT_STATUS" ]; then
            log "✅ Приложение слушает порт 3000"
            echo "$PORT_STATUS"
        else
            error "❌ Приложение не слушает порт 3000"
        fi
    else
        warn "⚠️ netstat и ss не найдены, проверяем через lsof..."
        PORT_STATUS=$(lsof -i :3000 2>/dev/null)
        if [ -n "$PORT_STATUS" ]; then
            log "✅ Приложение слушает порт 3000"
            echo "$PORT_STATUS"
        else
            error "❌ Приложение не слушает порт 3000"
        fi
    fi
    
    # Проверяем статические файлы
    log "🔍 Проверяем статические файлы..."
    if [ -d "$WORK_DIR/_nuxt" ]; then
        log "✅ Директория _nuxt найдена"
        ls -la "$WORK_DIR/_nuxt/" | head -5
    else
        error "❌ Директория _nuxt не найдена"
    fi
    
    # Проверяем доступность сайта
    log "🌐 Проверяем доступность сайта..."
    if command -v curl >/dev/null 2>&1; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ]; then
            log "✅ Сайт доступен (HTTP $HTTP_CODE)"
        else
            error "❌ Сайт недоступен (HTTP $HTTP_CODE)"
        fi
    else
        warn "⚠️ curl не найден, проверьте сайт вручную: http://$DOMAIN"
    fi
}

# Основная логика
main() {
    case $INSTALL_MODE in
        "fresh")
            log "🚀 Начинаем чистую установку..."
            install_dependencies
            setup_directories
            setup_mongodb
            clone_and_build
            copy_files
            setup_pm2
            setup_nginx
            setup_firewall
            create_management_scripts
            check_domain_dns
            check_status
            ;;
        "quick-update")
            log "🔄 Быстрое обновление проекта..."
            
            # Проверяем что директории существуют
            if [ ! -d "$PROJECT_DIR" ]; then
                error "Репозиторий не найден: $PROJECT_DIR"
                error "Используйте режим 'Чистая установка'"
                exit 1
            fi
            
            if [ ! -d "$WORK_DIR" ]; then
                error "Рабочая директория не найдена: $WORK_DIR"
                error "Используйте режим 'Чистая установка'"
                exit 1
            fi
            
            # Сохраняем конфигурацию PM2
            log "Сохраняем конфигурацию PM2..."
            if [ -f "$WORK_DIR/ecosystem.config.cjs" ]; then
                cp "$WORK_DIR/ecosystem.config.cjs" "/tmp/ecosystem.config.cjs.backup"
            fi
            
            # Обновляем репозиторий
            log "Обновляем код из GitHub..."
            cd $PROJECT_DIR
            git pull origin main
            
            # Собираем проект
            log "Собираем проект..."
            npm run build
            
            # Копируем файлы (правильная структура Nuxt 3)
            log "Копируем файлы..."
            rm -rf $WORK_DIR/*
            cp -r .output/server/* $WORK_DIR/
            cp -r .output/public/* $WORK_DIR/ 2>/dev/null || true
            
            # Восстанавливаем конфигурацию PM2
            if [ -f "/tmp/ecosystem.config.cjs.backup" ]; then
                cp "/tmp/ecosystem.config.cjs.backup" "$WORK_DIR/ecosystem.config.cjs"
                log "Конфигурация PM2 восстановлена"
            fi
            
            # Перезапускаем PM2
            log "Перезапускаем приложение..."
            pm2 restart $PROJECT_NAME
            
            sleep 3
            
            pm2 status
            
            log "✅ Обновление завершено!"
            log "Проверьте сайт: http://$DOMAIN"
            ;;
        "full-update")
            log "🔄 Полное обновление проекта..."
            setup_directories
            clone_and_build
            copy_files
            setup_pm2
            create_management_scripts
            check_domain_dns
            check_status
            ;;
        "reinstall")
            log "🗑️ Начинаем переустановку..."
            
            warn "⚠️  ВНИМАНИЕ: Будут удалены следующие данные:"
            warn "   - Рабочая директория: $WORK_DIR"
            warn "   - Логи: $LOG_DIR"
            warn "   - PM2 процесс: $PROJECT_NAME"
            echo
            question "Удалить также репозиторий $PROJECT_DIR? (y/N)"
            read -p "> " delete_repo
            
            echo
            info "✅ НЕ будут удалены:"
            info "   - MongoDB и данные базы"
            info "   - Nginx (только будет перезапущен)"
            if [[ ! $delete_repo =~ ^[Yy]$ ]]; then
                info "   - Репозиторий: $PROJECT_DIR"
            fi
            echo
            read -p "Продолжить переустановку? (y/N): " reinstall_confirm
            
            if [[ ! $reinstall_confirm =~ ^[Yy]$ ]]; then
                log "Переустановка отменена"
                exit 0
            fi
            
            # Останавливаем сервисы (НЕ останавливаем MongoDB!)
            log "Останавливаем PM2..."
            pm2 stop $PROJECT_NAME 2>/dev/null || true
            pm2 delete $PROJECT_NAME 2>/dev/null || true
            
            log "Останавливаем Nginx..."
            systemctl stop nginx 2>/dev/null || true
            
            # Удаляем файлы приложения
            log "Удаляем рабочую директорию..."
            rm -rf $WORK_DIR
            
            log "Удаляем логи..."
            rm -rf $LOG_DIR
            
            # Удаляем репозиторий если пользователь подтвердил
            if [[ $delete_repo =~ ^[Yy]$ ]]; then
                log "Удаляем репозиторий..."
                rm -rf $PROJECT_DIR
            fi
            
            # Переустанавливаем
            install_dependencies
            setup_directories
            setup_mongodb
            clone_and_build
            copy_files
            setup_pm2
            setup_nginx
            setup_firewall
            create_management_scripts
            check_domain_dns
            check_status
            ;;
    esac
    
    log "🎉 Установка завершена!"
    log ""
    log "📋 Результат:"
    log "✅ Проект: $PROJECT_NAME"
    log "✅ Пользователь: $PROJECT_USER"
    log "✅ Домен: $DOMAIN"
    log "✅ Рабочая директория: $WORK_DIR"
    log "✅ MongoDB: $MONGO_DB (пользователь: $MONGO_USER)"
    log "✅ PM2 настроен"
    log "✅ Nginx настроен"
    log "✅ Firewall настроен"
    log ""
    log "🔧 Полезные команды:"
    log "  - Статус: pm2 status"
    log "  - Логи: pm2 logs $PROJECT_NAME"
    log "  - Обновление: ./update-app.sh"
    log "  - Перезапуск: pm2 restart $PROJECT_NAME"
    log "  - Исправление PM2: ./fix-pm2.sh"
    log "  - Запуск: ./start-app.sh"
    log ""
    log "🌐 Проверьте сайт: http://$DOMAIN"
    log ""
    log "🔐 Настройте SSL сертификат:"
    log "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    log ""
    log "📋 Что нужно сделать с доменом:"
    log "  1. Настройте DNS записи для $DOMAIN и www.$DOMAIN"
    log "  2. Убедитесь, что домены указывают на IP этого сервера"
    log "  3. Дождитесь распространения DNS (может занять до 24 часов)"
    log "  4. После этого настройте SSL сертификат"
    log ""
    log "📝 Сохраненные данные:"
    log "  - MongoDB пароль: $MONGO_PASS"
    log "  - JWT Secret: [сгенерирован автоматически]"
    if [ -n "$USER_PASSWORD" ]; then
        log "  - Пароль пользователя $PROJECT_USER: [установлен]"
    fi
}

# Запускаем основную функцию
main "$@"
