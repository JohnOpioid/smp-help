#!/bin/bash

# Универсальный скрипт исправления всех проблем SMP Help
# Запускать от root пользователя

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

# Конфигурация
PROJECT_NAME="smp-help"
PROJECT_USER="smp-help"
PROJECT_DIR="/home/$PROJECT_USER/$PROJECT_NAME"
WORK_DIR="/var/www/helpsmp.ru"
LOG_DIR="/var/log/$PROJECT_NAME"
DOMAIN="helpsmp.ru"

log "🔧 Начинаем исправление всех проблем SMP Help..."

# Функция исправления конфигурации Nuxt
fix_nuxt_config() {
    log "📝 Исправляем конфигурацию Nuxt..."
    
    su - $PROJECT_USER -c "
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] Создаем конфигурацию Nuxt...'
        cd $PROJECT_DIR
        
        # Создаем правильную конфигурацию Nuxt
        cat > nuxt.config.ts << 'EOF'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { port: 3000, host: 'localhost' },
  modules: ['@nuxt/ui'],
  nitro: {
    preset: 'node-server',
    publicAssets: [
      {
        baseURL: '/_nuxt',
        dir: '$WORK_DIR/_nuxt',
        maxAge: 31536000
      }
    ]
  },
  app: {
    head: {
      title: 'Справочник СМП',
      titleTemplate: '%s — Справочник СМП',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы.' }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help',
    adminSetupToken: process.env.ADMIN_SETUP_TOKEN || 'setup-token',
    gigachatApiKey: process.env.GIGACHAT_API_KEY,
    gigachatClientId: process.env.GIGACHAT_CLIENT_ID,
    gigachatScope: process.env.GIGACHAT_SCOPE,
    public: {
      apiBase: '/api',
      yamapsApiKey: process.env.YAMAPS_API_KEY || '0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c'
    }
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {}
    }
  }
})
EOF
        
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Конфигурация Nuxt обновлена'
    "
}

# Функция исправления прав доступа
fix_permissions() {
    log "🔐 Исправляем права доступа..."
    
    # Исправляем права на проект
    chown -R $PROJECT_USER:$PROJECT_USER $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    
    # Исправляем права на рабочую директорию
    chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
    chmod -R 755 $WORK_DIR
    
    # Исправляем права на логи
    chown -R $PROJECT_USER:$PROJECT_USER $LOG_DIR
    chmod -R 755 $LOG_DIR
    
    log "✅ Права доступа исправлены"
}

# Функция исправления Git
fix_git() {
    log "📁 Исправляем Git конфигурацию..."
    
    su - $PROJECT_USER -c "
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] Настраиваем Git...'
        cd $PROJECT_DIR
        
        # Добавляем директорию в безопасные
        git config --global --add safe.directory $PROJECT_DIR
        
        # Проверяем статус
        git status
        
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Git конфигурация исправлена'
    "
}

