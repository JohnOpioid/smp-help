# ИСПРАВЛЕНИЕ АВТОРИЗАЦИИ - ГОТОВО К ДЕПЛОЮ

## ✅ Что исправлено локально:

1. **Удалена проверка на старый JWT_SECRET** в `server/api/auth/login.post.ts`
   - Убрана строка: `jwtSecret === 'your-secret-key'`
   - Теперь проверяется только: `if (!jwtSecret)`

2. **PWA полностью отключен:**
   - Удален модуль `@vite-pwa/nuxt`
   - Удалена конфигурация PWA
   - Удалены PWA файлы и мета-теги

## 🚀 ДЕПЛОЙ НА ПРОДАКШЕН:

### **Вариант 1: Git деплой (рекомендуется)**
```bash
# На сервере
cd /var/www/html/helpsmp.ru
git pull origin main
npm install
npm run build
pm2 restart smp-help
```

### **Вариант 2: Ручной деплой**
```bash
# Скопируйте обновленные файлы на сервер:
# - server/api/auth/login.post.ts
# - nuxt.config.ts
# - package.json
# - package-lock.json

# Затем на сервере:
cd /var/www/html/helpsmp.ru
npm install
npm run build
pm2 restart smp-help
```

### **Вариант 3: Быстрое исправление только login.post.ts**
```bash
# На сервере, замените содержимое файла:
cd /var/www/html/helpsmp.ru
cat > server/api/auth/login.post.ts << 'EOF'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import { setCookie, createError, getMethod, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    await connectDB()
    
    const body = await readBody(event)
    const { email, password } = body

    // Валидация
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email и пароль обязательны'
      })
    }

    // Дополнительная очистка email
    const cleanEmail = email.trim().toLowerCase()

    // Поиск пользователя
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Неверный email или пароль'
      })
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Неверный email или пароль'
      })
    }

    // Создание JWT токена
    const { jwtSecret } = useRuntimeConfig()
    
    // Проверяем наличие JWT_SECRET
    if (!jwtSecret) {
      throw createError({
        statusCode: 500,
        message: 'Ошибка конфигурации сервера'
      })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Установим cookie с токеном для SSR и middleware
    setCookie(event, 'token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    })

    return {
      success: true,
      message: 'Успешная авторизация',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  } catch (error: any) {
    // Логируем ошибку для отладки
    console.error('Login error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при авторизации'
    })
  }
})
EOF

# Перезапустите приложение
pm2 restart smp-help
```

## 📋 После деплоя:

1. **Очистите кеш браузера** (Ctrl+Shift+Delete)
2. **Перезагрузите страницу** (Ctrl+F5)
3. **Попробуйте войти** снова

## 🔍 Проверка:

```bash
# Проверьте логи
pm2 logs smp-help --lines 5

# Проверьте статус
pm2 status

# Проверьте API
curl -X POST https://helpsmp.ru/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test"}'
```

## ✅ Ожидаемый результат:

- **401 ошибка** для неверных учетных данных (нормально)
- **Нет 500 ошибок** "Ошибка конфигурации сервера"
- **Авторизация работает** с правильными учетными данными

Теперь авторизация должна работать корректно!
