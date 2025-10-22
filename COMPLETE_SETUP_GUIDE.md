# Полная инструкция: Capacitor + MongoDB для мобильного приложения SMP-Help

## 🎯 Выбор варианта настройки

У вас есть **два варианта** настройки:

### Вариант A: MongoDB Atlas (облачный) - если доступен
- ✅ Автоматическая синхронизация между устройствами
- ✅ Готовые правила безопасности
- ✅ Масштабируемость
- ❌ Требует интернет-соединение
- ❌ Может быть заблокирован в вашей стране

### Вариант B: Локальная MongoDB - если Atlas недоступен
- ✅ Полный контроль над данными
- ✅ Работает без интернета
- ✅ Быстрая работа
- ❌ Нет синхронизации между устройствами
- ❌ Нужно настраивать резервное копирование

---

## 🚀 Быстрый старт (выберите один вариант)

### Вариант A: MongoDB Atlas

#### 1. Настройка Atlas (если доступен)

1. **Откройте** [https://cloud.mongodb.com/](https://cloud.mongodb.com/)
2. **Создайте аккаунт** и бесплатный кластер M0
3. **Перейдите в App Services** → **Create New App**
4. **Настройте аутентификацию**:
   - Включите **Anonymous**
   - Включите **Custom JWT** (опционально)
5. **Настройте Rules** для ваших коллекций:

**Справочные данные (только чтение):**
```javascript
{
  "rules": [
    {
      "name": "read_reference_data",
      "applyWhen": {},
      "read": true,
      "write": false
    }
  ]
}
```

**Отзывы (чтение и запись):**
```javascript
{
  "rules": [
    {
      "name": "feedback_rules",
      "applyWhen": {},
      "read": true,
      "write": true
    }
  ]
}
```

6. **Скопируйте App ID** из **App Settings** → **General**

#### 2. Настройка проекта для Atlas

**Создайте `.env`:**
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smp-help

# MongoDB Realm App ID
REALM_APP_ID=smp-help-xxxxx

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Yandex Maps API Key
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
```

**Установите зависимости:**
```bash
npm install @capacitor/app @capacitor/network @capacitor/status-bar realm-web
```

---

### Вариант B: Локальная MongoDB

#### 1. Установка MongoDB локально

**Способ 1: Docker (рекомендуется)**
```bash
# Создайте docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb-smp
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: smp-help
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
EOF

# Запустите MongoDB
docker-compose up -d
```

**Способ 2: Chocolatey (Windows)**
```bash
# Установка Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Установка MongoDB
choco install mongodb
```

**Способ 3: Прямая установка**
1. Скачайте с [mongodb.com](https://www.mongodb.com/try/download/community)
2. Установите MongoDB Community Server
3. Запустите сервис: `net start MongoDB`

#### 2. Настройка проекта для локальной работы

**Создайте `.env`:**
```env
# Локальная MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/smp-help

# Отключите Realm для локальной работы
REALM_APP_ID=

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Yandex Maps API Key
YAMAPS_API_KEY=0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c
```

**Установите зависимости:**
```bash
npm install @capacitor/app @capacitor/network @capacitor/status-bar dexie
```

---

## 🔧 Настройка проекта

### 1. Обновите `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  // ... существующая конфигурация
  
  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help',
    public: {
      realmAppId: process.env.REALM_APP_ID || ''
    }
  },
  
  plugins: [
    // Условная загрузка плагинов
    ...(process.env.REALM_APP_ID ? ['~/plugins/realm.client.ts'] : ['~/plugins/mongodb-local.client.ts']),
    '~/plugins/capacitor.client.ts'
  ]
})
```

### 2. Обновите `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ru.smp.help',
  appName: 'Помощник СМП',
  webDir: '.output/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3b82f6'
    },
    App: {
      launchUrl: process.env.REALM_APP_ID ? 'https://localhost:3000' : 'http://localhost:3000'
    }
  }
};

export default config;
```

### 3. Добавьте скрипты в `package.json`

```json
{
  "scripts": {
    "cap:sync": "cap sync",
    "cap:build": "npm run build && cap sync",
    "cap:android": "cap open android",
    "cap:run:android": "cap run android"
  }
}
```

---

## 📱 Использование API

### Для Atlas (Realm Web SDK)

```typescript
// Чтение данных
const { getCollectionSnapshot } = useRealmRead()
const drugs = await getCollectionSnapshot('drugs')

// Запись данных
const { upsertOne } = useRealmWrite()
await upsertOne('feedbacks', { message: 'Отзыв', rating: 5 })

