import TelegramBot from 'node-telegram-bot-api'
import { ofetch } from 'ofetch'
import { generateTelegramAuthCode, checkTelegramAuth as checkTelegramAuthDirect } from '~/server/utils/telegram-auth-helpers'
import { storeAuthCodeWithChat, storeAuthCodeForSync } from '~/server/utils/telegram-auth-codes'

// Подавляем предупреждение о небезопасном TLS для локального development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  const originalEmitWarning = process.emitWarning
  process.emitWarning = function(warning: any, ...args: any[]) {
    if (warning && warning.toString().includes('NODE_TLS_REJECT_UNAUTHORIZED')) {
      return
    }
    return originalEmitWarning.call(process, warning, ...args)
  }
}

// Токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// Проверяем, был ли бот уже создан (для предотвращения повторного создания при hot-reload)
if (!(globalThis as any).telegramBot) {
  console.log('🤖 Инициализация Telegram бота:')
  console.log('  BOT_TOKEN:', BOT_TOKEN ? `${BOT_TOKEN.substring(0, 10)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 5)}` : 'НЕ УСТАНОВЛЕН')
  console.log('  BOT_USERNAME:', process.env.TELEGRAM_BOT_USERNAME || 'НЕ УСТАНОВЛЕН')

  // Для локальной разработки (без HTTPS) всегда используем polling
  // Webhook требует HTTPS сертификат

  // Проверяем наличие токена
  if (!BOT_TOKEN) {
    console.error('❌ ERROR: Telegram Bot Token не установлен!')
    console.error('   Установите переменную окружения TELEGRAM_BOT_TOKEN')
  }

  // Создаем бота БЕЗ polling по умолчанию
  // Polling будет запущен только если не установлен webhook
  (globalThis as any).telegramBot = BOT_TOKEN ? new TelegramBot(BOT_TOKEN, { 
    polling: false // Отключаем polling по умолчанию
  }) : null

  if ((globalThis as any).telegramBot) {
    console.log('✅ Telegram бот инициализирован')
  }
} else {
  console.log('⏭️ Telegram бот уже был инициализирован ранее, используем существующий экземпляр')
}

// Экспортируем бота
export const bot = (globalThis as any).telegramBot

// Telegram бот инициализирован только если токен установлен

// Обработка ошибок соединения (только если бот инициализирован)
if (bot) {
  bot.on('polling_error', (error: Error) => {
    console.error('❌ Ошибка polling:', error.message)
  })

  bot.on('error', (error: Error) => {
    console.error('❌ Ошибка бота:', error.message)
  })
}

