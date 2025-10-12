# Импорт данных MongoDB на production сервер

## Подготовка

### 1. На локальном компьютере

Убедитесь, что все JSON файлы находятся в папке `mongodb/`:

```
mongodb/
├── smp-help.algorithmcategories.json
├── smp-help.algorithms.json
├── smp-help.algorithmsections.json
├── smp-help.categories.json
├── smp-help.drugcategories.json
├── smp-help.drugs.json
├── smp-help.drugs2.json
├── smp-help.feedbacks.json
├── smp-help.instructions.json
├── smp-help.localstatuscategories.json
├── smp-help.localstatuses.json
├── smp-help.mkbcategories.json
├── smp-help.mkbs.json
├── smp-help.regionphones.json
├── smp-help.regions.json
├── smp-help.shiftalternations.json
├── smp-help.shifts.json
├── smp-help.shifttemplates.json
├── smp-help.substations.json
└── smp-help.users.json
```

## Автоматический импорт (рекомендуется)

### Шаг 1: Скопируйте файлы и скрипт на сервер

```bash
# На локальном компьютере (PowerShell или CMD)
# Создайте архив
tar -czf mongodb-data.tar.gz mongodb/

# Скопируйте на сервер
scp mongodb-data.tar.gz root@185.185.68.107:/root/
scp deploy/import-mongodb-data.sh root@185.185.68.107:/root/
```

### Шаг 2: Распакуйте и запустите импорт на сервере

```bash
# Подключитесь к серверу
ssh root@185.185.68.107

# Распакуйте данные
cd /root
tar -xzf mongodb-data.tar.gz

# Переименуйте директорию
mv mongodb mongodb-data

# Запустите скрипт импорта
chmod +x import-mongodb-data.sh
./import-mongodb-data.sh
```

Скрипт:
- ✅ Проверит подключение к MongoDB
- ✅ Найдёт все JSON файлы
- ✅ Импортирует каждую коллекцию с заменой существующих данных
- ✅ Покажет статистику по каждой коллекции
- ✅ Выведет итоговый отчёт

### Шаг 3: Перезапустите приложение

```bash
pm2 restart smp-help
pm2 logs smp-help --lines 20
```

## Ручной импорт

Если хотите контролировать процесс вручную:

```bash
# Подключитесь к серверу
ssh root@185.185.68.107

# Перейдите в директорию с данными
cd /root/mongodb-data

# Параметры подключения
MONGO_URI="mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin"

# Импорт каждой коллекции
mongoimport --uri="$MONGO_URI" \
  --collection=users \
  --file=smp-help.users.json \
  --drop \
  --jsonArray

mongoimport --uri="$MONGO_URI" \
  --collection=drugcategories \
  --file=smp-help.drugcategories.json \
  --drop \
  --jsonArray

mongoimport --uri="$MONGO_URI" \
  --collection=drugs \
  --file=smp-help.drugs.json \
  --drop \
  --jsonArray

# И так далее для каждой коллекции...
```

### Параметры mongoimport:

- `--uri` - строка подключения к MongoDB
- `--collection` - название коллекции
- `--file` - путь к JSON файлу
- `--drop` - удалить существующую коллекцию перед импортом
- `--jsonArray` - файл содержит массив JSON объектов

## Быстрый импорт всех файлов

```bash
cd /root/mongodb-data

MONGO_URI="mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin"

# Импорт всех JSON файлов автоматически
for file in smp-help.*.json; do
    # Извлекаем название коллекции из имени файла
    collection=$(echo "$file" | sed 's/smp-help\.\(.*\)\.json/\1/')
    
    echo "Импортируем $collection из $file..."
    
    mongoimport --uri="$MONGO_URI" \
        --collection="$collection" \
        --file="$file" \
        --drop \
        --jsonArray
    
    if [ $? -eq 0 ]; then
        echo "✅ $collection импортирован"
    else
        echo "❌ Ошибка импорта $collection"
    fi
    
    echo
done

echo "✅ Импорт завершён!"
```

## Проверка импорта

После импорта проверьте данные:

```bash
# Подключитесь к MongoDB
mongosh "mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin"

# В MongoDB shell:
show collections

# Проверьте количество документов
db.users.countDocuments()
db.drugs.countDocuments()
db.algorithms.countDocuments()
db.mkbs.countDocuments()

# Проверьте пример данных
db.users.findOne()
db.drugs.findOne()

exit
```

## Альтернативный метод: mongorestore

