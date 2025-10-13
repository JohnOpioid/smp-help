// Скрипт для создания тестового пользователя
// Запустить в консоли браузера на странице /api/debug/users

async function createTestUser() {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'evgeniy.odin@gmail.com',
        password: '123456',
        firstName: 'Евгений',
        lastName: 'Один'
      })
    })
    
    const result = await response.json()
    console.log('Registration result:', result)
    
    if (result.success) {
      console.log('✅ Пользователь успешно создан!')
    } else {
      console.log('❌ Ошибка создания пользователя:', result.message)
    }
  } catch (error) {
    console.error('❌ Ошибка:', error)
  }
}

// Запустить функцию
createTestUser()
