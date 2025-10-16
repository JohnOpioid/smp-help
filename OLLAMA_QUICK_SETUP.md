# 🚀 Быстрая установка Ollama на Ubuntu

## ⚡ Экспресс-установка (5 минут)

```bash
# 1. Обновляем систему
sudo apt update && sudo apt upgrade -y

# 2. Устанавливаем Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 3. Загружаем модель Llama 3.1 8B
ollama pull llama3.1:8b

# 4. Запускаем Ollama в фоне
ollama serve &

# 5. Тестируем
ollama run llama3.1:8b "Привет! Как дела?"
```

## 🔧 Настройка как системного сервиса

```bash
# Создаем systemd сервис
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
Environment="OLLAMA_HOST=0.0.0.0:11434"

[Install]
WantedBy=default.target
EOF

# Создаем пользователя
sudo useradd -r -s /bin/false -m -d /usr/share/ollama ollama

# Включаем и запускаем сервис
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
```

## 📝 Настройка переменных окружения

```bash
# Добавляем в .env файл
echo "OLLAMA_HOST=http://localhost:11434" >> .env
echo "OLLAMA_MODEL=llama3.1:8b" >> .env
```

## ✅ Проверка установки

```bash
# Проверяем статус
sudo systemctl status ollama

# Проверяем API
curl http://localhost:11434/api/tags

# Тестируем модель
ollama run llama3.1:8b "Объясни что такое ИИ"
```

## 🔍 Мониторинг

```bash
# Логи сервиса
sudo journalctl -u ollama -f

# Использование ресурсов
htop

# Список моделей
ollama list
```

## 🆘 Устранение неполадок

```bash
# Перезапуск сервиса
sudo systemctl restart ollama

# Проверка порта
sudo netstat -tlnp | grep 11434

# Проверка памяти
free -h
```

---

**Готово!** 🎉 Ollama установлен и готов к работе с вашим медицинским приложением.

Для подробной инструкции см. `OLLAMA_UBUNTU_SETUP.md`
