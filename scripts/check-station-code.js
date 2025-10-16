const mongoose = require('mongoose');

async function checkStationCode() {
  try {
    await mongoose.connect('mongodb://localhost:27017/smp-help');
    console.log('Подключение к MongoDB...');
    
    const MKB = mongoose.model('MKB', new mongoose.Schema({}, { strict: false }));
    
    // Проверяем код станции 2151
    const result = await MKB.find({ stationCode: '2151' }).lean();
    console.log('Найдено записей с кодом станции 2151:', result.length);
    
    if (result.length > 0) {
      console.log('Первая запись:');
      console.log('- Название:', result[0].name);
      console.log('- МКБ код:', result[0].mkbCode);
      console.log('- Код станции:', result[0].stationCode);
    } else {
      console.log('Записей с кодом станции 2151 не найдено');
      
      // Проверим есть ли похожие коды
      const similar = await MKB.find({ stationCode: /215/ }).limit(5).lean();
      console.log('Похожие коды станций:');
      similar.forEach(item => {
        console.log('-', item.stationCode, ':', item.name);
      });
    }
    
    // Проверим общее количество записей
    const total = await MKB.countDocuments();
    console.log('Всего записей в коллекции MKB:', total);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkStationCode();
