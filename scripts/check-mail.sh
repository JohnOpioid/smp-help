#!/bin/bash

# Скрипт диагностики email на сервере
# Использование: sudo bash scripts/check-mail.sh

echo "🔍 Диагностика email на сервере"
echo "=========================================="

# 1. Проверка установки
echo ""
echo "1️⃣ Проверка установки Postfix..."
if command -v postfix &> /dev/null; then
    echo "✅ Postfix установлен"
    postfix --version
else
    echo "❌ Postfix не установлен"
    echo "Установите: apt install postfix mailutils -y"
    exit 1
fi

# 2. Проверка статуса
echo ""
echo "2️⃣ Статус службы Postfix..."
systemctl status postfix --no-pager -l || echo "⚠️ Служба не запущена"

# 3. Проверка конфигурации
echo ""
echo "3️⃣ Проверка конфигурации..."
if postfix check; then
    echo "✅ Конфигурация корректна"
else
    echo "❌ Ошибки в конфигурации"
fi

# 4. Проверка портов
echo ""
echo "4️⃣ Проверка портов..."
if netstat -tlnp 2>/dev/null | grep -q ":25 "; then
    echo "✅ SMTP (порт 25) слушает"
else
    echo "❌ SMTP (порт 25) НЕ слушает"
fi

if netstat -tlnp 2>/dev/null | grep -q ":587 "; then
    echo "✅ Submission (порт 587) слушает"
else
    echo "❌ Submission (порт 587) НЕ слушает"
fi

# 5. Проверка логов
echo ""
echo "5️⃣ Последние записи в /var/log/mail.log..."
if [ -f /var/log/mail.log ]; then
    tail -20 /var/log/mail.log
else
    echo "⚠️ Файл логов не найден"
fi

# 6. Проверка hosts
echo ""
echo "6️⃣ Проверка /etc/hosts..."
cat /etc/hosts

# 7. Проверка DNS
echo ""
echo "7️⃣ Проверка DNS для helpsmp.ru..."
if dig helpsmp.ru +short &> /dev/null; then
    dig helpsmp.ru +short
else
    echo "⚠️ DNS запись не найдена"
fi

# 8. Тест отправки
echo ""
echo "8️⃣ Попытка отправки тестового письма..."
read -p "Введите email для теста: " test_email
if echo "Test message from helpsmp.ru" | mail -s "Test from helpsmp.ru" "$test_email"; then
    echo "✅ Письмо отправлено"
else
    echo "❌ Не удалось отправить письмо"
fi

# 9. Проверка очередов
echo ""
echo "9️⃣ Очередь писем..."
postqueue -p

echo ""
echo "=========================================="
echo "✅ Диагностика завершена"
echo "=========================================="