// Обработчики команд (только если бот инициализирован)
if (bot) {
  bot.onText(/\/start(?: (.+))?/, async (msg: any, match: RegExpMatchArray | null) => {
  const chatId = msg.chat.id
  const firstName = msg.from?.first_name || 'Пользователь'
  const command = match?.[1]
  
  // Если команда начинается с connect_, это подключение к существующему аккаунту
  if (command?.startsWith('connect_')) {
    const userId = command.replace('connect_', '')
    
    // Проверяем, что userId не пустой
    if (!userId || userId === 'user' || userId === 'unknown') {
      console.error('❌ Ошибка: неверный ID пользователя:', userId)
      await bot.sendMessage(chatId, `❌ Ошибка: неверный ID пользователя

ID: ${userId}

Перейдите на страницу настроек и попробуйте подключить Telegram снова.`)
      return
    }
    
    try {
      // Проверяем наличие ID
      if (!msg.from?.id) {
        await bot.sendMessage(chatId, '❌ Ошибка: не удалось получить ID пользователя')
        return
      }
      
      // Генерируем 6-значный код для подключения
      const telegramUserId = String(msg.from.id)
      const firstName = msg.from?.first_name || 'User'
      const username = msg.from?.username
      const { generateTelegramAuthCode } = await import('~/server/utils/telegram-auth-helpers')
      
      // @ts-ignore - username может быть undefined, что соответствует сигнатуре функции
      const connectCode = await generateTelegramAuthCode(telegramUserId, firstName, username)
      
      // Проверяем успешность генерации кода
      if (!connectCode.success || !connectCode.code) {
        await bot.sendMessage(chatId, '❌ Ошибка при генерации кода')
        return
      }
      
      // Сохраняем код для проверки через API
      const { addConnectCode } = await import('~/server/api/auth/verify-telegram-connect-code.post')
      addConnectCode(connectCode.code, telegramUserId)
      
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
      
      // Экранируем все специальные символы для MarkdownV2
      const escapeMarkdown = (text: string) => {
        return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1')
      }
      
      const codeValue = connectCode.code
      const connectMessage = `🔐 Код для подключения Telegram

Ваш код для подключения к аккаунту:
🔢 ||\`${codeValue}\`||

⏱ Код действителен 10 минут

✅ Страница ввода кода откроется автоматически

💡 Нажмите на код для раскрытия и копирования`
      
      await bot.sendMessage(chatId, connectMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: []
        }
      })
      
    } catch (error: any) {
      console.error('❌ Ошибка генерирования кода:', error)
      
      let errorMessage = 'Ошибка при генерации кода'
      
      if (error.data?.statusMessage) {
        errorMessage = error.data.statusMessage
      } else if (error.message) {
        errorMessage = error.message
      }
      
      await bot.sendMessage(chatId, `❌ ${errorMessage}

Попробуйте еще раз или обратитесь в поддержку.`)
    }
    return
  }
  
  try {
    const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
    // ПРИМЕЧАНИЕ: Бот не может проверить активную сессию пользователя на сайте
    // Поэтому всегда показываем возможность авторизации
    // После успешной авторизации через код, пользователь будет авторизован и на сайте и в боте
    
    // Проверяем есть ли пользователь в БД
    const telegramId = msg.from?.id
    let userExists = false
    
    // Проверяем наличие пользователя в БД и активную сессию
    let hasActiveSession = false
    let isRegistered = false
    
    if (apiUrl && apiUrl !== 'https://192.168.1.40:3000') {
      console.log('🔍 Проверка через API:', `${apiUrl}/api/auth/check-active-session?telegramId=${telegramId}`)
      try {
        const check = await ofetch(`${apiUrl}/api/auth/check-active-session?telegramId=${telegramId}`, {
          method: 'GET',
          rejectUnauthorized: false
        } as any)
        console.log('📋 Ответ от API:', check)
        hasActiveSession = check?.hasActiveSession || false
        isRegistered = !!check?.user
      } catch (error) {
        console.error('❌ Ошибка проверки через API:', error)
      }
    } else {
      // Для dev режима используем прямую проверку
      console.log('🔍 Прямая проверка (dev режим) для telegramId:', telegramId)
      try {
        const check = await checkTelegramAuthDirect(String(telegramId))
        isRegistered = check?.authenticated || false
        console.log('📋 Проверка регистрации:', isRegistered)
        
        // Если пользователь найден, проверяем активную сессию через БД
        if (isRegistered && telegramId) {
          const { checkActiveSessionByTelegramId } = await import('~/server/utils/telegram-auth-helpers')
          const sessionCheck = await checkActiveSessionByTelegramId(String(telegramId))
          hasActiveSession = sessionCheck || false
          console.log('📋 Проверка активной сессии:', hasActiveSession)
        }
      } catch (error) {
        console.error('❌ Ошибка прямой проверки:', error)
      }
    }
    
    console.log('📊 Результат проверки авторизации:', { hasActiveSession, isRegistered, telegramId, willShowMain: hasActiveSession, willShowAuth: !hasActiveSession })
    
    // Если у пользователя есть активная сессия на сайте, показываем главное меню
    if (hasActiveSession) {
      await bot.sendMessage(chatId, `👋 Привет, ${firstName}!

Добро пожаловать в справочник СМП!

✅ Вы уже авторизованы в системе.

Доступные команды:
/favorites - Показать избранное
/help - Справка

Или выберите действие:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }],
            [{ text: '📚 Помощь', callback_data: 'help' }]
          ]
        }
      })
      return
    }
    
    // Если пользователь зарегистрирован, но не авторизован, показываем кнопку авторизации
    if (isRegistered && !hasActiveSession) {
      console.log('⚠️ Пользователь зарегистрирован, но не авторизован - показываем кнопку авторизации')
      await bot.sendMessage(chatId, `👋 Привет, ${firstName}!

Добро пожаловать в справочник СМП!

🔐 Для доступа к полному функционалу необходимо авторизоваться на сайте.

Нажмите кнопку ниже для получения кода авторизации.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔐 Получить код авторизации', callback_data: `auth_${msg.from?.id}` }],
            [{ text: '📚 Помощь', callback_data: 'help' }]
          ]
        }
      })
      return
    }
    
    // Если пользователь не зарегистрирован, показываем предложение авторизации
    console.log('⚠️ Пользователь не зарегистрирован - показываем предложение авторизации')
    await bot.sendMessage(chatId, `👋 Привет, ${firstName}!

Добро пожаловать в справочник СМП!

🔐 Для доступа к полному функционалу необходимо авторизоваться.

Нажмите кнопку ниже для авторизации через Telegram.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔐 Авторизоваться через Telegram', callback_data: `auth_${msg.from?.id}` }],
            [{ text: '📚 Помощь', callback_data: 'help' }]
          ]
        }
      })
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error)
  }
})

bot.onText(/\/help/, async (msg: any) => {
  const chatId = msg.chat.id
  
  await bot.sendMessage(chatId, `
📚 Справочник СМП

Используйте /start для авторизации и начала работы с ботом.

Для работы с полным функционалом перейдите на сайт.
  `)
})

// Команда для просмотра избранного
bot.onText(/\/favorites/, async (msg: any) => {
  const chatId = msg.chat.id
  const telegramId = msg.from?.id
  
  try {
    // Проверяем, авторизован ли пользователь
    const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
    if (!apiUrl) {
      console.error('❌ NUXT_PUBLIC_APP_URL не установлена')
      await bot.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
      return
    }
    
    // Находим пользователя по Telegram ID
    const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${telegramId}`, {
      method: 'GET',
      rejectUnauthorized: false
    } as any)
    
    if (!userCheck?.user) {
      await bot.sendMessage(chatId, `❌ Вы не авторизованы

Используйте /start для авторизации в системе.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔐 Авторизоваться', callback_data: `auth_${telegramId}` }]
          ]
        }
      })
      return
    }
    
    // Получаем избранное пользователя
    const userId = userCheck.user._id
    const favorites = await ofetch(`${apiUrl}/api/bookmarks`, {
      method: 'GET',
      query: { userId },
      rejectUnauthorized: false
    } as any)
    
    if (!favorites?.items || favorites.items.length === 0) {
      await bot.sendMessage(chatId, `📌 У вас пока нет избранного

Добавьте закладки на сайте для использования функционала избранного.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Открыть сайт', url: `${apiUrl}/favorites` }]
          ]
        }
      })
      return
    }
    
    // Группируем закладки по типу
    const grouped = favorites.items.reduce((acc: any, item: any) => {
      const type = item.type || 'other'
      if (!acc[type]) acc[type] = []
      acc[type].push(item)
      return acc
    }, {})
    
    const typeNames: any = {
      drug: '💊 Препараты',
      'local-status': '🏥 Локальные статусы',
      calculator: '🔢 Калькуляторы',
      codifier: '📋 Кодификатор',
      algorithm: '📚 Алгоритмы',
      other: '📌 Другое'
    }
    
    // Формируем сообщение с избранным
    let message = `📌 Ваше избранное (${favorites.items.length})\n\n`
    
    // Добавляем статистику по категориям
    for (const [type, items] of Object.entries(grouped)) {
      message += `${typeNames[type] || type}: ${(items as any[]).length}\n`
    }
    
    message += `\nВыберите категорию для просмотра:`
    
    // Формируем инлайн-кнопки по категориям
    const buttons: any[][] = []
    
    // Добавляем кнопки для каждой категории
    for (const [type, items] of Object.entries(grouped)) {
      const categoryName = typeNames[type] || type
      buttons.push([{ 
        text: `${categoryName} (${(items as any[]).length})`, 
        callback_data: `favorites_category_${type}|${chatId}` 
      }])
    }
    
    // Кнопка "Открыть на сайте"
    buttons.push([{ text: '🌐 Открыть на сайте', url: `${apiUrl}/profile/bookmarks` }])
    
    await bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    })
    
  } catch (error: any) {
    console.error('❌ Ошибка при получении избранного:', error)
    
    await bot.sendMessage(chatId, `❌ Ошибка при загрузке избранного

Используйте /start для авторизации.`)
  }
})