// Поиск
const searchResults = await getCollectionSnapshot('drugs', {
  name: { $regex: 'парацетамол', $options: 'i' }
})
```

### Для локальной MongoDB

```typescript
// Чтение данных
const { getData } = useLocalData()
const drugs = await getData('drugs')

// Запись данных
const { saveData } = useLocalData()
await saveData('feedbacks', { message: 'Отзыв', rating: 5 }, 'insert')

// Поиск в кэше
const { searchInCache } = useLocalData()
const results = await searchInCache('drugs', 'парацетамол', ['name', 'description'])
```

---

## 🏗️ Сборка и запуск

### 1. Сборка проекта

```bash
# Установка зависимостей
npm install

# Сборка для мобильного приложения
npm run cap:build
```

### 2. Запуск на Android

```bash
# Открытие Android Studio
npm run cap:android

# Или запуск через CLI
npm run cap:run:android
```

### 3. Проверка конфигурации

```bash
# Проверка Capacitor
npx cap doctor

# Проверка подключения к MongoDB
mongosh "mongodb://admin:password@localhost:27017/smp-help"
```

---

## 🧪 Тестирование

### 1. Проверка офлайн-режима

1. **Откройте приложение**
2. **Загрузите данные** (лекарства, алгоритмы, МКБ)
3. **Отключите интернет**
4. **Проверьте отображение** кэшированных данных
5. **Попробуйте добавить отзыв**
6. **Включите интернет**
7. **Проверьте отправку** отложенных изменений

### 2. Проверка синхронизации

```typescript
// Тест загрузки всех коллекций
async function testAllCollections() {
  const collections = ['drugs', 'algorithms', 'mkbs', 'regions', 'substations']
  
  for (const collection of collections) {
    try {
      const data = await getCollectionSnapshot(collection) // или getData для локальной
      console.log(`${collection}: ${data.length} записей`)
    } catch (error) {
      console.error(`Ошибка загрузки ${collection}:`, error)
    }
  }
}
```

### 3. Проверка поиска

```typescript
// Тест поиска лекарств
async function testDrugSearch() {
  const searchQueries = ['парацетамол', 'ибупрофен', 'аспирин']
  
  for (const query of searchQueries) {
    const results = await getCollectionSnapshot('drugs', {
      name: { $regex: query, $options: 'i' }
    })
    console.log(`Поиск "${query}": ${results.length} результатов`)
  }
}
```

---

## 🔄 Импорт существующих данных

### 1. Импорт из JSON файлов

```typescript
// scripts/import-data.ts
export async function importDataToMongoDB() {
  const collections = [
    'drugs', 'drugs2', 'algorithms', 'algorithmcategories', 'algorithmsections',
    'mkbs', 'mkbcategories', 'regions', 'regionphones', 'substations',
    'instructions', 'localstatuses', 'localstatuscategories',
    'shifts', 'shifttemplates', 'shiftalternations', 'categories'
  ]
  
  for (const collection of collections) {
    try {
      const data = await import(`~/mongodb/smp-help.${collection}.json`)
      
      // Для Atlas
      if (process.env.REALM_APP_ID) {
        const { upsertOne } = useRealmWrite()
        for (const item of data.default) {
          await upsertOne(collection, item)
        }
      }
      
      // Для локальной MongoDB
      else {
        const { saveData } = useLocalData()
        for (const item of data.default) {
          await saveData(collection, item, 'insert')
        }
      }
      
      console.log(`${collection}: импортировано ${data.default.length} записей`)
    } catch (error) {
      console.error(`Ошибка импорта ${collection}:`, error)
    }
  }
}
```

### 2. Запуск импорта

```bash
# Создайте скрипт импорта
node -e "
import('./scripts/import-data.js').then(module => {
  module.importDataToMongoDB()
})
"
```

---

## 🐛 Решение проблем

### Проблемы с Atlas

| Проблема | Решение |
|----------|---------|
| "App ID не найден" | Проверьте `REALM_APP_ID` в `.env` |
| "Ошибка аутентификации" | Проверьте настройки JWT в App Services |
| "Данные не загружаются" | Проверьте Rules и интернет-соединение |
| "Atlas заблокирован" | Переключитесь на локальную MongoDB |

### Проблемы с локальной MongoDB

| Проблема | Решение |
|----------|---------|
| "MongoDB не запускается" | Проверьте порт 27017, перезапустите сервис |
| "Ошибка подключения" | Проверьте `MONGODB_URI` в `.env` |
| "Данные не сохраняются" | Проверьте права доступа к базе данных |
| "Кэш не работает" | Очистите IndexedDB в браузере |

### Проблемы с Capacitor

| Проблема | Решение |
|----------|---------|
| "Приложение не запускается" | Проверьте Android SDK, `adb devices` |
| "Ошибки сборки" | Очистите кэш: `npx cap clean` |
| "Плагины не работают" | Переустановите: `npm run cap:sync` |

---

## 📊 Мониторинг и отладка

### 1. Логи в браузере

```typescript
// Включите детальное логирование
console.log('MongoDB URI:', process.env.MONGODB_URI)
console.log('Realm App ID:', process.env.REALM_APP_ID)
console.log('Online status:', navigator.onLine)
```

### 2. Логи в Android Studio

1. Откройте **Logcat**
2. Фильтруйте по `Capacitor` или `smp-help`
3. Ищите ошибки инициализации

### 3. Проверка кэша

```typescript
// Статистика кэша
const { getCacheStats } = useLocalData()
const stats = await getCacheStats()
console.log('Статистика кэша:', stats)
```

### 4. Проверка сети

```typescript
// Мониторинг состояния сети
const { isOnline, pendingMutations } = useSyncStatus()
console.log('Online:', isOnline.value)
console.log('Pending mutations:', pendingMutations.value)
```

---

## 🚀 Производственная настройка

### 1. Безопасность

```env
# Используйте сильные секреты
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# Ограничьте доступ к MongoDB
MONGODB_URI=mongodb://username:strong-password@localhost:27017/smp-help
```

### 2. Оптимизация

```typescript
// Настройте индексы в MongoDB
db.drugs.createIndex({ name: 1 })
db.algorithms.createIndex({ title: 1 })
db.mkbs.createIndex({ code: 1 })

