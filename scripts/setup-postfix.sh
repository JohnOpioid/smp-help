#!/bin/bash

# Скрипт автоматической настройки Postfix для helpsmp.ru
# Использование: sudo bash scripts/setup-postfix.sh

set -e

DOMAIN="helpsmp.ru"
HOSTNAME="mail.helpsmp.ru"
IP="185.185.68.107"

echo "🚀 Настройка Postfix для $DOMAIN"
echo "=========================================="

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Этот скрипт должен запускаться с правами root"
    exit 1
fi

# Обновление системы
echo ""
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Установка Postfix
echo ""
echo "📦 Установка Postfix..."
export DEBIAN_FRONTEND=noninteractive
echo "postfix postfix/mailname string $DOMAIN" | debconf-set-selections
echo "postfix postfix/main_mailer_type string 'Internet Site'" | debconf-set-selections
apt install -y postfix mailutils

# Настройка hosts
echo ""
echo "🔧 Настройка /etc/hosts..."
if ! grep -q "$HOSTNAME" /etc/hosts; then
    echo "$IP   $HOSTNAME  mail" >> /etc/hosts
    echo "✅ Добавлено в /etc/hosts"
else
    echo "✅ Уже настроено в /etc/hosts"
fi

# Бэкап main.cf
echo ""
echo "💾 Создание бэкапа конфигурации..."
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

# Настройка main.cf
echo ""
echo "🔧 Настройка main.cf..."
cat > /etc/postfix/main.cf << EOF
# Основные настройки
myhostname = $HOSTNAME
mydomain = $DOMAIN
myorigin = \$mydomain

# Интерфейсы
inet_interfaces = all
inet_protocols = ipv4

# Сети
mydestination = \$myhostname, \$mydomain, localhost.\$mydomain, localhost
mynetworks = 127.0.0.0/8, [::ffff:127.0.0.0]/104, [::1]/128

# Настройки безопасности
smtpd_banner = \$myhostname ESMTP
disable_vrfy_command = yes
smtpd_helo_required = yes

# Настройки размера
message_size_limit = 10485760
mailbox_size_limit = 0
maximal_queue_lifetime = 7d

# TLS/SSL
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_tls_security_level = may
smtpd_tls_auth_only = yes
smtpd_tls_received_header = yes
smtpd_tls_session_cache_timeout = 3600s

# Настройки доставки
smtpd_recipient_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination,
    reject_unknown_recipient_domain,
    permit

smtpd_sender_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_sender,
    reject_unknown_sender_domain,
    permit

smtpd_helo_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_invalid_helo_hostname,
    reject_non_fqdn_helo_hostname,
    permit

# Логирование
mail.log = /var/log/mail.log
EOF

echo "✅ main.cf настроен"

# Настройка master.cf
echo ""
echo "🔧 Настройка master.cf..."
if ! grep -q "^submission" /etc/postfix/master.cf; then
    cat >> /etc/postfix/master.cf << EOF

submission     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_tls_auth_only=yes
EOF
    echo "✅ Порт 587 добавлен в master.cf"
else
    echo "✅ Порт 587 уже настроен"
fi

# Проверка конфигурации
echo ""
echo "🔍 Проверка конфигурации..."
postfix check

# Перезапуск Postfix
echo ""
echo "🔄 Перезапуск Postfix..."
systemctl restart postfix
systemctl enable postfix

# Проверка статуса
echo ""
echo "📊 Статус Postfix:"
systemctl status postfix --no-pager -l

# Открытие портов
echo ""
echo "🔥 Настройка брандмауэра..."
if command -v ufw &> /dev/null; then
    ufw allow 25/tcp
    ufw allow 587/tcp
    echo "✅ Порты 25 и 587 открыты"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=smtp
    firewall-cmd --permanent --add-port=587/tcp
    firewall-cmd --reload
    echo "✅ Порты открыты через firewalld"
else
    echo "⚠️  Брандмауэр не найден, откройте порты вручную: 25, 587"
fi

# Проверка портов
echo ""
echo "🔍 Проверка открытых портов..."
if netstat -tlnp 2>/dev/null | grep -q ":25 "; then
    echo "✅ SMTP (порт 25) слушает"
else
    echo "❌ SMTP (порт 25) не слушает"
fi

if netstat -tlnp 2>/dev/null | grep -q ":587 "; then
    echo "✅ Submission (порт 587) слушает"
else
    echo "❌ Submission (порт 587) не слушает"
fi

echo ""
echo "=========================================="
echo "✅ Postfix настроен успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Настройте DNS записи (см. POSTFIX_SETUP.md)"
echo "2. Проверьте отправку: echo 'test' | mail -s 'Subject' your-email@gmail.com"
echo "3. Настройте .env в приложении:"
echo "   SMTP_HOST=127.0.0.1"
echo "   SMTP_PORT=587"
echo ""
echo "📊 Для мониторинга: tail -f /var/log/mail.log"
echo "=========================================="

