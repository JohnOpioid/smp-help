# 🐧 Установка Ollama на Ubuntu Server

## 📋 Системные требования

### Минимальные требования:
- **RAM:** 8GB (рекомендуется 16GB+)
- **CPU:** 4 ядра (рекомендуется 8+ ядер)
- **Диск:** 20GB свободного места
- **OS:** Ubuntu 20.04+ (рекомендуется Ubuntu 22.04 LTS)

### Рекомендуемые требования для Llama 3.1:
- **RAM:** 16GB+ (для модели 8B), 40GB+ (для модели 70B)
- **CPU:** 8+ ядер
- **GPU:** NVIDIA GPU с CUDA поддержкой (опционально, для ускорения)

## 🚀 Установка Ollama

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка зависимостей
```bash
# Установка необходимых пакетов
sudo apt install -y curl wget git build-essential

# Установка Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версии Node.js
node --version
npm --version
```

### 3. Установка Ollama
```bash
# Скачивание и установка Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Проверка установки
ollama --version
```

### 4. Настройка Ollama как системного сервиса

#### Создание пользователя для Ollama
```bash
# Создаем пользователя ollama
sudo useradd -r -s /bin/false -m -d /usr/share/ollama ollama

# Создаем директории
sudo mkdir -p /usr/share/ollama/.ollama
sudo chown -R ollama:ollama /usr/share/ollama
```

#### Создание systemd сервиса
```bash
# Создаем файл сервиса
sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/usr/share/ollama/.ollama/models"

[Install]
WantedBy=default.target
EOF

# Перезагружаем systemd
sudo systemctl daemon-reload

# Включаем и запускаем сервис
sudo systemctl enable ollama
sudo systemctl start ollama

# Проверяем статус
sudo systemctl status ollama
```

## 📦 Загрузка языковой модели

### 1. Загрузка модели Llama 3.1 8B (рекомендуется)
```bash
# Загружаем модель Llama 3.1 8B
ollama pull llama3.1:8b

# Проверяем загруженные модели
ollama list
```

### 2. Загрузка модели Llama 3.1 70B (для мощных серверов)
```bash
# Загружаем модель Llama 3.1 70B (требует 40GB+ RAM)
ollama pull llama3.1:70b
```

### 3. Альтернативные модели
```bash
# Более легкая модель для слабых серверов
ollama pull llama3.1:3b

# Русскоязычная модель
ollama pull saiga:llama3.1_8b_instruct
```

## ⚙️ Настройка переменных окружения

### 1. Обновление файла .env
```bash
# Добавляем настройки Ollama в .env файл
echo "" >> .env
echo "# Ollama AI настройки" >> .env
echo "OLLAMA_HOST=http://localhost:11434" >> .env
echo "OLLAMA_MODEL=llama3.1:8b" >> .env
```

### 2. Настройка для продакшена
```bash
# Для внешнего доступа к Ollama (если нужно)
echo "OLLAMA_HOST=http://0.0.0.0:11434" >> .env
```

## 🔧 Настройка для продакшена

### 1. Настройка файрвола
```bash
# Открываем порт 11434 для Ollama
sudo ufw allow 11434

# Проверяем статус файрвола
sudo ufw status
```

### 2. Настройка Nginx (опционально)
```bash
# Создаем конфигурацию для проксирования Ollama
sudo tee /etc/nginx/sites-available/ollama > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location /ollama/ {
        proxy_pass http://localhost:11434/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Увеличиваем таймауты для больших запросов
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Включаем конфигурацию
sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Настройка логирования
```bash
# Создаем директорию для логов
sudo mkdir -p /var/log/ollama
sudo chown ollama:ollama /var/log/ollama

# Обновляем systemd сервис для логирования
sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/usr/share/ollama/.ollama/models"
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ollama

[Install]
WantedBy=default.target
EOF

# Перезагружаем сервис
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

## 🧪 Тестирование установки

### 1. Проверка работы Ollama
```bash
# Проверяем статус сервиса
sudo systemctl status ollama

# Проверяем доступность API
curl http://localhost:11434/api/tags

# Тестируем модель
ollama run llama3.1:8b "Привет! Как дела?"
```

### 2. Тестирование через API
```bash
# Тест через curl
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Привет! Как дела?",
    "stream": false
  }'
```

### 3. Тестирование производительности
```bash
# Создаем тестовый скрипт
cat > test_ollama_performance.js <<EOF
const fetch = require('node-fetch');

async function testOllama() {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: 'Объясни кратко что такое искусственный интеллект',
        stream: false
      })
    });
    
    const result = await response.json();
    const endTime = Date.now();
    
    console.log('Время ответа:', endTime - startTime, 'мс');
    console.log('Ответ:', result.response);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

testOllama();
EOF

# Запускаем тест
node test_ollama_performance.js
```

