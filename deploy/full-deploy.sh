#!/bin/bash

# Полный скрипт деплоя SMP Help на Ubuntu сервер
# Автор: AI Assistant
# Дата: 2025-01-10
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    error "Этот скрипт должен быть запущен от root пользователя"
    exit 1
fi

log "🚀 Начинаем полный деплой SMP Help..."

# Данные проекта
PROJECT_NAME="smp-help"
PROJECT_USER="smp-help"
PROJECT_DIR="/home/$PROJECT_USER/$PROJECT_NAME"
WORK_DIR="/var/www/helpsmp.ru"
LOG_DIR="/var/log/$PROJECT_NAME"
DOMAIN="helpsmp.ru"
GITHUB_USER="JohnOpioid"
GITHUB_PASS="Qaswer1994!"
GITHUB_REPO="https://$GITHUB_USER:$GITHUB_PASS@github.com/$GITHUB_USER/$PROJECT_NAME.git"

# JWT Secret
JWT_SECRET="smp-help-2024-production-secret-key-xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567"

# MongoDB данные
MONGO_DB="smp-help"
MONGO_USER="help-smp-user"
MONGO_PASS="help-smp"

log "📋 Конфигурация проекта:"
log "  - Проект: $PROJECT_NAME"
log "  - Пользователь: $PROJECT_USER"
log "  - Домен: $DOMAIN"
log "  - GitHub: $GITHUB_REPO"
log "  - Рабочая директория: $WORK_DIR"

# Функция установки зависимостей
install_dependencies() {
    log "📦 Обновляем систему и устанавливаем зависимости..."
    
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    # Устанавливаем Node.js 18
    log "📦 Устанавливаем Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Устанавливаем MongoDB
    log "📦 Устанавливаем MongoDB..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
    
    # Запускаем и включаем автозапуск MongoDB
    systemctl start mongod
    systemctl enable mongod
    
    # Устанавливаем Nginx
    log "📦 Устанавливаем Nginx..."
    apt install -y nginx
    
    # Устанавливаем PM2
    log "📦 Устанавливаем PM2..."
    npm install -g pm2
    
    # Устанавливаем Certbot
    log "📦 Устанавливаем Certbot..."
    apt install -y certbot python3-certbot-nginx
}

# Функция создания пользователя и директорий
setup_user_and_directories() {
    log "👤 Создаем пользователя и директории..."
    
    # Создаем пользователя если не существует
    if ! id "$PROJECT_USER" &>/dev/null; then
        useradd -m -s /bin/bash $PROJECT_USER
        usermod -aG sudo $PROJECT_USER
        log "✅ Пользователь $PROJECT_USER создан"
    else
        log "ℹ️ Пользователь $PROJECT_USER уже существует"
    fi
    
    # Создаем директории
    mkdir -p $WORK_DIR
    mkdir -p $LOG_DIR
    chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
    chown -R $PROJECT_USER:$PROJECT_USER $LOG_DIR
    
    log "✅ Директории созданы"
}

# Функция настройки MongoDB
setup_mongodb() {
    log "🗄️ Настраиваем MongoDB..."
    
    # Ждем запуска MongoDB
    sleep 5
    
    # Создаем пользователя для базы данных
    mongosh --eval "
        use $MONGO_DB;
        try {
            db.createUser({
                user: '$MONGO_USER',
                pwd: '$MONGO_PASS',
                roles: ['readWrite']
            });
            print('✅ Пользователь MongoDB создан');
        } catch (e) {
            if (e.code === 51003) {
                print('ℹ️ Пользователь MongoDB уже существует');
            } else {
                print('❌ Ошибка создания пользователя MongoDB:', e.message);
            }
        }
    "
    
    log "✅ MongoDB настроена"
}

# Функция клонирования и сборки проекта
clone_and_build() {
    log "📥 Клонируем и собираем проект..."
    
    # Переключаемся на пользователя проекта
    su - $PROJECT_USER -c "
        # Переходим в домашнюю директорию
        cd /home/$PROJECT_USER
        
        # Клонируем репозиторий
        if [ -d '$PROJECT_NAME' ]; then
            log '📁 Репозиторий уже существует, обновляем...'
            cd $PROJECT_NAME
            git pull origin main
        else
            log '📥 Клонируем репозиторий...'
            git clone $GITHUB_REPO
            cd $PROJECT_NAME
        fi
        
        # Создаем файл окружения
        log '⚙️ Создаем конфигурацию окружения...'
        cat > .env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production
NUXT_PUBLIC_API_BASE_URL=https://$DOMAIN/api
NUXT_PUBLIC_APP_URL=https://$DOMAIN
PORT=3000

# MongoDB
MONGODB_URI=mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB

# JWT Secret
JWT_SECRET=$JWT_SECRET

# AI Configuration (если используете)
GIGACHAT_API_KEY=your-gigachat-api-key-here
GIGACHAT_API_URL=https://gigachat.devices.sberbank.ru/api/v1

# Email Configuration (если используете)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
        
        # Устанавливаем зависимости
        log '📦 Устанавливаем зависимости...'
        npm install
        
        # Собираем проект
        log '🔨 Собираем проект...'
        npm run build
        
        log '✅ Проект собран'
    "
}

