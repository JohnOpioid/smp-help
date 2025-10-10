# Настройка NuxtHub AI

Система поддерживает два режима работы ИИ:

## 🤖 Mock AI (по умолчанию)
- Работает локально без дополнительных настроек
- Использует встроенные алгоритмы анализа медицинских данных
- Поддерживает все основные функции: поиск МКБ, препаратов, подстанций
- Идеально подходит для разработки и тестирования

## 🚀 NuxtHub AI (опционально)
Для использования настоящего AI на базе Cloudflare Workers AI:

### 1. Создание аккаунта NuxtHub
1. Перейдите на https://hub.nuxt.com/
2. Создайте аккаунт или войдите через GitHub
3. Создайте новый проект

### 2. Настройка Cloudflare Workers AI
1. Создайте аккаунт на https://cloudflare.com/
2. Перейдите в раздел "Workers & Pages"
3. Включите Workers AI
4. Получите API токен и Account ID

### 3. Связывание с NuxtHub
1. В панели NuxtHub свяжите проект с Cloudflare
2. Настройте переменные окружения
3. Получите Project Secret Key

### 4. Настройка переменных окружения
Создайте файл `.env` на основе `env.example`:

```bash
# Скопируйте env.example в .env
cp env.example .env
```

Добавьте в `.env`:
```env
# NuxtHub / Cloudflare Workers AI
NUXT_HUB_PROJECT_SECRET_KEY=your-hub-secret-key
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

### 5. Деплой на NuxtHub
```bash
# Установка CLI
npm install -g @nuxthub/cli

# Логин
nuxthub login

# Деплой
nuxthub deploy
```

## 🔄 Переключение между режимами

Система автоматически определяет доступность hubAI:
- ✅ **hubAI доступен** → используется Cloudflare Workers AI
- ⚠️ **hubAI недоступен** → используется Mock AI

В консоли вы увидите:
```
✅ Используется настоящий AI (hubAI)
```
или
```
⚠️ hubAI недоступен, используем mock AI: hubAI is not defined
💡 Для настройки hubAI см. инструкции в env.example
```

## 🎯 Преимущества каждого режима

### Mock AI
- ✅ Работает без настройки
- ✅ Быстрый отклик
- ✅ Специализирован для медицинских данных
- ✅ Не требует интернет-соединения
- ❌ Ограниченные возможности NLP

### NuxtHub AI
- ✅ Продвинутые возможности NLP
- ✅ Лучшее понимание естественного языка
- ✅ Более гибкие ответы
- ❌ Требует настройку и ключи
- ❌ Зависит от интернет-соединения
- ❌ Может быть медленнее

## 🛠️ Отладка

### Проверка доступности hubAI
```javascript
// В браузере (DevTools Console)
console.log(typeof hubAI !== 'undefined' ? 'hubAI доступен' : 'hubAI недоступен')
```

### Логи сервера
Следите за логами в терминале при запуске `npm run dev`:
```
⚠️ hubAI недоступен, используем mock AI: hubAI is not defined
💡 Для настройки hubAI см. инструкции в env.example
```

### Проверка переменных окружения
```bash
# Проверьте, что переменные загружены
echo $NUXT_HUB_PROJECT_SECRET_KEY
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

## 📚 Дополнительные ресурсы

- [Документация NuxtHub](https://hub.nuxt.com/docs)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Nuxt Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)

## ❓ Часто задаваемые вопросы

**Q: Нужно ли настраивать hubAI для работы системы?**
A: Нет, система полностью функциональна с Mock AI.

**Q: Какой режим лучше для продакшена?**
A: Для продакшена рекомендуется hubAI для лучшего качества ответов.

**Q: Можно ли переключаться между режимами?**
A: Да, система автоматически переключается в зависимости от доступности hubAI.

**Q: Стоит ли hubAI денег?**
A: Cloudflare Workers AI имеет бесплатный тариф с лимитами, затем платный.