## 📊 Мониторинг и оптимизация

### 1. Мониторинг ресурсов
```bash
# Установка htop для мониторинга
sudo apt install -y htop

# Мониторинг использования памяти
htop

# Проверка использования диска
df -h

# Проверка процессов Ollama
ps aux | grep ollama
```

### 2. Оптимизация производительности
```bash
# Настройка swap (если нужно)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Добавляем в fstab для автозагрузки
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Настройка GPU (если доступен)
```bash
# Установка NVIDIA драйверов (если есть GPU)
sudo apt install -y nvidia-driver-525
sudo reboot

# Проверка CUDA после перезагрузки
nvidia-smi

# Ollama автоматически использует GPU если доступен
ollama run llama3.1:8b "Тест GPU ускорения"
```

## 🔧 Устранение неполадок

### 1. Проблемы с запуском
```bash
# Проверяем логи сервиса
sudo journalctl -u ollama -f

# Перезапускаем сервис
sudo systemctl restart ollama

# Проверяем порт
sudo netstat -tlnp | grep 11434
```

### 2. Проблемы с памятью
```bash
# Проверяем использование памяти
free -h

# Если не хватает памяти, используем меньшую модель
ollama pull llama3.1:3b
```

### 3. Проблемы с производительностью
```bash
# Проверяем загрузку CPU
top

# Ограничиваем количество потоков
export OLLAMA_NUM_PARALLEL=2
export OLLAMA_MAX_LOADED_MODELS=1
```

### 4. Проблемы с сетью
```bash
# Проверяем доступность порта
telnet localhost 11434

# Проверяем файрвол
sudo ufw status
```

## 📈 Масштабирование

### 1. Настройка кластера (для больших нагрузок)
```bash
# Установка Docker для контейнеризации
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker

# Создание Docker Compose файла
cat > docker-compose.yml <<EOF
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
    restart: unless-stopped

volumes:
  ollama_data:
EOF

# Запуск через Docker
docker-compose up -d
```

### 2. Настройка балансировки нагрузки
```bash
# Установка HAProxy для балансировки
sudo apt install -y haproxy

# Конфигурация HAProxy
sudo tee /etc/haproxy/haproxy.cfg > /dev/null <<EOF
global
    daemon

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend ollama_frontend
    bind *:80
    default_backend ollama_backend

backend ollama_backend
    balance roundrobin
    server ollama1 127.0.0.1:11434 check
    # Добавьте больше серверов при необходимости
EOF

sudo systemctl enable haproxy
sudo systemctl start haproxy
```

## 🔒 Безопасность

### 1. Настройка аутентификации (опционально)
```bash
# Создание простого прокси с аутентификацией
sudo apt install -y nginx

# Создание файла паролей
sudo htpasswd -c /etc/nginx/.htpasswd ollama_user

# Конфигурация Nginx с аутентификацией
sudo tee /etc/nginx/sites-available/ollama-secure > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location /ollama/ {
        auth_basic "Ollama Access";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://localhost:11434/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
```

### 2. Настройка SSL (рекомендуется)
```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление сертификатов
sudo crontab -e
# Добавляем строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📝 Полезные команды

### Управление сервисом
```bash
# Запуск/остановка/перезапуск
sudo systemctl start ollama
sudo systemctl stop ollama
sudo systemctl restart ollama

# Проверка статуса
sudo systemctl status ollama

# Просмотр логов
sudo journalctl -u ollama -f
```

### Управление моделями
```bash
# Список моделей
ollama list

# Удаление модели
ollama rm llama3.1:8b

# Обновление модели
ollama pull llama3.1:8b

# Информация о модели
ollama show llama3.1:8b
```

### Мониторинг
```bash
# Использование ресурсов
htop
free -h
df -h

# Сетевые соединения
sudo netstat -tlnp | grep 11434

# Логи приложения
tail -f /var/log/ollama/ollama.log
```

## ✅ Проверочный список

- [ ] Ollama установлен и работает
- [ ] Модель Llama 3.1:8b загружена
- [ ] Systemd сервис настроен и запущен
- [ ] Переменные окружения настроены
- [ ] Файрвол настроен
- [ ] Тестирование прошло успешно
- [ ] Мониторинг настроен
- [ ] Резервное копирование настроено

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `sudo journalctl -u ollama -f`
2. Проверьте статус сервиса: `sudo systemctl status ollama`
3. Проверьте использование ресурсов: `htop`
4. Проверьте сеть: `curl http://localhost:11434/api/tags`

---

**Готово!** 🎉 Теперь Ollama установлен и настроен на вашем Ubuntu сервере с моделью Llama 3.1 для интеллектуального анализа медицинских данных.
