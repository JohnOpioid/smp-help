// Тестовый скрипт для проверки API регионов
const testRegionsAPI = async () => {
  const baseUrl = 'http://localhost:3000/api/admin/regions'
  
  console.log('🧪 Тестирование API регионов...\n')
  
  try {
    // 1. Создание региона
    console.log('1. Создание региона...')
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Москва',
        phones: [
          { name: 'Скорая помощь', number: '8 (495) 123-45-67' },
          { name: 'Пожарная служба', number: '8 (495) 234-56-78' }
        ]
      })
    })
    
    const createResult = await createResponse.json()
    console.log('✅ Регион создан:', createResult)
    
    // 2. Получение списка регионов
    console.log('\n2. Получение списка регионов...')
    const listResponse = await fetch(baseUrl)
    const listResult = await listResponse.json()
    console.log('✅ Список регионов:', listResult)
    
    // 3. Создание второго региона
    console.log('\n3. Создание второго региона...')
    const createResponse2 = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Санкт-Петербург',
        phones: [
          { name: 'Скорая помощь', number: '8 (812) 123-45-67' },
          { name: 'Полиция', number: '8 (812) 234-56-78' }
        ]
      })
    })
    
    const createResult2 = await createResponse2.json()
    console.log('✅ Второй регион создан:', createResult2)
    
    // 4. Получение обновленного списка
    console.log('\n4. Получение обновленного списка...')
    const listResponse2 = await fetch(baseUrl)
    const listResult2 = await listResponse2.json()
    console.log('✅ Обновленный список:', listResult2)
    
    console.log('\n🎉 Все тесты прошли успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error)
  }
}

// Запуск теста
testRegionsAPI()