// Обработчик callback для inline кнопок
bot.on('callback_query', async (query: any) => {
  const chatId = query.message?.chat.id
  const messageId = query.message?.message_id
  const data = query.data
  const userId = query.from?.id
  const username = query.from?.username
  const firstName = query.from?.first_name
  const lastName = query.from?.last_name
  
  // Обработка авторизации
  if (data?.startsWith('auth_')) {
    await bot.answerCallbackQuery(query.id, { text: '⏳ Генерация кода...' })
    
    if (chatId && messageId && userId && firstName) {
      try {
        // Вызываем API для генерации кода
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        let response
        
        if (!apiUrl || apiUrl === 'https://192.168.1.40:3000') {
          // Прямой вызов для dev режима
          console.log('🔧 Генерация кода через прямой вызов (dev режим)')
          response = await generateTelegramAuthCode(String(userId), firstName, username || '')
        } else {
          // HTTP запрос для production
          console.log('🔧 Генерация кода через API:', apiUrl)
          response = await ofetch(`${apiUrl}/api/auth/telegram-request-code`, {
            method: 'POST',
            body: {
              id: userId,
              first_name: firstName,
              username: username || ''
            },
            rejectUnauthorized: false
          } as any)
        }
        
        // Обновляем сообщение с кодом
        if (response.success) {
          // Сохраняем chatId и messageId для обновления сообщения после успешной авторизации
          console.log('💾 Сохраняем chatId и messageId для кода:', { telegramId: String(userId), chatId, messageId })
          storeAuthCodeWithChat(String(userId), chatId, messageId)
          
          // Сохраняем данные в специальное хранилище для синхронизации с сайтом
          // Это будет использоваться для автоматического перехода на страницу ввода кода
          console.log('💾 Сохраняем код для синхронизации:', response.code)
          storeAuthCodeForSync(String(userId), response.code)
          
          // Формируем кнопки
          const buttons: any[] = []
          
          // Экранируем все специальные символы для MarkdownV2
          const escapeMarkdown = (text: string) => {
            return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1')
          }
          
          let loginMessage = `🔐 Код авторизации

Ваш код для входа на сайт:

\`${response.code}\`

⏱ Код действителен 10 минут

✅ Страница ввода кода откроется автоматически в вашей вкладке браузера\\!

💡 Нажмите на код для копирования`
          
          await bot.editMessageText(
            loginMessage,
            {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'MarkdownV2',
              reply_markup: {
                inline_keyboard: buttons
              }
            }
          )
        } else {
          // Ошибка генерации кода
          await bot.editMessageText(
            `❌ Ошибка

${response.message || 'Не удалось сгенерировать код. Попробуйте еще раз.'}`,
            {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Попробовать снова', callback_data: `auth_${userId}` }],
                  [{ text: '📚 Помощь', callback_data: 'help' }]
                ]
              }
            }
          )
          
          console.error(`❌ Ошибка генерации кода для пользователя ${userId}:`, response.message)
        }
      } catch (error: any) {
        console.error('❌ Ошибка при генерации кода:', error)
        
        await bot.editMessageText(
          `❌ Ошибка соединения

Не удалось подключиться к серверу. Убедитесь, что сервер запущен и попробуйте еще раз.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Попробовать снова', callback_data: `auth_${userId}` }],
                [{ text: '📚 Помощь', callback_data: 'help' }]
              ]
            }
          }
        )
      }
    }
  } else if (data === 'help') {
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (chatId && messageId) {
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : 'https://helpsmp.ru')
      const siteUrl = apiUrl || 'https://helpsmp.ru'
      
      const helpMessage = `📚 Справочник СМП

🔍 О проекте:
Справочник СМП — это информационная система для медицинского персонала службы скорой медицинской помощи.

📋 Возможности:
• 🧪 Поиск препаратов с дозировками и показаниями
• 🏥 Локальные статусы для дежурств
• 📚 Алгоритмы оказания медицинской помощи
• 🔢 Калькуляторы для расчета доз
• ⭐ Избранное для быстрого доступа

🌐 Для доступа к полному функционалу перейдите на сайт и авторизуйтесь через /start.

📱 Используйте кнопки меню для навигации.`
      
      await bot.editMessageText(helpMessage, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '📚 Алгоритмы', url: `${siteUrl}/algorithms/adults` }],
            [{ text: '💊 Препараты', url: `${siteUrl}/drugs` }, { text: '🔢 Калькуляторы', url: `${siteUrl}/calculators` }],
            [{ text: '📋 Кодификатор', url: `${siteUrl}/codifier` }, { text: '🏥 Дежурства', url: `${siteUrl}/substations` }],
            [{ text: '◀️ Назад', callback_data: 'help_back' }]
          ]
        }
      })
    }
  } else if (data === 'help_back') {
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (chatId && messageId) {
      // Проверяем авторизацию и показываем соответствующее меню
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        if (!apiUrl) return
        
        // Проверяем авторизацию
        const { checkActiveSessionByTelegramId } = await import('~/server/utils/telegram-auth-helpers')
        const check = await checkTelegramAuthDirect(String(userId))
        const isRegistered = check?.authenticated || false
        let hasActiveSession = false
        
        if (isRegistered && userId) {
          hasActiveSession = await checkActiveSessionByTelegramId(String(userId))
        }
        
        if (hasActiveSession) {
          await bot.editMessageText(`👋 Привет!

✅ Вы уже авторизованы в системе.

Доступные команды:
/favorites - Показать избранное
/help - Справка

Или выберите действие:`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }],
                [{ text: '📚 Помощь', callback_data: 'help' }]
              ]
            }
          })
        } else {
          await bot.editMessageText(`👋 Привет!

🔐 Для доступа к полному функционалу необходимо авторизоваться на сайте.

Используйте /start для авторизации.`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔐 Получить код авторизации', callback_data: `auth_${userId}` }],
                [{ text: '📚 Помощь', callback_data: 'help' }]
              ]
            }
          })
        }
      } catch (error) {
        console.error('❌ Ошибка:', error)
        // При ошибке просто показываем главное меню
        await bot.editMessageText(`👋 Привет!

Используйте команды:
/start - Начать работу
/favorites - Избранное
/help - Помощь`, {
          chat_id: chatId,
          message_id: messageId
        })
      }
    }
  } else if (data?.startsWith('favorites_category_') && data !== 'favorites_category_all') {
    // Извлекаем категорию из callback_data
    const match = data.match(/^favorites_category_(.+?)\|(.+)$/)
    const categoryType = match ? match[1] : ''
    const targetChatId = match ? match[2] : ''
    
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (chatId && userId && messageId) {
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        if (!apiUrl) {
          console.error('❌ NUXT_PUBLIC_APP_URL не установлена')
          await bot.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
          return
        }
        
        // Находим пользователя
        const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, {
          method: 'GET',
          rejectUnauthorized: false
        } as any)
        
        if (!userCheck?.user) {
          await bot.editMessageText('❌ Вы не авторизованы', {
            chat_id: chatId,
            message_id: messageId
          })
          return
        }
        
        // Получаем избранное
        const favorites = await ofetch(`${apiUrl}/api/bookmarks`, {
          method: 'GET',
          query: { userId: userCheck.user._id },
          rejectUnauthorized: false
        } as any)
        
        if (!favorites?.items || favorites.items.length === 0) {
          await bot.editMessageText('📌 У вас пока нет избранного', {
            chat_id: chatId,
            message_id: messageId
          })
          return
        }
        
        // Фильтруем по категории
        const categoryItems = favorites.items.filter((item: any) => item.type === categoryType)
        
        const typeNames: any = {
          drug: '💊 Препараты',
          'local-status': '🏥 Локальные статусы',
          calculator: '🔢 Калькуляторы',
          codifier: '📋 Кодификатор',
          algorithm: '📚 Алгоритмы',
          other: '📌 Другое'
        }
        
        const categoryName = typeNames[categoryType] || categoryType
        
        let message = `📌 ${categoryName}: ${categoryItems.length} закладок\n\n`
        
        // Формируем список закладок
        categoryItems.slice(0, 10).forEach((item: any, index: number) => {
          const title = item.title || item.name || 'Без названия'
          message += `${index + 1}. ${title}\n`
        })
        
        if (categoryItems.length > 10) {
          message += `\n...и еще ${categoryItems.length - 10} закладок`
        }
        
        // Формируем кнопки для выбора закладок
        const buttons: any[][] = []
        
        // Для калькуляторов сразу показываем кнопки-ссылки на сайт
        if (categoryType === 'calculator') {
          categoryItems.forEach((item: any) => {
            const title = (item.title || item.name || 'Без названия').substring(0, 40)
            let url = item.url || ''
            if (url && !url.startsWith('http')) {
              url = `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`
            }
            if (!url) {
              url = `${apiUrl}/calculators`
            }
            buttons.push([{ text: title, url }])
          })
        } else {
          // Для других категорий показываем кнопки для выбора закладок
          categoryItems.slice(0, 5).forEach((item: any) => {
            const title = (item.title || item.name || 'Без названия').substring(0, 30)
            const bookmarkId = item._id || item.id || ''
            // Передаем и chatId и categoryType для правильного возврата
            buttons.push([{ text: title, callback_data: `favorites_item_${bookmarkId}|${chatId}|${categoryType}` }])
          })
        }
        
        // Кнопка "Назад" к списку категорий (не к главному меню)
        buttons.push([{ text: '◀️ Назад', callback_data: `favorites_back_categories|${chatId}` }])
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: buttons
          }
        })
      } catch (error) {
        console.error('❌ Ошибка при загрузке категории:', error)
      }
    }
  } else if (data === 'show_favorites' || data === 'favorites_category_all') {
    // Показываем избранное через callback
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (!chatId) return
    
    try {
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
      if (!apiUrl) {
        console.error('❌ NUXT_PUBLIC_APP_URL не установлена')
        await bot.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
        return
      }
      
      // Находим пользователя
      const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, {
        method: 'GET',
        rejectUnauthorized: false
      } as any)
      
      if (!userCheck?.user) {
        // Если есть messageId, редактируем, иначе отправляем новое
        if (messageId) {
          await bot.editMessageText('❌ Вы не авторизованы\n\nНеобходимо авторизоваться для доступа к избранному.', {
            chat_id: chatId,
            message_id: messageId
          })
        } else {
          await bot.sendMessage(chatId, '❌ Вы не авторизованы\n\nНеобходимо авторизоваться для доступа к избранному.')
        }
        return
      }
      
      // Получаем избранное
      const favorites = await ofetch(`${apiUrl}/api/bookmarks`, {
        method: 'GET',
        query: { userId: userCheck.user._id },
        rejectUnauthorized: false
      } as any)
      
      const typeNames: any = {
        drug: '💊 Препараты',
        'local-status': '🏥 Локальные статусы',
        calculator: '🔢 Калькуляторы',
        codifier: '📋 Кодификатор',
        algorithm: '📚 Алгоритмы',
        other: '📌 Другое'
      }
      
      // Проверяем, если это запрос для конкретной категории (не all)
      // Для favorites_category_all не должен выполниться этот блок
      const isSpecificCategory = data.startsWith('favorites_category_') && !data.endsWith('_all') && data.includes('|')
      
      if (isSpecificCategory) {
        // Это запрос конкретной категории
        const categoryType = data.split('favorites_category_')[1].split('|')[0]
        console.log('📂 Загрузка закладок категории:', categoryType)
        
        if (!favorites?.items || favorites.items.length === 0) {
          const emptyMsg = `📌 У вас пока нет избранного\n\nДобавьте закладки на сайте для использования функционала избранного.`
          if (messageId) {
            await bot.editMessageText(emptyMsg, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🌐 Открыть сайт', url: `${apiUrl}/profile/bookmarks` }],
                  [{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]
                ]
              }
            })
          } else {
            await bot.sendMessage(chatId, emptyMsg, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🌐 Открыть сайт', url: `${apiUrl}/profile/bookmarks` }],
                  [{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]
                ]
              }
            })
          }
          return
        }
        
        // Фильтруем по категории
        const filteredItems = favorites.items.filter((item: any) => item.type === categoryType)
        
        if (filteredItems.length === 0) {
          const emptyMsg = `📌 В категории "${typeNames[categoryType]}" пока нет закладок`
          if (messageId) {
            await bot.editMessageText(emptyMsg, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]
                ]
              }
            })
          } else {
            await bot.sendMessage(chatId, emptyMsg, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]
                ]
              }
            })
          }
          return
        }
        
        // Формируем список закладок категории
        let message = `${typeNames[categoryType]} (${filteredItems.length}):\n\n`
        
        for (const item of filteredItems) {
          const title = item.title || 'Без названия'
          const truncated = title.length > 40 ? title.substring(0, 40) + '...' : title
          message += `• ${truncated}\n`
        }
        
        const buttons: any[] = filteredItems.map((item: any, index: number) => ({
          text: `• ${(item.title || 'Без названия').length > 30 ? (item.title || 'Без названия').substring(0, 30) + '...' : (item.title || 'Без названия')}`,
          callback_data: `favorites_item_${categoryType}|${index}|${chatId}`
        }))
        
        // Группируем кнопки по 1 в ряд
        const keyboard: any[][] = buttons.map(btn => [btn])
        keyboard.push([{ text: '◀️ Назад к категориям', callback_data: `favorites_back|${chatId}` }])
        
        if (messageId) {
          await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: keyboard
            }
          })
        } else {
          await bot.sendMessage(chatId, message, {
            reply_markup: {
              inline_keyboard: keyboard
            }
          })
        }
        return
      }
      
      // Если это запрос всех категорий (favorites_category_all) или favorites_back
      if (!favorites?.items || favorites.items.length === 0) {
        const emptyMsg = `📌 У вас пока нет избранного\n\nДобавьте закладки на сайте для использования функционала избранного.`
        
        if (messageId) {
          await bot.editMessageText(emptyMsg, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🌐 Открыть сайт', url: `${apiUrl}/profile/bookmarks` }]
              ]
            }
          })
        } else {
          await bot.sendMessage(chatId, emptyMsg, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🌐 Открыть сайт', url: `${apiUrl}/profile/bookmarks` }]
              ]
            }
          })
        }
        return
      }
      
      // Группируем по категориям
      const grouped = favorites.items.reduce((acc: any, item: any) => {
        const type = item.type || 'other'
        if (!acc[type]) acc[type] = []
        acc[type].push(item)
        return acc
      }, {})
      
      console.log('📋 Группировка избранного:', { 
        totalItems: favorites.items.length,
        groupedKeys: Object.keys(grouped),
        grouped: Object.entries(grouped).map(([type, items]) => `${type}: ${(items as any[]).length}`)
      })
      
      let message = `📌 Ваше избранное (${favorites.items.length})\n\n`
      
      for (const [type, items] of Object.entries(grouped)) {
        message += `${typeNames[type] || type}: ${(items as any[]).length}\n`
      }
      
      message += `\nВыберите категорию для просмотра:`
      
      console.log('📋 Формируем сообщение:', { message, data })
      
      const buttons: any[][] = []
      
      for (const [type, items] of Object.entries(grouped)) {
        const categoryName = typeNames[type] || type
        buttons.push([{ 
          text: `${categoryName} (${(items as any[]).length})`, 
          callback_data: `favorites_category_${type}|${chatId}` 
        }])
      }
      
      buttons.push([{ text: '🌐 Открыть на сайте', url: `${apiUrl}/profile/bookmarks` }])
      buttons.push([{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }])
      
      if (messageId) {
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: buttons
          }
        })
      } else {
        await bot.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: buttons
          }
        })
      }
    } catch (error) {
      console.error('❌ Ошибка:', error)
      const errorMsg = '❌ Ошибка при загрузке избранного'
      if (messageId) {
        await bot.editMessageText(errorMsg, {
          chat_id: chatId,
          message_id: messageId
        })
      } else {
        await bot.sendMessage(chatId, errorMsg)
      }
    }
  } else if (data?.startsWith('favorites_item_')) {
    // Показываем детали закладки
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (!chatId || !userId || !messageId) return
    
    try {
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
      if (!apiUrl) {
        console.error('❌ NUXT_PUBLIC_APP_URL не установлена')
        await bot.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
        return
      }
      
      // Извлекаем ID закладки
      const match = data.match(/^favorites_item_(.+?)\|(.+)$/)
      const bookmarkId = match ? match[1] : ''
      const originalChatId = match ? match[2] : ''
      
      // Находим пользователя
      const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, {
        method: 'GET',
        rejectUnauthorized: false
      } as any)
      
      if (!userCheck?.user) return
      
      // Получаем все закладки пользователя
      const favorites = await ofetch(`${apiUrl}/api/bookmarks`, {
        method: 'GET',
        query: { userId: userCheck.user._id },
        rejectUnauthorized: false
      } as any)
      
      if (!favorites?.items) return
      
      // Находим нужную закладку
      const bookmark = favorites.items.find((item: any) => item._id === bookmarkId || item.id === bookmarkId)
      
      if (!bookmark) {
        await bot.editMessageText('❌ Закладка не найдена', {
          chat_id: chatId,
          message_id: messageId
        })
        return
      }
      
      // Формируем сообщение с информацией о закладке
      let message = `<b>${bookmark.title}</b>`
      
      // Дополнительная информация в зависимости от типа
      if (bookmark.type === 'drug') {
        // Категории
        if (bookmark.categories && bookmark.categories.length > 0) {
          message += `\n\n<b>Категории:</b> ${bookmark.categories.join(', ')}`
        }
        
        // Латинское название
        if (bookmark.latinName) {
          message += `\n\n<b>Латинское название:</b> ${bookmark.latinName}`
        }
        
        // Показания
        if (bookmark.indications && bookmark.indications.length > 0) {
          message += `\n\n<b>Показания:</b>`
          bookmark.indications.forEach((ind: any) => {
            message += `\n• ${ind}`
          })
        }
        
        // Противопоказания
        if (bookmark.contraindications && bookmark.contraindications.length > 0) {
          message += `\n\n<b>Противопоказания:</b>`
          bookmark.contraindications.forEach((contr: any) => {
            message += `\n• ${contr}`
          })
        }
        
        // Дозировки (пропускаем, если это явно калькуляторная доза, а не описание)
        if (bookmark.dosages && bookmark.dosages.length > 0) {
          // Фильтруем дозировки: пропускаем те, что явно не описания
          const validDosages = bookmark.dosages.filter((dos: any) => {
            const dosStr = String(dos).trim()
            // Пропускаем, если это просто число или короткий текст без описания (вероятно калькулятор)
            if (dosStr.length < 10 && /^\d+/.test(dosStr)) return false
            // Пропускаем описания формата "СТАРШЕ" без дополнительного контекста
            if (dosStr.toUpperCase().includes('СТАРШЕ') && dosStr.length < 20) return false
            return dosStr.length > 3 // Минимум 3 символа для валидного описания
          })
          
          if (validDosages.length > 0) {
            message += `\n\n<b>Дозировки:</b>`
            validDosages.forEach((dos: any) => {
              message += `\n• ${dos}`
            })
          }
        }
        
        // Побочные эффекты (приоритет adverse, затем sideEffects)
        if (bookmark.adverse && bookmark.adverse.length > 0) {
          message += `\n\n<b>Побочные эффекты:</b>`
          bookmark.adverse.forEach((side: any) => {
            message += `\n• ${side}`
          })
        } else if (bookmark.sideEffects && bookmark.sideEffects.length > 0) {
          message += `\n\n<b>Побочные эффекты:</b>`
          bookmark.sideEffects.forEach((side: any) => {
            message += `\n• ${side}`
          })
        }
        
        // Механизм действия (приоритет mechanism, затем mechanismOfAction)
        if (bookmark.mechanism && bookmark.mechanism.length > 0) {
          message += `\n\n<b>Механизм действия:</b>`
          bookmark.mechanism.forEach((mech: any) => {
            message += `\n• ${mech}`
          })
        } else if (bookmark.mechanismOfAction && bookmark.mechanismOfAction.length > 0) {
          message += `\n\n<b>Механизм действия:</b>`
          bookmark.mechanismOfAction.forEach((mech: any) => {
            message += `\n• ${mech}`
          })
        }
        
        // Фармакокинетика
        if (bookmark.pharmacokinetics) {
          message += `\n\n<b>Фармакокинетика:</b>`
          if (bookmark.pharmacokinetics.onset) {
            message += `\nНачало действия: ${bookmark.pharmacokinetics.onset}`
          } else if (bookmark.pharmacokinetics.startTime) {
            message += `\nНачало действия: ${bookmark.pharmacokinetics.startTime}`
          }
          if (bookmark.pharmacokinetics.duration) {
            message += `\nДлительность: ${bookmark.pharmacokinetics.duration}`
          }
          if (bookmark.pharmacokinetics.half_life) {
            message += `\nT1/2: ${bookmark.pharmacokinetics.half_life}`
          } else if (bookmark.pharmacokinetics.halfLife) {
            message += `\nT1/2: ${bookmark.pharmacokinetics.halfLife}`
          }
          if (bookmark.pharmacokinetics.metabolism) {
            message += `\nМетаболизм: ${bookmark.pharmacokinetics.metabolism}`
          }
          if (bookmark.pharmacokinetics.elimination) {
            message += `\nВыведение: ${bookmark.pharmacokinetics.elimination}`
          } else if (bookmark.pharmacokinetics.excretion) {
            message += `\nВыведение: ${bookmark.pharmacokinetics.excretion}`
          }
        }
        
        // Синонимы
        if (bookmark.synonyms && bookmark.synonyms.length > 0) {
          message += `\n\n<b>Синонимы:</b> ${bookmark.synonyms.join(', ')}`
        }
        
        // Аналоги
        if (bookmark.analogs && bookmark.analogs.length > 0) {
          message += `\n\n<b>Аналоги:</b> ${bookmark.analogs.join(', ')}`
        }
        
        // Взаимодействия
        if (bookmark.interactions && bookmark.interactions.length > 0) {
          message += `\n\n<b>Взаимодействия:</b>`
          bookmark.interactions.forEach((int: any) => {
            message += `\n• ${int}`
          })
        }
        
        // Антидоты
        if (bookmark.antidotes && bookmark.antidotes.length > 0) {
          message += `\n\n<b>Антидоты:</b>`
          bookmark.antidotes.forEach((ant: any) => {
            message += `\n• ${ant}`
          })
        }
        
        // Педиатрические дозировки
        if (bookmark.pediatricDose && bookmark.pediatricDose.length > 0) {
          message += `\n\n<b>Педиатрические дозировки:</b>`
          bookmark.pediatricDose.forEach((ped: any) => {
            message += `\n• ${ped}`
          })
          if (bookmark.pediatricDoseUnit) {
            message += ` (${bookmark.pediatricDoseUnit})`
          }
        }
        
        // Возрастные ограничения
        if (bookmark.ageRestrictions) {
          message += `\n\n<b>Возрастные ограничения:</b> ${bookmark.ageRestrictions}`
        }
        
        if (bookmark.category) {
          message += `\n\n<i>${bookmark.category}</i>`
        }
      }
      
      if (bookmark.type === 'codifier') {
        if (bookmark.description) {
          message += `\n\n${bookmark.description}`
        }
        if (bookmark.code) {
          message += `\n\n<b>Код:</b> ${bookmark.code}`
        }
        if (bookmark.mkbCode) {
          message += `\n<b>Код МКБ:</b> ${bookmark.mkbCode}`
        }
        if (bookmark.stationCode) {
          message += `\n<b>Код станции:</b> ${bookmark.stationCode}`
        }
        if (bookmark.category) {
          message += `\n\n<i>Категория: ${bookmark.category}</i>`
        }
      }
      
      if (bookmark.type === 'local-status') {
        if (bookmark.complaints) {
          const complaintsText = bookmark.complaints.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
          message += `\n\n<b>Жалобы:</b>\n${complaintsText}`
        }
        if (bookmark.anamnesis) {
          const anamnesisText = bookmark.anamnesis.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
          message += `\n\n<b>Анамнез:</b>\n${anamnesisText}`
        }
        if (bookmark.localis) {
          const localisText = bookmark.localis.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>')
          message += `\n\n<b>Status localis:</b>\n${localisText}`
        }
        if (bookmark.category) {
          message += `\n\n<i>Категория: ${bookmark.category}</i>`
        }
      }
      
      if (bookmark.type === 'calculator' && bookmark.description) {
        message += `\n\n${bookmark.description}`
      }
      
      // Формируем URL для ссылки на сайт
      let url = bookmark.url || ''
      if (url && !url.startsWith('http')) {
        url = `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`
      }
      
      if (!url) {
        url = `${apiUrl}/profile/bookmarks`
      }
      
      // Кнопки: "Посмотреть на сайте" и "Назад"
      const buttons: any[][] = [
        [{ text: '🌐 Посмотреть на сайте', url }],
        [{ text: '◀️ Назад', callback_data: `favorites_category_${bookmark.type}|${originalChatId}` }]
      ]
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons
        }
      })
    } catch (error) {
      console.error('❌ Ошибка:', error)
      await bot.editMessageText('❌ Ошибка при загрузке закладки', {
        chat_id: chatId,
        message_id: messageId
      })
    }
  } else if (data?.startsWith('favorites_back_categories|')) {
    // Возврат к списку категорий избранного
    const backMatch = data.match(/^favorites_back_categories\|(.+)$/)
    const targetChatId = backMatch ? backMatch[1] : ''
    
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (!chatId || !userId || !messageId) return
    
    try {
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
      if (!apiUrl) {
        console.error('❌ NUXT_PUBLIC_APP_URL не установлена')
        await bot.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
        return
      }
      
      // Находим пользователя
      const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, {
        method: 'GET',
        rejectUnauthorized: false
      } as any)
      
      if (!userCheck?.user) return
      
      // Получаем избранное
      const favorites = await ofetch(`${apiUrl}/api/bookmarks`, {
        method: 'GET',
        query: { userId: userCheck.user._id },
        rejectUnauthorized: false
      } as any)
      
      if (!favorites?.items) return
      
      // Группируем по категориям
      const grouped = favorites.items.reduce((acc: any, item: any) => {
        const type = item.type || 'other'
        if (!acc[type]) acc[type] = []
        acc[type].push(item)
        return acc
      }, {})
      
      const typeNames: any = {
        drug: '💊 Препараты',
        'local-status': '🏥 Локальные статусы',
        calculator: '🔢 Калькуляторы',
        codifier: '📋 Кодификатор',
        algorithm: '📚 Алгоритмы',
        other: '📌 Другое'
      }
      
      let message = `📌 Ваше избранное (${favorites.items.length})\n\n`
      
      for (const [type, items] of Object.entries(grouped)) {
        message += `${typeNames[type] || type}: ${(items as any[]).length}\n`
      }
      
      message += `\nВыберите категорию для просмотра:`
      
      const buttons: any[][] = []
      
      for (const [type, items] of Object.entries(grouped)) {
        const categoryName = typeNames[type] || type
        buttons.push([{ 
          text: `${categoryName} (${(items as any[]).length})`, 
          callback_data: `favorites_category_${type}|${targetChatId}` 
        }])
      }
      
      buttons.push([{ text: '🌐 Открыть на сайте', url: `${apiUrl}/profile/bookmarks` }])
      buttons.push([{ text: '◀️ Назад', callback_data: `favorites_back|${targetChatId}` }])
      
      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: buttons
        }
      })
    } catch (error) {
      console.error('❌ Ошибка:', error)
    }
  } else if (data?.startsWith('favorites_back|')) {
    // Возврат к главному меню /start
    
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (chatId && userId && messageId) {
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        if (!apiUrl) {
          console.error('❌ NUXT_PUBLIC_APP_URL не установлена')
          await bot.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
          return
        }
        
        // Находим пользователя
        const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, {
          method: 'GET',
          rejectUnauthorized: false
        } as any).catch(() => null)
        
        if (!userCheck?.user) {
          // Если не авторизован, показываем кнопку авторизации
          await bot.editMessageText(`👋 Добро пожаловать в справочник СМП!

🔐 Для доступа к полному функционалу необходимо авторизоваться.

Доступные команды:
/start - Начать работу
/favorites - Избранное
/help - Помощь`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔐 Авторизоваться через Telegram', callback_data: `auth_${userId}` }],
                [{ text: '📚 Помощь', callback_data: 'help' }]
              ]
            }
          })
          return
        }
        
        // Если авторизован, показываем главное меню
        await bot.editMessageText(`👋 Добро пожаловать в справочник СМП!

✅ Вы уже авторизованы в системе.

Доступные команды:
/favorites - Показать избранное
/help - Справка

Или выберите действие:`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }],
              [{ text: '📚 Помощь', callback_data: 'help' }]
            ]
          }
        })
      } catch (error) {
        console.error('❌ Ошибка:', error)
      }
    }
  }
})
} // Закрываем блок if (bot)

export default bot

