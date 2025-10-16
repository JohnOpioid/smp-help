# Исправления для сервера

## 🚨 Критические проблемы:

### 1. Установить недостающий пакет chromadb:
```bash
cd /var/www/html/helpsmp.ru
npm install chromadb
pm2 restart smp-help
```

### 2. Удалить отладочные логи из API файлов:

#### Удалить логи из server/api/local-statuses/index.post.ts:
```bash
sed -i 's/console\.log.*\[local-statuses\].*//g' server/api/local-statuses/index.post.ts
```

#### Удалить логи из server/api/codifier/[url].get.ts:
```bash
sed -i 's/console\.log.*🔍 API.*//g' server/api/codifier/[url].get.ts
sed -i 's/console\.log.*📊 API.*//g' server/api/codifier/[url].get.ts
```

#### Удалить логи из server/api/mkb/range/[range].get.ts:
```bash
sed -i 's/console\.log.*🔍.*//g' server/api/mkb/range/[range].get.ts
sed -i 's/console\.log.*✅.*//g' server/api/mkb/range/[range].get.ts
```

#### Удалить логи из server/api/feedback/save.post.ts:
```bash
sed -i 's/console\.log.*📝.*//g' server/api/feedback/save.post.ts
```

### 3. Перезапустить сервер:
```bash
pm2 restart smp-help
pm2 logs smp-help --lines 20
```

## 📋 Проверка после исправлений:

1. Проверить, что ошибка с chromadb исчезла
2. Проверить, что логи не дублируются каждые 2 секунды
3. Проверить работу сайта

## 🔧 Альтернативный способ (если sed не работает):

Можно вручную отредактировать файлы и удалить строки с `console.log`.
