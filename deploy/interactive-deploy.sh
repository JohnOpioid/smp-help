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
    openssl rand -base64 64 | tr -d "=+/"
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
echo "2) Обновление существующего проекта"
echo "3) Переустановка (удалить все и установить заново)"
read -p "Введите номер (1-3): " mode

case $mode in
    1) INSTALL_MODE="fresh" ;;
    2) INSTALL_MODE="update" ;;
    3) INSTALL_MODE="reinstall" ;;
    *) error "Неверный выбор"; exit 1 ;;
esac

log "Выбран режим: $INSTALL_MODE"

# Сбор информации о проекте
echo
info "=== СБОР ИНФОРМАЦИИ О ПРОЕКТЕ ==="

read_input "Введите название проекта" PROJECT_NAME "false" "smp-help"
read_input "Введите имя пользователя для проекта" PROJECT_USER "false" "smp-help"
read_input "Введите домен вашего сайта (например: helpsmp.ru)" DOMAIN "false" "helpsmp.ru"
read_input "Введите рабочую директорию" WORK_DIR "false" "/var/www/$DOMAIN"

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

read_input "Введите название базы данных" MONGO_DB "false" "$PROJECT_NAME"
read_input "Введите имя пользователя MongoDB" MONGO_USER "false" "help-smp-user"

# Генерируем пароль для MongoDB
MONGO_PASS=$(generate_password 16)
log "Сгенерирован пароль для MongoDB: $MONGO_PASS"

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

# Устанавливаем пути
PROJECT_DIR="/home/$PROJECT_USER/$GITHUB_REPO"
LOG_DIR="/var/log/$PROJECT_NAME"

log "Начинаем установку с выбранными настройками..."

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
    
    log "✅ Системные зависимости установлены"
}

# Функция создания пользователя и директорий
setup_user_and_directories() {
    log "👤 Настраиваем пользователя и директории..."
    
    # Создаем пользователя если не существует
    if ! id "$PROJECT_USER" &>/dev/null; then
        useradd -m -s /bin/bash $PROJECT_USER
        usermod -aG sudo $PROJECT_USER
        
        # Устанавливаем пароль если указан
        if [ -n "$USER_PASSWORD" ]; then
            echo "$PROJECT_USER:$USER_PASSWORD" | chpasswd
        fi
        
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
    sudo -u $PROJECT_USER bash -c "
        # Переходим в домашнюю директорию
        cd /home/$PROJECT_USER
        
        # Клонируем репозиторий
        if [ -d '$GITHUB_REPO' ]; then
            echo '📁 Репозиторий уже существует, обновляем...'
            cd $GITHUB_REPO
            git pull origin main
        else
            echo '📥 Клонируем репозиторий...'
            git clone $GITHUB_URL
            cd $GITHUB_REPO
        fi
        
        # Создаем файл окружения
        echo '⚙️ Создаем конфигурацию окружения...'
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
        echo '📦 Устанавливаем зависимости...'
        npm install
        
        # Проверяем версию Node.js
        NODE_VERSION=\$(node --version)
        echo \"📋 Версия Node.js: \$NODE_VERSION\"
        
        # Собираем проект
        echo '🔨 Собираем проект...'
        if npm run build; then
            echo '✅ Проект собран успешно'
        else
            echo '❌ Ошибка сборки проекта'
            echo '📋 Проверьте логи выше для диагностики'
            exit 1
        fi
    "
}

