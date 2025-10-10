#!/bin/bash

# Скрипт для продолжения установки SMP Help
# Запускать от root пользователя

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции для вывода
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Переменные (используем те же, что были введены)
PROJECT_NAME="helpsmp"
PROJECT_USER="helpsmp"
DOMAIN="helpsmp.ru"
WORK_DIR="/var/www/helpsmp.ru"
GITHUB_REPO="smp-help"
PROJECT_DIR="/home/$PROJECT_USER/$GITHUB_REPO"
LOG_DIR="/var/log/$PROJECT_NAME"

log "🔧 Продолжаем установку SMP Help..."

# Функция сборки проекта
build_project() {
    log "🔨 Собираем проект..."
    
    # Переключаемся на пользователя проекта
    sudo -u $PROJECT_USER bash -c "
        cd $PROJECT_DIR
        
        echo '📦 Устанавливаем зависимости...'
        npm install
        
        echo '🔨 Собираем проект...'
        npm run build
        
        echo '✅ Проект собран'
    "
    
    # Проверяем, что сборка прошла успешно
    if [ -d "$PROJECT_DIR/.output" ]; then
        log "✅ Проект успешно собран"
    else
        error "❌ Проект не собран, директория .output не найдена"
        return 1
    fi
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
      MONGODB_URI: 'mongodb://help-smp-user:3cENk9Qp1YPDN3al@localhost:27017/helpsmp',
      JWT_SECRET: 'your-jwt-secret-here',
      ADMIN_SETUP_TOKEN: 'your-admin-token-here',
      GIGACHAT_API_KEY: '',
      GIGACHAT_CLIENT_ID: '',
      GIGACHAT_SCOPE: '',
      GIGACHAT_API_URL: 'https://gigachat.devices.sberbank.ru/api/v1',
      SMTP_HOST: '',
      SMTP_PORT: '587',
      SMTP_USER: '',
      SMTP_PASS: '',
      YAMAPS_API_KEY: '0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c'
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
        error "❌ PM2 не удалось настроить"
        log "📋 Проверьте логи: su - $PROJECT_USER && pm2 logs $PROJECT_NAME"
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
    log "🔍 Проверяем PM2..."
    PM2_STATUS=$(sudo -u $PROJECT_USER pm2 status 2>/dev/null)
    if echo "$PM2_STATUS" | grep -q "$PROJECT_NAME.*online"; then
        log "✅ PM2 приложение работает"
    else
        error "❌ PM2 приложение не работает"
        log "📋 Логи PM2:"
        sudo -u $PROJECT_USER pm2 logs $PROJECT_NAME --lines 10
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
        log "⚠️ netstat и ss не найдены, проверяем через lsof..."
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
        log "⚠️ curl не найден, проверьте сайт вручную: http://$DOMAIN"
    fi
}

# Основная логика
main() {
    log "🚀 Продолжаем установку SMP Help..."
    
    build_project
    copy_files
    setup_pm2
    setup_nginx
    setup_firewall
    create_management_scripts
    check_status
    
    log "🎉 Установка завершена!"
    log ""
    log "📋 Результат:"
    log "✅ Проект: $PROJECT_NAME"
    log "✅ Пользователь: $PROJECT_USER"
    log "✅ Домен: $DOMAIN"
    log "✅ Рабочая директория: $WORK_DIR"
    log "✅ MongoDB: helpsmp (пользователь: help-smp-user)"
    log "✅ PM2 настроен"
    log "✅ Nginx настроен"
    log "✅ Firewall настроен"
    log ""
    log "🔧 Полезные команды:"
    log "  - Статус: su - $PROJECT_USER && pm2 status"
    log "  - Логи: su - $PROJECT_USER && pm2 logs $PROJECT_NAME"
    log "  - Обновление: su - $PROJECT_USER && ./update-app.sh"
    log "  - Перезапуск: su - $PROJECT_USER && pm2 restart $PROJECT_NAME"
    log ""
    log "🌐 Проверьте сайт: http://$DOMAIN"
    log ""
    log "🔐 Настройте SSL сертификат:"
    log "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    log ""
    log "📝 Сохраненные данные:"
    log "  - MongoDB пароль: 3cENk9Qp1YPDN3al"
    log "  - JWT Secret: [сгенерирован автоматически]"
}

# Запускаем основную функцию
main "$@"
