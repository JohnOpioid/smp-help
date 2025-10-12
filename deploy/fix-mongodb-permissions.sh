#!/bin/bash

# Скрипт для исправления прав доступа пользователя MongoDB
# Запускать на сервере от root

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[OK]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔧 Исправление прав доступа MongoDB"
echo

MONGO_USER="help-smp-user"
MONGO_PASS="vTLJP0L5QFJIJ5Ya"
MONGO_DB="smp-help"

# Останавливаем MongoDB
log "Останавливаем MongoDB..."
systemctl stop mongod

# Отключаем аутентификацию
log "Отключаем аутентификацию..."
cp /etc/mongod.conf /etc/mongod.conf.backup.$(date +%Y%m%d_%H%M%S)
sed -i 's/^  authorization: enabled/#  authorization: enabled/' /etc/mongod.conf

# Запускаем MongoDB
log "Запускаем MongoDB без аутентификации..."
systemctl start mongod

# Ждём запуска
sleep 5

# Пересоздаём пользователя с правильными правами
log "Пересоздаём пользователя с правильными правами..."

mongosh << 'EOF'
use admin
// Удаляем старого пользователя если существует
try {
  db.dropUser("help-smp-user");
  print("Старый пользователь удалён");
} catch (e) {
  print("Пользователь не существовал");
}

use smp-help
// Создаём пользователя в базе smp-help
db.createUser({
  user: "help-smp-user",
  pwd: "vTLJP0L5QFJIJ5Ya",
  roles: [
    { role: "readWrite", db: "smp-help" },
    { role: "dbAdmin", db: "smp-help" }
  ]
})

print("✅ Пользователь создан в базе smp-help");

// Проверяем пользователя
var users = db.getUsers();
print("");
print("Пользователи в базе smp-help:");
users.users.forEach(function(u) {
  print("  - " + u.user);
  print("    Роли:");
  u.roles.forEach(function(r) {
    print("      * " + r.role + " на " + r.db);
  });
});

exit
EOF

if [ $? -eq 0 ]; then
    log "✅ Пользователь создан успешно"
else
    error "❌ Ошибка создания пользователя"
    mv /etc/mongod.conf.backup.* /etc/mongod.conf
    systemctl restart mongod
    exit 1
fi

# Включаем аутентификацию обратно
log "Включаем аутентификацию..."
mv /etc/mongod.conf.backup.* /etc/mongod.conf

# Перезапускаем MongoDB
log "Перезапускаем MongoDB..."
systemctl restart mongod
sleep 5

# Проверяем подключение
log "Проверяем подключение..."
if mongosh "mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB" --quiet --eval "db.version()" > /dev/null 2>&1; then
    log "✅ Подключение успешно (authSource=smp-help)"
    
    # Обновляем ecosystem.config.cjs
    log "Обновляем конфигурацию PM2..."
    sed -i "s|authSource=admin|authSource=smp-help|g" /var/www/html/helpsmp.ru/ecosystem.config.cjs
    
    log "Перезапускаем приложение..."
    pm2 restart smp-help --update-env
    
    sleep 3
    
    log "Проверяем логи..."
    pm2 logs smp-help --lines 10 --nostream
    
else
    error "❌ Подключение не удалось"
    exit 1
fi

echo
log "🎉 Готово! Пользователь настроен правильно"
echo
log "📝 Строка подключения:"
echo "  mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB"
echo
log "Теперь можете импортировать данные:"
log "  /root/import-mongodb-data.sh /home/mongodb"

