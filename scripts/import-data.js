"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importDataToMongoDB = importDataToMongoDB;
// scripts/import-data.ts
const mongodb_1 = require("mongodb");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help';
async function importDataToMongoDB() {
    const client = new mongodb_1.MongoClient(MONGODB_URI);
    try {
        await client.connect();
        console.log('✅ Подключение к MongoDB установлено');
        const db = client.db('smp-help');
        const collections = [
            'drugs', 'drugs2', 'algorithms', 'algorithmcategories', 'algorithmsections',
            'mkbs', 'mkbcategories', 'regions', 'regionphones', 'substations',
            'instructions', 'localstatuses', 'localstatuscategories',
            'shifts', 'shifttemplates', 'shiftalternations', 'categories'
        ];
        for (const collectionName of collections) {
            try {
                const filePath = path_1.default.join(process.cwd(), 'mongodb', `smp-help.${collectionName}.json`);
                if (!fs_1.default.existsSync(filePath)) {
                    console.log(`⚠️  Файл ${filePath} не найден, пропускаем`);
                    continue;
                }
                const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
                const data = JSON.parse(fileContent);
                if (!Array.isArray(data)) {
                    console.log(`⚠️  Данные в ${collectionName} не являются массивом, пропускаем`);
                    continue;
                }
                const collection = db.collection(collectionName);
                // Очищаем коллекцию перед импортом
                await collection.deleteMany({});
                // Вставляем данные
                if (data.length > 0) {
                    await collection.insertMany(data);
                    console.log(`✅ ${collectionName}: импортировано ${data.length} записей`);
                }
                else {
                    console.log(`⚠️  ${collectionName}: файл пустой`);
                }
            }
            catch (error) {
                console.error(`❌ Ошибка импорта ${collectionName}:`, error);
            }
        }
        console.log('🎉 Импорт данных завершён!');
    }
    catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
    }
    finally {
        await client.close();
    }
}
// Запуск импорта
if (require.main === module) {
    importDataToMongoDB();
}
