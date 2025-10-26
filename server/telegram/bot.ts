import TelegramBot from 'node-telegram-bot-api'
import { ofetch } from 'ofetch'

// Токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// Для локальной разработки (без HTTPS) всегда используем polling
// Webhook требует HTTPS сертификат

// Проверяем наличие токена
if (!BOT_TOKEN) {
  console.error('❌ ERROR: Telegram Bot Token не установлен!')
  console.error('   Установите переменную окружения TELEGRAM_BOT_TOKEN')
}

export const bot = BOT_TOKEN ? new TelegramBot(BOT_TOKEN, { 
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      allowed_updates: ['message', 'callback_query']
    }
  }
}) : null

// Telegram бот инициализирован только если токен установлен

// Обработка ошибок соединения (только если бот инициализирован)
if (bot) {
  bot.on('polling_error', (error) => {
    console.error('❌ Ошибка polling:', error.message)
  })

  bot.on('error', (error) => {
    console.error('❌ Ошибка бота:', error.message)
  })
}

// Обработчики команд (только если бот инициализирован)
if (bot) {
  bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
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
      // Вызываем API для подключения Telegram
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
      const response = await ofetch(`${apiUrl}/api/auth/connect-telegram`, {
        method: 'POST',
        body: {
          userId,
          telegramId: msg.from?.id,
          username: msg.from?.username,
          firstName: msg.from?.first_name,
          lastName: msg.from?.last_name,
          photo_url: msg.from?.photo_url
        },
        rejectUnauthorized: false
      } as any)
      
      if (response.success) {
        const settingsUrl = `${apiUrl}/profile/settings?telegram_connected=true`
        
        await bot.sendMessage(chatId, `✅ Telegram успешно подключен к вашему аккаунту!

👤 Ваш аккаунт: ${msg.from?.first_name} ${msg.from?.last_name || ''}

Теперь вы можете входить через Telegram.

🔗 Откройте настройки:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚙️ Открыть настройки', url: settingsUrl }],
              [{ text: '📚 Помощь', callback_data: 'help' }]
            ]
          }
        })
      } else {
        await bot.sendMessage(chatId, `❌ ${response.message || 'Ошибка подключения'}`)
      }
    } catch (error: any) {
      console.error('❌ Ошибка подключения Telegram:', error)
      
      let errorMessage = 'Ошибка подключения Telegram'
      
      if (error.data?.statusMessage) {
        errorMessage = error.data.statusMessage
      } else if (error.message) {
        errorMessage = error.message
      }
      
      await bot.sendMessage(chatId, `❌ ${errorMessage}

Попробуйте еще раз или обратитесь в поддержку.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: `auth_${msg.from?.id}` }]
          ]
        }
      })
    }
    return
  }
  
  try {
    // Всегда предлагаем авторизацию при /start
    // (авторизация через бота создает новую сессию на сайте)
    
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

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id
  
  await bot.sendMessage(chatId, `
📚 Помощь по использованию бота:

/start - Начать работу с ботом
/help - Показать эту справку
/login - Авторизоваться в системе
/favorites - Показать избранное

🌐 Для работы с полным функционалом перейдите на сайт.
  `)
})

// Команда для просмотра избранного
bot.onText(/\/favorites/, async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from?.id
  
  try {
    // Проверяем, авторизован ли пользователь
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
    
    // Находим пользователя по Telegram ID
    const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${telegramId}`, {
      method: 'GET',
      rejectUnauthorized: false
    } as any)
    
    if (!userCheck?.user) {
      await bot.sendMessage(chatId, `❌ Вы не авторизованы

Используйте /login для авторизации в системе.`, {
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
      message += `${typeNames[type] || type}: ${items.length}\n`
    }
    
    message += `\nВыберите категорию для просмотра:`
    
    // Формируем инлайн-кнопки по категориям
    const buttons: any[][] = []
    
    // Добавляем кнопки для каждой категории
    for (const [type, items] of Object.entries(grouped)) {
      const categoryName = typeNames[type] || type
      buttons.push([{ 
        text: `${categoryName} (${items.length})`, 
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

Используйте /login для авторизации.`)
  }
})