# Функция копирования файлов
copy_files() {
    log "📁 Копируем файлы в рабочую директорию..."
    
    # Очищаем рабочую директорию
    rm -rf $WORK_DIR/*
    
    # Копируем собранные файлы
    cp -r $PROJECT_DIR/.output/public/* $WORK_DIR/
    cp -r $PROJECT_DIR/.output/server/* $WORK_DIR/
    
    # Устанавливаем права
    chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
    chmod -R 755 $WORK_DIR
    
    log "✅ Файлы скопированы"
}

# Функция настройки PM2
setup_pm2() {
    log "⚙️ Настраиваем PM2..."
    
    # Создаем конфигурацию PM2
    su - $PROJECT_USER -c "
        cat > ecosystem.config.mjs << 'EOF'
export default {
  apps: [{
    name: '$PROJECT_NAME',
    script: '$WORK_DIR/index.mjs',
    cwd: '$WORK_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB',
      JWT_SECRET: '$JWT_SECRET'
    },
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true
  }]
}
EOF
        
        # Останавливаем старые процессы
        pm2 stop $PROJECT_NAME 2>/dev/null || true
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        
        # Запускаем приложение
        pm2 start ecosystem.config.mjs
        
        # Сохраняем конфигурацию
        pm2 save
        pm2 startup
    "
    
    log "✅ PM2 настроен"
}

# Функция настройки Nginx
setup_nginx() {
    log "🌐 Настраиваем Nginx..."
    
    # Создаем конфигурацию Nginx
    cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name helpsmp.ru www.helpsmp.ru;
    
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
    
    location /_nuxt/ {
        alias /var/www/helpsmp.ru/_nuxt/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/helpsmp.ru.access.log;
    error_log /var/log/nginx/helpsmp.ru.error.log;
}
EOF
    
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
    
    # Скрипт обновления
    su - $PROJECT_USER -c "
        cat > update-app.sh << 'EOF'
#!/bin/bash

echo '🔄 Обновляем SMP Help...'

# Переходим в папку проекта
cd $PROJECT_DIR

# Получаем изменения
echo '📥 Получаем изменения из GitHub...'
git pull origin main

# Устанавливаем зависимости
echo '📦 Устанавливаем зависимости...'
npm install

# Собираем проект
echo '🔨 Собираем проект...'
npm run build

# Копируем файлы (нужны права root)
echo '📁 Копируем файлы...'
sudo cp -r .output/public/* $WORK_DIR/
sudo cp -r .output/server/* $WORK_DIR/
sudo chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR

# Перезапускаем приложение
echo '🚀 Перезапускаем приложение...'
pm2 restart $PROJECT_NAME

echo '✅ Обновление завершено!'
echo 'Проверьте статус: pm2 status'
EOF
        
        chmod +x update-app.sh
    "
    
    # Скрипт запуска
    su - $PROJECT_USER -c "
        cat > start-app.sh << 'EOF'
#!/bin/bash

echo '🚀 Запускаем SMP Help...'

# Останавливаем старые процессы
pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true

# Запускаем приложение
pm2 start ecosystem.config.mjs

echo '✅ Приложение запущено!'
echo 'Проверьте статус: pm2 status'
EOF
        
        chmod +x start-app.sh
    "
    
    log "✅ Скрипты управления созданы"
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
    su - $PROJECT_USER -c "pm2 status" | grep -q "$PROJECT_NAME" && log "✅ PM2 приложение работает" || error "❌ PM2 приложение не работает"
    
    # Проверяем порт
    if netstat -tlnp | grep -q ":3000"; then
        log "✅ Приложение слушает порт 3000"
    else
        error "❌ Приложение не слушает порт 3000"
    fi
}

# Основная функция
main() {
    log "🚀 Начинаем полный деплой SMP Help..."
    
    # Устанавливаем зависимости
    install_dependencies
    
    # Создаем пользователя и директории
    setup_user_and_directories
    
    # Настраиваем MongoDB
    setup_mongodb
    
    # Клонируем и собираем проект
    clone_and_build
    
    # Копируем файлы
    copy_files
    
    # Настраиваем PM2
    setup_pm2
    
    # Настраиваем Nginx
    setup_nginx
    
    # Настраиваем firewall
    setup_firewall
    
    # Создаем скрипты управления
    create_management_scripts
    
    # Проверяем статус
    check_status
    
    log "🎉 Деплой завершен успешно!"
    log ""
    log "📋 Следующие шаги:"
    log "1. Настройте SSL сертификат: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    log "2. Проверьте работу сайта: https://$DOMAIN"
    log "3. Для обновления используйте: su - $PROJECT_USER && ./update-app.sh"
    log ""
    log "🔧 Полезные команды:"
    log "  - Статус приложения: su - $PROJECT_USER && pm2 status"
    log "  - Логи приложения: su - $PROJECT_USER && pm2 logs $PROJECT_NAME"
    log "  - Перезапуск: su - $PROJECT_USER && pm2 restart $PROJECT_NAME"
    log "  - Логи Nginx: tail -f /var/log/nginx/$DOMAIN.error.log"
}

# Запускаем основную функцию
main "$@"