# Функция пересборки проекта
rebuild_project() {
    log "🔨 Пересобираем проект..."
    
    su - $PROJECT_USER -c "
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] Пересобираем проект...'
        cd $PROJECT_DIR
        
        # Очищаем предыдущую сборку
        rm -rf .nuxt .output node_modules/.cache
        
        # Устанавливаем зависимости
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] 📦 Устанавливаем зависимости...'
        npm install
        
        # Собираем проект
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] 🔨 Собираем проект...'
        npm run build
        
        # Проверяем результат
        if [ -d '.output/public' ] && [ -d '.output/server' ]; then
            echo '[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Проект успешно собран'
        else
            echo '[$(date +'%Y-%m-%d %H:%M:%S')] ❌ Ошибка сборки проекта'
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
    cp -r $PROJECT_DIR/.output/public/* $WORK_DIR/
    cp -r $PROJECT_DIR/.output/server/* $WORK_DIR/
    
    # Устанавливаем права
    chown -R $PROJECT_USER:$PROJECT_USER $WORK_DIR
    chmod -R 755 $WORK_DIR
    
    # Проверяем структуру
    if [ -d "$WORK_DIR/_nuxt" ] && [ -f "$WORK_DIR/index.mjs" ]; then
        log "✅ Файлы успешно скопированы"
        log "📊 Структура файлов:"
        ls -la $WORK_DIR/ | head -10
        log "📊 Статические файлы:"
        ls -la $WORK_DIR/_nuxt/ | head -5
    else
        error "❌ Ошибка копирования файлов"
        exit 1
    fi
}

# Функция обновления конфигурации PM2
update_pm2_config() {
    log "⚙️ Обновляем конфигурацию PM2..."
    
    su - $PROJECT_USER -c "
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] Создаем конфигурацию PM2...'
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
      MONGODB_URI: 'mongodb://help-smp-user:help-smp@localhost:27017/smp-help',
      JWT_SECRET: 'smp-help-2024-production-secret-key-xyz789abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567'
    },
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true
  }]
}
EOF
        
        echo '[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Конфигурация PM2 обновлена'
    "
}

# Функция перезапуска сервисов
restart_services() {
    log "🚀 Перезапускаем сервисы..."
    
    # Останавливаем приложение
    su - $PROJECT_USER -c "pm2 stop $PROJECT_NAME 2>/dev/null || true"
    su - $PROJECT_USER -c "pm2 delete $PROJECT_NAME 2>/dev/null || true"
    
    # Запускаем приложение
    su - $PROJECT_USER -c "pm2 start ecosystem.config.mjs"
    
    # Перезапускаем Nginx
    systemctl restart nginx
    
    # Проверяем статус
    sleep 3
    su - $PROJECT_USER -c "pm2 status"
    
    log "✅ Сервисы перезапущены"
}

# Функция проверки работы
check_health() {
    log "🔍 Проверяем работу системы..."
    
    # Проверяем MongoDB
    if systemctl is-active --quiet mongod; then
        log "✅ MongoDB работает"
    else
        error "❌ MongoDB не работает"
        systemctl start mongod
    fi
    
    # Проверяем Nginx
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx работает"
    else
        error "❌ Nginx не работает"
        systemctl start nginx
    fi
    
    # Проверяем PM2
    if su - $PROJECT_USER -c "pm2 status" | grep -q "$PROJECT_NAME.*online"; then
        log "✅ PM2 приложение работает"
    else
        error "❌ PM2 приложение не работает"
    fi
    
    # Проверяем порт
    if netstat -tlnp | grep -q ":3000"; then
        log "✅ Приложение слушает порт 3000"
    else
        error "❌ Приложение не слушает порт 3000"
    fi
    
    # Проверяем статические файлы
    if [ -f "$WORK_DIR/_nuxt/index.js" ]; then
        log "✅ Статические файлы на месте"
    else
        error "❌ Статические файлы отсутствуют"
    fi
    
    # Тестируем подключение
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        log "✅ Приложение отвечает на запросы"
    else
        warn "⚠️ Приложение не отвечает на запросы"
    fi
}

# Функция создания скриптов управления
create_management_scripts() {
    log "📝 Создаем скрипты управления..."
    
    # Скрипт обновления
    su - $PROJECT_USER -c "
        cat > update-app.sh << 'EOF'
#!/bin/bash

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e \"\${GREEN}[\$(date +'%Y-%m-%d %H:%M:%S')]\${NC} \$1\"
}

PROJECT_NAME=\"smp-help\"
PROJECT_DIR=\"/home/smp-help/smp-help\"
WORK_DIR=\"/var/www/helpsmp.ru\"

log \"🔄 Начинаем обновление SMP Help...\"

# Переходим в папку проекта
cd \$PROJECT_DIR

# Исправляем права доступа
sudo chown -R smp-help:smp-help \$PROJECT_DIR

# Добавляем директорию в безопасные
git config --global --add safe.directory \$PROJECT_DIR

# Получаем последние изменения
log \"📥 Получаем изменения из GitHub...\"
git pull origin main

# Устанавливаем зависимости
log \"📦 Устанавливаем зависимости...\"
npm install

# Собираем проект
log \"🔨 Собираем проект...\"
npm run build

# Копируем файлы
log \"📁 Копируем файлы...\"
sudo cp -r .output/public/* \$WORK_DIR/
sudo cp -r .output/server/* \$WORK_DIR/
sudo chown -R smp-help:smp-help \$WORK_DIR

# Перезапускаем приложение
log \"🚀 Перезапускаем приложение...\"
pm2 restart \$PROJECT_NAME

log \"✅ Обновление завершено!\"
pm2 status
EOF
        
        chmod +x update-app.sh
    "
    
    # Скрипт запуска
    su - $PROJECT_USER -c "
        cat > start-app.sh << 'EOF'
#!/bin/bash

echo \"🚀 Запускаем SMP Help...\"

# Останавливаем старые процессы
pm2 stop smp-help 2>/dev/null || true
pm2 delete smp-help 2>/dev/null || true

# Запускаем приложение
pm2 start ecosystem.config.mjs

echo \"✅ Приложение запущено!\"
echo \"Проверьте статус: pm2 status\"
EOF
        
        chmod +x start-app.sh
    "
    
    log "✅ Скрипты управления созданы"
}

# Основная функция
main() {
    log "🔧 Начинаем полное исправление SMP Help..."
    
    # Исправляем конфигурацию Nuxt
    fix_nuxt_config
    
    # Исправляем права доступа
    fix_permissions
    
    # Исправляем Git
    fix_git
    
    # Пересобираем проект
    rebuild_project
    
    # Копируем файлы
    copy_files
    
    # Обновляем конфигурацию PM2
    update_pm2_config
    
    # Перезапускаем сервисы
    restart_services
    
    # Проверяем работу
    check_health
    
    # Создаем скрипты управления
    create_management_scripts
    
    log "🎉 Все проблемы исправлены!"
    log ""
    log "📋 Результат:"
    log "✅ Конфигурация Nuxt исправлена"
    log "✅ Права доступа установлены"
    log "✅ Git настроен"
    log "✅ Проект пересобран"
    log "✅ Файлы скопированы"
    log "✅ PM2 настроен"
    log "✅ Сервисы перезапущены"
    log ""
    log "🔧 Полезные команды:"
    log "  - Статус: su - $PROJECT_USER && pm2 status"
    log "  - Логи: su - $PROJECT_USER && pm2 logs $PROJECT_NAME"
    log "  - Обновление: su - $PROJECT_USER && ./update-app.sh"
    log "  - Перезапуск: su - $PROJECT_USER && pm2 restart $PROJECT_NAME"
    log ""
    log "🌐 Проверьте сайт: https://$DOMAIN"
}

# Запускаем основную функцию
main "$@"