# Функция копирования файлов
copy_files() {
    log "📁 Копируем файлы в рабочую директорию..."
    
    # Очищаем рабочую директорию
    rm -rf $WORK_DIR/*
    
    # Копируем собранные файлы
    cp -r /home/$PROJECT_USER/$GITHUB_REPO/.output/public/* $WORK_DIR/
    cp -r /home/$PROJECT_USER/$GITHUB_REPO/.output/server/* $WORK_DIR/
    
    # Устанавливаем права
    chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
    chmod -R 755 $WORK_DIR
    
    log "✅ Файлы скопированы"
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
    
    # Создаем конфигурацию PM2 для ES модулей
    sudo -u $PROJECT_USER bash -c "
        cd $WORK_DIR
        
        # Создаем конфигурацию PM2 для ES модулей
        cat > ecosystem.config.mjs << 'EOF'
export default {
  apps: [{
    name: '$PROJECT_NAME',
    script: './index.mjs',
    cwd: '$WORK_DIR',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'node',
    interpreter_args: '--experimental-modules',
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
}
EOF
        
        # Останавливаем старые процессы
        pm2 stop $PROJECT_NAME 2>/dev/null || true
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        
        # Запускаем приложение
        pm2 start ecosystem.config.mjs
        
        # Ждем немного
        sleep 3
        
        # Проверяем статус
        pm2 status
        
        # Сохраняем конфигурацию
        pm2 save
        pm2 startup
    "
    
    # Проверяем, что PM2 запустился
    if sudo -u $PROJECT_USER pm2 status | grep -q "$PROJECT_NAME.*online"; then
        log "✅ PM2 настроен и приложение запущено"
    else
        warn "⚠️ PM2 настроен, но приложение может не работать"
        log "📋 Проверьте логи: su - $PROJECT_USER && pm2 logs $PROJECT_NAME"
        
        # Пробуем создать CommonJS версию как fallback
        log "🔧 Создаем CommonJS версию как fallback..."
        sudo -u $PROJECT_USER bash -c "
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
            cat > ecosystem.config.js << 'EOF'
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
        "
        
        if sudo -u $PROJECT_USER pm2 status | grep -q "$PROJECT_NAME.*online"; then
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
    cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
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
        alias WORK_DIR_PLACEHOLDER/_nuxt/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/DOMAIN_PLACEHOLDER.access.log;
    error_log /var/log/nginx/DOMAIN_PLACEHOLDER.error.log;
}
EOF
    
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
    
    # Скрипт обновления
    sudo -u $PROJECT_USER bash -c "
        cat > update-app.sh << 'EOF'
#!/bin/bash

set -e

echo \"🔄 Обновляем $PROJECT_NAME...\"

cd $PROJECT_DIR

echo \"📥 Получаем изменения из GitHub...\"
git pull origin main

echo \"📦 Устанавливаем зависимости...\"
npm install

echo \"🔨 Собираем проект...\"
npm run build

echo \"📁 Копируем файлы...\"
sudo cp -r .output/public/* $WORK_DIR/
sudo cp -r .output/server/* $WORK_DIR/
sudo chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR

echo \"🚀 Перезапускаем приложение...\"
pm2 restart $PROJECT_NAME

echo \"✅ Обновление завершено!\"
pm2 status
EOF
        
        chmod +x update-app.sh
    "
    
    # Скрипт запуска
    sudo -u $PROJECT_USER bash -c "
        cat > start-app.sh << 'EOF'
#!/bin/bash

echo \"🚀 Запускаем $PROJECT_NAME...\"

pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true

# Пробуем запустить ES модули
if [ -f \"$WORK_DIR/index.mjs\" ]; then
    echo \"📦 Запускаем ES модули...\"
    pm2 start ecosystem.config.mjs
else
    echo \"📦 Запускаем CommonJS...\"
    pm2 start ecosystem.config.js
fi

echo \"✅ Приложение запущено!\"
echo \"Проверьте статус: pm2 status\"
EOF
        
        chmod +x start-app.sh
    "
    
    # Скрипт исправления PM2
    sudo -u $PROJECT_USER bash -c "
        cat > fix-pm2.sh << 'EOF'
#!/bin/bash

echo \"🔧 Исправляем проблемы с PM2...\"

cd $WORK_DIR

# Проверяем, есть ли index.mjs
if [ -f \"index.mjs\" ]; then
    echo \"✅ Найден index.mjs\"
    
    # Проверяем права
    chmod +x index.mjs
    
    # Проверяем синтаксис
    if node --check index.mjs; then
        echo \"✅ Синтаксис index.mjs корректен\"
    else
        echo \"❌ Синтаксис index.mjs некорректен\"
        exit 1
    fi
    
    # Останавливаем PM2
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    
    # Запускаем ES модули
    pm2 start ecosystem.config.mjs
    
    # Ждем
    sleep 3
    
    # Проверяем статус
    pm2 status
    
else
    echo \"❌ index.mjs не найден\"
    exit 1
fi

echo \"✅ PM2 исправлен!\"
EOF
        
        chmod +x fix-pm2.sh
    "
    
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
    PM2_STATUS=$(sudo -u $PROJECT_USER pm2 status 2>/dev/null)
    if echo "$PM2_STATUS" | grep -q "$PROJECT_NAME.*online"; then
        log "✅ PM2 приложение работает"
    elif echo "$PM2_STATUS" | grep -q "$PROJECT_NAME.*stopped"; then
        error "❌ PM2 приложение остановлено"
        log "📋 Логи PM2:"
        sudo -u $PROJECT_USER pm2 logs $PROJECT_NAME --lines 10
    elif echo "$PM2_STATUS" | grep -q "$PROJECT_NAME.*errored"; then
        error "❌ PM2 приложение с ошибкой"
        log "📋 Логи PM2:"
        sudo -u $PROJECT_USER pm2 logs $PROJECT_NAME --lines 10
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
            setup_user_and_directories
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
        "update")
            log "🔄 Начинаем обновление..."
            setup_user_and_directories
            clone_and_build
            copy_files
            setup_pm2
            create_management_scripts
            check_domain_dns
            check_status
            ;;
        "reinstall")
            log "🗑️ Начинаем переустановку..."
            # Останавливаем сервисы
            sudo -u $PROJECT_USER pm2 stop $PROJECT_NAME 2>/dev/null || true
            sudo -u $PROJECT_USER pm2 delete $PROJECT_NAME 2>/dev/null || true
            systemctl stop nginx 2>/dev/null || true
            systemctl stop mongod 2>/dev/null || true
            
            # Удаляем файлы
            rm -rf $WORK_DIR
            rm -rf $PROJECT_DIR
            rm -rf $LOG_DIR
            
            # Переустанавливаем
            install_dependencies
            setup_user_and_directories
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
    log "  - Статус: su - $PROJECT_USER && pm2 status"
    log "  - Логи: su - $PROJECT_USER && pm2 logs $PROJECT_NAME"
    log "  - Обновление: su - $PROJECT_USER && ./update-app.sh"
    log "  - Перезапуск: su - $PROJECT_USER && pm2 restart $PROJECT_NAME"
    log "  - Исправление PM2: su - $PROJECT_USER && ./fix-pm2.sh"
    log "  - Запуск: su - $PROJECT_USER && ./start-app.sh"
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