bot.onText(/\/login/, async (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from?.id
  
  if (chatId && userId) {
    try {
      await bot.sendMessage(chatId, `🔐 Авторизация в системе

После авторизации вы сможете:
✅ Просматривать локальные статусы
✅ Искать препараты
✅ Использовать калькуляторы
✅ Сохранять закладки

Нажмите кнопку ниже для авторизации:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔐 Авторизоваться через Telegram', callback_data: `auth_${userId}` }],
            [{ text: '📚 Помощь', callback_data: 'help' }]
          ]
        }
      })
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error)
    }
  }
})

// Обработчик callback для inline кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id
  const messageId = query.message?.message_id
  const data = query.data
  const userId = query.from?.id
  const username = query.from?.username
  const firstName = query.from?.first_name
  const lastName = query.from?.last_name
  
  // Обработка авторизации
  if (data?.startsWith('auth_')) {
    await bot.answerCallbackQuery(query.id, { text: '⏳ Обработка авторизации...' })
    
    if (chatId && messageId && userId && firstName) {
      try {
        // Вызываем API авторизации
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
        const response = await ofetch(`${apiUrl}/api/auth/telegram-login`, {
          method: 'POST',
          body: {
            id: userId,
            first_name: firstName,
            last_name: lastName || firstName,
            username: username || '',
            photo_url: query.from?.photo_url || ''
          },
          // Используем наш локальный CA сертификат
          rejectUnauthorized: false
        } as any)
        
        // Обновляем сообщение с результатом
        if (response.success) {
          const loginUrl = `${process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'}/auth/login?telegram=true&token=${response.token}`
          
          await bot.editMessageText(
            `✅ Авторизация успешна!

👤 Вы успешно авторизованы в системе.

🔗 Для продолжения перейдите по ссылке:
${loginUrl}

Или обновите страницу, если уже открыты.`,
            {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🌐 Открыть сайт', url: loginUrl }],
                  [{ text: '📚 Помощь', callback_data: 'help' }]
                ]
              }
            }
          )
        } else {
          // Ошибка авторизации
          await bot.editMessageText(
            `❌ Ошибка авторизации

${response.message || 'Не удалось выполнить авторизацию. Попробуйте еще раз.'}`,
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
          
          console.error(`❌ Ошибка авторизации пользователя ${userId}:`, response.message)
        }
      } catch (error: any) {
        console.error('❌ Ошибка при обработке авторизации:', error)
        
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
    await bot.answerCallbackQuery(query.id)
    
    if (chatId) {
      await bot.sendMessage(chatId, `
📚 Доступные команды:

/start - Начать работу с ботом
/help - Показать справку
/login - Авторизоваться через Telegram
/favorites - Показать избранное

🔗 Перейдите на сайт для полного функционала
      `)
    }
  } else if (data?.startsWith('favorites_category_')) {
    // Извлекаем категорию из callback_data
    const match = data.match(/^favorites_category_(.+?)\|(.+)$/)
    const categoryType = match ? match[1] : ''
    const targetChatId = match ? match[2] : ''
    
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (chatId && userId && messageId) {
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
        
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
  } else if (data === 'show_favorites') {
    // Показываем избранное через callback
    await bot.answerCallbackQuery(query.id, { text: '⏳ Загрузка...' })
    
    if (!chatId) return
    
    try {
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
      
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
        message += `${typeNames[type] || type}: ${items.length}\n`
      }
      
      message += `\nВыберите категорию для просмотра:`
      
      const buttons: any[][] = []
      
      for (const [type, items] of Object.entries(grouped)) {
        const categoryName = typeNames[type] || type
        buttons.push([{ 
          text: `${categoryName} (${items.length})`, 
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
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
      
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
          bookmark.indications.forEach(ind => {
            message += `\n• ${ind}`
          })
        }
        
        // Противопоказания
        if (bookmark.contraindications && bookmark.contraindications.length > 0) {
          message += `\n\n<b>Противопоказания:</b>`
          bookmark.contraindications.forEach(contr => {
            message += `\n• ${contr}`
          })
        }
        
        // Дозировки (пропускаем, если это явно калькуляторная доза, а не описание)
        if (bookmark.dosages && bookmark.dosages.length > 0) {
          // Фильтруем дозировки: пропускаем те, что явно не описания
          const validDosages = bookmark.dosages.filter((dos: string) => {
            const dosStr = String(dos).trim()
            // Пропускаем, если это просто число или короткий текст без описания (вероятно калькулятор)
            if (dosStr.length < 10 && /^\d+/.test(dosStr)) return false
            // Пропускаем описания формата "СТАРШЕ" без дополнительного контекста
            if (dosStr.toUpperCase().includes('СТАРШЕ') && dosStr.length < 20) return false
            return dosStr.length > 3 // Минимум 3 символа для валидного описания
          })
          
          if (validDosages.length > 0) {
            message += `\n\n<b>Дозировки:</b>`
            validDosages.forEach(dos => {
              message += `\n• ${dos}`
            })
          }
        }
        
        // Побочные эффекты (приоритет adverse, затем sideEffects)
        if (bookmark.adverse && bookmark.adverse.length > 0) {
          message += `\n\n<b>Побочные эффекты:</b>`
          bookmark.adverse.forEach(side => {
            message += `\n• ${side}`
          })
        } else if (bookmark.sideEffects && bookmark.sideEffects.length > 0) {
          message += `\n\n<b>Побочные эффекты:</b>`
          bookmark.sideEffects.forEach(side => {
            message += `\n• ${side}`
          })
        }
        
        // Механизм действия (приоритет mechanism, затем mechanismOfAction)
        if (bookmark.mechanism && bookmark.mechanism.length > 0) {
          message += `\n\n<b>Механизм действия:</b>`
          bookmark.mechanism.forEach(mech => {
            message += `\n• ${mech}`
          })
        } else if (bookmark.mechanismOfAction && bookmark.mechanismOfAction.length > 0) {
          message += `\n\n<b>Механизм действия:</b>`
          bookmark.mechanismOfAction.forEach(mech => {
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
          bookmark.interactions.forEach(int => {
            message += `\n• ${int}`
          })
        }
        
        // Антидоты
        if (bookmark.antidotes && bookmark.antidotes.length > 0) {
          message += `\n\n<b>Антидоты:</b>`
          bookmark.antidotes.forEach(ant => {
            message += `\n• ${ant}`
          })
        }
        
        // Педиатрические дозировки
        if (bookmark.pediatricDose && bookmark.pediatricDose.length > 0) {
          message += `\n\n<b>Педиатрические дозировки:</b>`
          bookmark.pediatricDose.forEach(ped => {
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
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
      
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
        message += `${typeNames[type] || type}: ${items.length}\n`
      }
      
      message += `\nВыберите категорию для просмотра:`
      
      const buttons: any[][] = []
      
      for (const [type, items] of Object.entries(grouped)) {
        const categoryName = typeNames[type] || type
        buttons.push([{ 
          text: `${categoryName} (${items.length})`, 
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
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru'
        
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
/help - Справка по использованию
/favorites - Показать избранное
/login - Получить ссылку для авторизации`, {
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
              [{ text: '📌 Избранное', callback_data: 'show_favorites' }],
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