// Ограничьте размер кэша
const CACHE_LIMIT = 1000 // записей на коллекцию
```

### 3. Резервное копирование

```bash
# Экспорт данных
mongodump --uri="mongodb://admin:password@localhost:27017/smp-help" --out=./backup

# Импорт данных
mongorestore --uri="mongodb://admin:password@localhost:27017/smp-help" ./backup
```

---

## 🔄 Миграция между вариантами

### Из локальной MongoDB в Atlas

1. **Экспортируйте данные**:
```bash
mongodump --uri="mongodb://admin:password@localhost:27017/smp-help" --out=./backup
```

2. **Импортируйте в Atlas**:
```bash
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/smp-help" ./backup
```

3. **Обновите `.env`**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smp-help
REALM_APP_ID=smp-help-xxxxx
```

4. **Перезапустите приложение**

### Из Atlas в локальную MongoDB

1. **Экспортируйте из Atlas**:
```bash
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/smp-help" --out=./backup
```

2. **Импортируйте локально**:
```bash
mongorestore --uri="mongodb://admin:password@localhost:27017/smp-help" ./backup
```

3. **Обновите `.env`**:
```env
MONGODB_URI=mongodb://admin:password@localhost:27017/smp-help
REALM_APP_ID=
```

---

## 📱 Дополнительные возможности

### Push-уведомления
```bash
npm install @capacitor/push-notifications
```

### Камера
```bash
npm install @capacitor/camera
```

### Геолокация
```bash
npm install @capacitor/geolocation
```

### Файловая система
```bash
npm install @capacitor/filesystem
```

---

## ✅ Чек-лист готовности

### Обязательные шаги:
- [ ] Выбран вариант настройки (Atlas или локальная)
- [ ] Установлена MongoDB (локально или настроен Atlas)
- [ ] Создан `.env` файл с правильными настройками
- [ ] Установлены зависимости: `npm install`
- [ ] Настроен `nuxt.config.ts` и `capacitor.config.ts`
- [ ] Импортированы данные из JSON файлов
- [ ] Протестирована сборка: `npm run cap:build`
- [ ] Протестирован запуск на Android: `npm run cap:run:android`
- [ ] Проверен офлайн-режим
- [ ] Проверена синхронизация данных

### Дополнительные шаги:
- [ ] Настроены индексы в MongoDB
- [ ] Настроено резервное копирование
- [ ] Добавлены дополнительные Capacitor плагины
- [ ] Настроен мониторинг и логирование

---

## 🎯 Итог

Теперь у вас есть **полнофункциональное мобильное приложение** с:

✅ **Офлайн-режим** - работает без интернета  
✅ **Синхронизация** - данные обновляются при восстановлении связи  
✅ **Кэширование** - быстрый доступ к данным  
✅ **Поиск** - по всем коллекциям с фильтрацией  
✅ **Мобильная оптимизация** - через Capacitor  

Выберите подходящий вариант настройки и следуйте инструкции! 🚀