Если хотите использовать mongorestore (для бэкапов):

### На локальном компьютере:

```bash
# Создайте dump из JSON файлов
mkdir -p mongodb-dump/smp-help

# Скопируйте JSON файлы
cp mongodb/*.json mongodb-dump/smp-help/

# Создайте архив
tar -czf mongodb-dump.tar.gz mongodb-dump/

# Скопируйте на сервер
scp mongodb-dump.tar.gz root@185.185.68.107:/root/
```

### На сервере:

```bash
# Распакуйте
cd /root
tar -xzf mongodb-dump.tar.gz

# Восстановите данные
mongorestore --uri="mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/?authSource=admin" \
  --db=smp-help \
  --drop \
  mongodb-dump/smp-help/
```

## Резервное копирование перед импортом

⚠️ **ВАЖНО:** Перед импортом сделайте backup существующих данных!

```bash
# Создайте backup
mongodump --uri="mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin" \
  --out=/root/backups/mongodb-backup-$(date +%Y%m%d_%H%M%S)

# Проверьте backup
ls -lh /root/backups/
```

### Восстановление из backup

Если что-то пошло не так:

```bash
# Восстановите из backup
mongorestore --uri="mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/?authSource=admin" \
  --db=smp-help \
  --drop \
  /root/backups/mongodb-backup-YYYYMMDD_HHMMSS/smp-help/
```

## Проверка после импорта

```bash
# 1. Проверьте количество коллекций
mongosh "mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin" \
  --eval "db.getCollectionNames().length"

# 2. Проверьте общее количество документов
mongosh "mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin" \
  --eval "
var total = 0;
db.getCollectionNames().forEach(function(name) {
    var count = db[name].countDocuments();
    print(name + ': ' + count);
    total += count;
});
print('');
print('Всего документов: ' + total);
"

# 3. Перезапустите приложение
pm2 restart smp-help

# 4. Проверьте логи
pm2 logs smp-help --lines 30

# 5. Проверьте сайт
curl http://helpsmp.ru
```

## Ошибки и решения

### Ошибка: Authentication failed

```bash
# Проверьте строку подключения
mongosh "mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@localhost:27017/smp-help?authSource=admin" --eval "db.version()"

# Если не работает, проверьте пользователя
mongosh
use admin
db.getUsers()
```

### Ошибка: File not found

```bash
# Проверьте, что файлы на месте
ls -lh /root/mongodb-data/

# Проверьте формат файлов (должен быть JSON array)
head -5 /root/mongodb-data/smp-help.users.json
```

### Ошибка: Invalid JSON

```bash
# Проверьте формат файла
cat /root/mongodb-data/smp-help.users.json | jq . | head

# Если ошибка формата, возможно нужен параметр --mode=insert
mongoimport --uri="$MONGO_URI" \
  --collection=users \
  --file=smp-help.users.json \
  --mode=insert \
  --jsonArray
```

## Размеры коллекций

Примерные размеры после импорта:

- `algorithms` - ~1.5MB (самая большая)
- `mkbs` - ~973KB
- `localstatuses` - ~254KB
- `drugs` - ~149KB
- `drugs2` - ~69KB
- `instructions` - ~44KB
- `substations` - ~32KB
- Остальные - меньше 10KB

**Общий размер:** ~2.5MB данных

## Автоматический импорт при деплое

Чтобы данные импортировались автоматически при каждой установке, добавьте в скрипт деплоя:

```bash
# После установки MongoDB
if [ -d "/root/mongodb-data" ]; then
    log "Импортируем данные MongoDB..."
    /root/import-mongodb-data.sh
fi
```

## Мониторинг импорта

Для больших файлов можно отслеживать прогресс:

```bash
# Запустите импорт в отдельном терминале
./import-mongodb-data.sh

# В другом терминале наблюдайте за процессом
watch -n 1 'mongosh "mongodb://help-smp-user:PASSWORD@localhost:27017/smp-help?authSource=admin" --quiet --eval "db.stats()"'
```

## Полезные команды

```bash
# Список всех коллекций
mongosh "$MONGO_URI" --eval "show collections"

# Удалить все данные из базы (осторожно!)
mongosh "$MONGO_URI" --eval "db.dropDatabase()"

# Экспорт коллекции
mongoexport --uri="$MONGO_URI" \
  --collection=users \
  --out=users-export.json \
  --jsonArray

# Статистика базы
mongosh "$MONGO_URI" --eval "db.stats()"
```

