import { Telegraf } from 'telegraf'
import { ofetch } from 'ofetch'
import { generateTelegramAuthCode, checkTelegramAuth as checkTelegramAuthDirect } from '~/server/utils/telegram-auth-helpers'
import { storeAuthCodeWithChat, storeAuthCodeForSync } from '~/server/utils/telegram-auth-codes'

// Токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

if (!BOT_TOKEN) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN не установлен!')
}

// Создаем Telegraf-инстанс один раз (для hot-reload окружений)
if (!(globalThis as any).telegramBot) {
  console.log('🤖 Инициализация Telegram бота (Telegraf)')
  ;(globalThis as any).telegramBot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null
}

export const bot: Telegraf | null = (globalThis as any).telegramBot

// Глобальная обработка ошибок
if (bot) {
  bot.catch((err) => {
    console.error('❌ Ошибка бота:', (err as any)?.message || err)
  })
}

// Обработчики команд и событий
if (bot) {
  // /start (с поддержкой параметра, например: /start connect_<id>)
  bot.start(async (ctx) => {
    const chatId = ctx.chat?.id
    const firstName = ctx.from?.first_name || 'Пользователь'
    const text = (ctx.message && 'text' in ctx.message ? (ctx.message as any).text : '') as string
    const commandArg = text.split(' ').slice(1).join(' ')

    if (commandArg?.startsWith('connect_')) {
      const userId = commandArg.replace('connect_', '')
      if (!userId || userId === 'user' || userId === 'unknown') {
        if (chatId) await bot.telegram.sendMessage(chatId, '❌ Ошибка: неверный ID пользователя')
        return
      }
      try {
        if (!ctx.from?.id) {
          if (chatId) await bot.telegram.sendMessage(chatId, '❌ Ошибка: не удалось получить ID пользователя')
          return
        }
        const telegramUserId = String(ctx.from.id)
        const first = ctx.from?.first_name || 'User'
        const username = ctx.from?.username

        const connectCode = await generateTelegramAuthCode(telegramUserId, first, username as any)
        if (!connectCode.success || !connectCode.code) {
          if (chatId) await bot.telegram.sendMessage(chatId, '❌ Ошибка при генерации кода')
          return
        }

        const { addConnectCode } = await import('~/server/api/auth/verify-telegram-connect-code.post')
        addConnectCode(connectCode.code, telegramUserId)

        const codeValue = connectCode.code
        const connectMessage = `🔐 Код для подключения Telegram\n\nВаш код для подключения к аккаунту:\n🔢 <span class="tg-spoiler"><code>${codeValue}</code></span>\n\n⏱ Код действителен 10 минут\n\n✅ Страница ввода кода откроется автоматически\n\n💡 Нажмите на код для раскрытия и копирования`
        if (chatId) {
          await bot.telegram.sendMessage(chatId, connectMessage, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } } as any)
        }
      } catch (error) {
        console.error('❌ Ошибка генерирования кода:', error)
        if (chatId) await bot.telegram.sendMessage(chatId, '❌ Ошибка при генерации кода')
      }
      return
    }

    try {
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
      const telegramId = ctx.from?.id

      let hasActiveSession = false
      let isRegistered = false

      if (apiUrl && apiUrl !== 'https://192.168.1.40:3000') {
        try {
          const check = await ofetch(`${apiUrl}/api/auth/check-active-session?telegramId=${telegramId}`, { method: 'GET', rejectUnauthorized: false } as any)
          hasActiveSession = check?.hasActiveSession || false
          isRegistered = !!check?.user
        } catch (e) {
          console.error('❌ Ошибка проверки через API:', e)
        }
      } else {
        try {
          const check = await checkTelegramAuthDirect(String(telegramId))
          isRegistered = check?.authenticated || false
          if (isRegistered && telegramId) {
            const { checkActiveSessionByTelegramId } = await import('~/server/utils/telegram-auth-helpers')
            hasActiveSession = await checkActiveSessionByTelegramId(String(telegramId))
          }
        } catch (e) {
          console.error('❌ Ошибка прямой проверки:', e)
        }
      }

      if (hasActiveSession) {
        if (chatId) await bot.telegram.sendMessage(chatId, `👋 Привет, ${firstName}!\n\nДобро пожаловать в справочник СМП!\n\n✅ Вы уже авторизованы в системе.\n\nДоступные команды:\n/favorites - Показать избранное\n/help - Справка\n\nИли выберите действие:`, {
          reply_markup: { inline_keyboard: [[{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }], [{ text: '📚 Помощь', callback_data: 'help' }]] }
        } as any)
        return
      }

      if (isRegistered && !hasActiveSession) {
        if (chatId) await bot.telegram.sendMessage(chatId, `👋 Привет, ${firstName}!\n\nДобро пожаловать в справочник СМП!\n\n🔐 Для доступа к полному функционалу необходимо авторизоваться на сайте.\n\nНажмите кнопку ниже для получения кода авторизации.`, {
          reply_markup: { inline_keyboard: [[{ text: '🔐 Получить код авторизации', callback_data: `auth_${ctx.from?.id}` }], [{ text: '📚 Помощь', callback_data: 'help' }]] }
        } as any)
        return
      }

      if (chatId) await bot.telegram.sendMessage(chatId, `👋 Привет, ${firstName}!\n\nДобро пожаловать в справочник СМП!\n\n🔐 Для доступа к полному функционалу необходимо авторизоваться.\n\nНажмите кнопку ниже для авторизации через Telegram.`, {
        reply_markup: { inline_keyboard: [[{ text: '🔐 Авторизоваться через Telegram', callback_data: `auth_${ctx.from?.id}` }], [{ text: '📚 Помощь', callback_data: 'help' }]] }
      } as any)
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error)
    }
  })

  // /help
  bot.help(async (ctx) => {
    const chatId = ctx.chat?.id
    if (!chatId) return
    await bot.telegram.sendMessage(chatId, `\n📚 Справочник СМП\n\nИспользуйте /start для авторизации и начала работы с ботом.\n\nДля работы с полным функционалом перейдите на сайт.\n  `, { reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'help_back' }]] } } as any)
  })

  // /favorites
  bot.command('favorites', async (ctx) => {
    const chatId = ctx.chat?.id
    const telegramId = ctx.from?.id
    try {
      const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
      const siteUrl = apiUrl && apiUrl.startsWith('https://') ? apiUrl : 'https://helpsmp.ru'
      if (!apiUrl) {
        if (chatId) await bot.telegram.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
        return
      }

      const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${telegramId}`, { method: 'GET', rejectUnauthorized: false } as any)
      if (!userCheck?.user) {
        if (chatId) await bot.telegram.sendMessage(chatId, `❌ Вы не авторизованы\n\nИспользуйте /start для авторизации в системе.`, { reply_markup: { inline_keyboard: [[{ text: '🔐 Авторизоваться', callback_data: `auth_${telegramId}` }]] } } as any)
        return
      }

      const userId = userCheck.user._id
      const favorites = await ofetch(`${apiUrl}/api/bookmarks`, { method: 'GET', query: { userId }, rejectUnauthorized: false } as any)

      if (!favorites?.items || favorites.items.length === 0) {
        if (chatId) await bot.telegram.sendMessage(chatId, `📌 У вас пока нет избранного\n\nДобавьте закладки на сайте для использования функционала избранного.`, { reply_markup: { inline_keyboard: [[{ text: '🌐 Открыть сайт', url: `${siteUrl}/favorites` }],[{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]] } } as any)
        return
      }

      const grouped = favorites.items.reduce((acc: any, item: any) => {
        const type = item.type || 'other'
        if (!acc[type]) acc[type] = []
        acc[type].push(item)
        return acc
      }, {})
      const typeNames: any = { drug: '💊 Препараты', 'local-status': '🏥 Локальные статусы', calculator: '🔢 Калькуляторы', codifier: '📋 Кодификатор', algorithm: '📚 Алгоритмы', other: '📌 Другое' }

      let message = `📌 Ваше избранное (${favorites.items.length})\n\n`
      for (const [type, items] of Object.entries(grouped)) {
        message += `${typeNames[type] || type}: ${(items as any[]).length}\n`
      }
      message += `\nВыберите категорию для просмотра:`

      const buttons: any[][] = []
      for (const [type, items] of Object.entries(grouped)) {
        const categoryName = typeNames[type] || type
        buttons.push([{ text: `${categoryName} (${(items as any[]).length})`, callback_data: `favorites_category_${type}|${chatId}` }])
      }
      buttons.push([{ text: '🌐 Открыть на сайте', url: `${siteUrl}/profile/bookmarks` }])
      buttons.push([{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }])

      if (chatId) await bot.telegram.sendMessage(chatId, message, { reply_markup: { inline_keyboard: buttons } } as any)
    } catch (error: any) {
      console.error('❌ Ошибка при получении избранного:', error)
      const chatId = ctx.chat?.id
      if (chatId) await bot.telegram.sendMessage(chatId, `❌ Ошибка при загрузке избранного\n\nИспользуйте /start для авторизации.`, { reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]] } } as any)
    }
  })

  // Обработка callback_query (все кейсы из старой логики)
  bot.on('callback_query', async (ctx: any) => {
    const query = ctx.callbackQuery
    const chatId = (query as any).message?.chat.id
    const messageId = (query as any).message?.message_id
    const data = (query as any).data
    const userId = (query as any).from?.id
    const username = (query as any).from?.username
    const firstName = (query as any).from?.first_name

    // auth_
    if (data?.startsWith('auth_')) {
      await ctx.answerCbQuery('⏳ Генерация кода...')
      if (chatId && messageId && userId && firstName) {
        try {
          const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
          let response
          if (!apiUrl || apiUrl === 'https://192.168.1.40:3000') {
            response = await generateTelegramAuthCode(String(userId), firstName, username || '')
          } else {
            response = await ofetch(`${apiUrl}/api/auth/telegram-request-code`, { method: 'POST', body: { id: userId, first_name: firstName, username: username || '' }, rejectUnauthorized: false } as any)
          }

          if (response.success) {
            storeAuthCodeWithChat(String(userId), chatId, messageId)
            storeAuthCodeForSync(String(userId), response.code)
            const loginMessage = `🔐 Код авторизации\n\nВаш код для входа на сайт:\n\n<code>${response.code}</code>\n\n⏱ Код действителен 10 минут\n\n✅ Страница ввода кода откроется автоматически в вашей вкладке браузера!\n\n💡 Нажмите на код для копирования`
            await bot.telegram.editMessageText(chatId, messageId, undefined, loginMessage, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } } as any)
          } else {
            await bot.telegram.editMessageText(chatId, messageId, undefined, `❌ Ошибка\n\n${response.message || 'Не удалось сгенерировать код. Попробуйте еще раз.'}`, { reply_markup: { inline_keyboard: [[{ text: '🔄 Попробовать снова', callback_data: `auth_${userId}` }], [{ text: '📚 Помощь', callback_data: 'help' }]] } } as any)
          }
        } catch (error: any) {
          console.error('❌ Ошибка при генерации кода:', error)
          await bot.telegram.editMessageText(chatId, messageId, undefined, '❌ Ошибка соединения\n\nНе удалось подключиться к серверу. Убедитесь, что сервер запущен и попробуйте еще раз.', { reply_markup: { inline_keyboard: [[{ text: '🔄 Попробовать снова', callback_data: `auth_${userId}` }], [{ text: '📚 Помощь', callback_data: 'help' }]] } } as any)
        }
      }
      return
    }

    // help
    if (data === 'help') {
      await ctx.answerCbQuery('⏳ Загрузка...')
      if (chatId && messageId) {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : 'https://helpsmp.ru')
        const siteUrl = apiUrl && apiUrl.startsWith('https://') ? apiUrl : 'https://helpsmp.ru'
        const helpMessage = `📚 Справочник СМП\n\n🔍 О проекте:\nСправочник СМП — это информационная система для медицинского персонала службы скорой медицинской помощи.\n\n📋 Возможности:\n• 🧪 Поиск препаратов с дозировками и показаниями\n• 🏥 Локальные статусы для дежурств\n• 📚 Алгоритмы оказания медицинской помощи\n• 🔢 Калькуляторы для расчета доз\n• ⭐ Избранное для быстрого доступа\n\n🌐 Для доступа к полному функционалу перейдите на сайт и авторизуйтесь через /start.\n\n📱 Используйте кнопки меню для навигации.`
        await bot.telegram.editMessageText(chatId, messageId, undefined, helpMessage, { reply_markup: { inline_keyboard: [[{ text: '📚 Алгоритмы', url: `${siteUrl}/algorithms/adults` }],[{ text: '💊 Препараты', url: `${siteUrl}/drugs` }, { text: '🔢 Калькуляторы', url: `${siteUrl}/calculators` }],[{ text: '📋 Кодификатор', url: `${siteUrl}/codifier` }, { text: '🏥 Дежурства', url: `${siteUrl}/substations` }],[{ text: '◀️ Назад', callback_data: 'help_back' }]] } } as any)
      }
      return
    }

    if (data === 'help_back') {
      await ctx.answerCbQuery('⏳ Загрузка...')
      if (chatId && messageId) {
        try {
          const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
          if (!apiUrl) return
          const check = await checkTelegramAuthDirect(String(userId))
          const isRegistered = check?.authenticated || false
          let hasActiveSession = false
          if (isRegistered && userId) {
            const { checkActiveSessionByTelegramId } = await import('~/server/utils/telegram-auth-helpers')
            hasActiveSession = await checkActiveSessionByTelegramId(String(userId))
          }

          if (hasActiveSession) {
            await bot.telegram.editMessageText(chatId, messageId, undefined, `👋 Привет!\n\n✅ Вы уже авторизованы в системе.\n\nДоступные команды:\n/favorites - Показать избранное\n/help - Справка\n\nИли выберите действие:`, { reply_markup: { inline_keyboard: [[{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }],[{ text: '📚 Помощь', callback_data: 'help' }]] } } as any)
          } else {
            await bot.telegram.editMessageText(chatId, messageId, undefined, `👋 Привет!\n\n🔐 Для доступа к полному функционалу необходимо авторизоваться на сайте.\n\nИспользуйте /start для авторизации.`, { reply_markup: { inline_keyboard: [[{ text: '🔐 Получить код авторизации', callback_data: `auth_${userId}` }],[{ text: '📚 Помощь', callback_data: 'help' }]] } } as any)
          }
        } catch (error) {
          console.error('❌ Ошибка:', error)
          await bot.telegram.editMessageText(chatId, messageId, undefined, `👋 Привет!\n\nИспользуйте команды:\n/start - Начать работу\n/favorites - Избранное\n/help - Помощь`)
        }
      }
      return
    }

    if (data?.startsWith('favorites_category_') && data !== 'favorites_category_all') {
      await ctx.answerCbQuery('⏳ Загрузка...')
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        const siteUrl = apiUrl && apiUrl.startsWith('https://') ? apiUrl : 'https://helpsmp.ru'
        if (!apiUrl) {
          if (chatId) await bot.telegram.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
          return
        }
        const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, { method: 'GET', rejectUnauthorized: false } as any)
        if (!userCheck?.user) {
          if (chatId && messageId) await bot.telegram.editMessageText(chatId, messageId, undefined, '❌ Вы не авторизованы')
          return
        }
        const favorites = await ofetch(`${apiUrl}/api/bookmarks`, { method: 'GET', query: { userId: userCheck.user._id }, rejectUnauthorized: false } as any)
        if (!favorites?.items || favorites.items.length === 0) {
          if (chatId && messageId) await bot.telegram.editMessageText(chatId, messageId, undefined, '📌 У вас пока нет избранного')
          return
        }
        const match = (data as string).match(/^favorites_category_(.+?)\|(.+)$/)
        const categoryType = match ? match[1] : ''
        const buttons: any[][] = []
        const categoryItems = favorites.items.filter((item: any) => item.type === categoryType)
        if (categoryType === 'calculator') {
          for (const item of categoryItems) {
            const title = (item.title || item.name || 'Без названия').substring(0, 40)
            let url = item.url || ''
            if (url && !url.startsWith('http')) {
              url = `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`
            }
            if (!url || url.startsWith('http://')) url = `${siteUrl}/calculators`
            buttons.push([{ text: title, url }])
          }
        } else {
          categoryItems.slice(0, 5).forEach((item: any) => {
            const title = (item.title || item.name || 'Без названия').substring(0, 30)
            const bookmarkId = item._id || item.id || ''
            buttons.push([{ text: title, callback_data: `favorites_item_${bookmarkId}|${chatId}|${categoryType}` }])
          })
        }
        buttons.push([{ text: '◀️ Назад', callback_data: `favorites_back_categories|${chatId}` }])

        let message = `📌 ${(categoryType)}: ${categoryItems.length} закладок\n\n`
        categoryItems.slice(0, 10).forEach((item: any, i: number) => {
          const title = item.title || item.name || 'Без названия'
          message += `${i + 1}. ${title}\n`
        })
        if (chatId && messageId) await bot.telegram.editMessageText(chatId, messageId, undefined, message, { reply_markup: { inline_keyboard: buttons } } as any)
      } catch (error) {
        console.error('❌ Ошибка при загрузке категории:', error)
      }
      return
    }

    if (data === 'show_favorites' || data === 'favorites_category_all') {
      await ctx.answerCbQuery('⏳ Загрузка...')
      if (!chatId) return
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        const siteUrl = apiUrl && apiUrl.startsWith('https://') ? apiUrl : 'https://helpsmp.ru'
        if (!apiUrl) {
          await bot.telegram.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
          return
        }
        const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, { method: 'GET', rejectUnauthorized: false } as any)
        if (!userCheck?.user) {
          const kb = { reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]] } } as any
          if (messageId) {
            await bot.telegram.editMessageText(chatId, messageId, undefined, '❌ Вы не авторизованы\n\nНеобходимо авторизоваться для доступа к избранному.', kb)
          } else {
            await bot.telegram.sendMessage(chatId, '❌ Вы не авторизованы\n\nНеобходимо авторизоваться для доступа к избранному.', kb)
          }
          return
        }
        const favorites = await ofetch(`${apiUrl}/api/bookmarks`, { method: 'GET', query: { userId: userCheck.user._id }, rejectUnauthorized: false } as any)
        if (!favorites?.items || favorites.items.length === 0) {
          const emptyMsg = `📌 У вас пока нет избранного\n\nДобавьте закладки на сайте для использования функционала избранного.`
          const kb = { reply_markup: { inline_keyboard: [[{ text: '🌐 Открыть сайт', url: `${siteUrl}/profile/bookmarks` }],[{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]] } } as any
          if (messageId) {
            await bot.telegram.editMessageText(chatId, messageId, undefined, emptyMsg, kb)
          } else {
            await bot.telegram.sendMessage(chatId, emptyMsg, kb)
          }
          return
        }

        const grouped = favorites.items.reduce((acc: any, item: any) => {
          const type = item.type || 'other'
          if (!acc[type]) acc[type] = []
          acc[type].push(item)
          return acc
        }, {})
        const typeNames: any = { drug: '💊 Препараты', 'local-status': '🏥 Локальные статусы', calculator: '🔢 Калькуляторы', codifier: '📋 Кодификатор', algorithm: '📚 Алгоритмы', other: '📌 Другое' }

        let message = `📌 Ваше избранное (${favorites.items.length})\n\n`
        for (const [type, items] of Object.entries(grouped)) {
          message += `${typeNames[type] || type}: ${(items as any[]).length}\n`
        }
        message += `\nВыберите категорию для просмотра:`

        const buttons: any[][] = []
        for (const [type, items] of Object.entries(grouped)) {
          const categoryName = typeNames[type] || type
          buttons.push([{ text: `${categoryName} (${(items as any[]).length})`, callback_data: `favorites_category_${type}|${chatId}` }])
        }
        buttons.push([{ text: '🌐 Открыть на сайте', url: `${siteUrl}/profile/bookmarks` }])
        buttons.push([{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }])

        if (messageId) {
          await bot.telegram.editMessageText(chatId, messageId, undefined, message, { reply_markup: { inline_keyboard: buttons } } as any)
        } else {
          await bot.telegram.sendMessage(chatId, message, { reply_markup: { inline_keyboard: buttons } } as any)
        }
      } catch (error) {
        console.error('❌ Ошибка:', error)
        const errorMsg = '❌ Ошибка при загрузке избранного'
        const kb = { reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }]] } } as any
        if (messageId) {
          await bot.telegram.editMessageText(chatId, messageId, undefined, errorMsg, kb)
        } else {
          await bot.telegram.sendMessage(chatId, errorMsg, kb)
        }
      }
      return
    }

    if (data?.startsWith('favorites_item_')) {
      await ctx.answerCbQuery('⏳ Загрузка...')
      if (!chatId || !userId || !messageId) return
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        const siteUrl = apiUrl && apiUrl.startsWith('https://') ? apiUrl : 'https://helpsmp.ru'
        if (!apiUrl) {
          await bot.telegram.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
          return
        }
        const match = (data as string).match(/^favorites_item_(.+?)\|(.+)$/)
        const bookmarkId = match ? match[1] : ''
        const originalChatId = match ? match[2] : ''
        const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, { method: 'GET', rejectUnauthorized: false } as any)
        if (!userCheck?.user) return
        const favorites = await ofetch(`${apiUrl}/api/bookmarks`, { method: 'GET', query: { userId: userCheck.user._id }, rejectUnauthorized: false } as any)
        if (!favorites?.items) return
        const bookmark = favorites.items.find((item: any) => item._id === bookmarkId || item.id === bookmarkId)
        if (!bookmark) {
          await bot.telegram.editMessageText(chatId, messageId, undefined, '❌ Закладка не найдена')
          return
        }

        let message = `<b>${bookmark.title}</b>`
        if (bookmark.type === 'codifier') {
          if (bookmark.description) message += `\n\n${bookmark.description}`
          if (bookmark.code) message += `\n\n<b>Код:</b> ${bookmark.code}`
          if (bookmark.mkbCode) message += `\n<b>Код МКБ:</b> ${bookmark.mkbCode}`
          if (bookmark.stationCode) message += `\n<b>Код станции:</b> ${bookmark.stationCode}`
          if (bookmark.category) message += `\n\n<i>Категория: ${bookmark.category}</i>`
        }
        if (bookmark.type === 'local-status') {
          if (bookmark.complaints) message += `\n\n<b>Жалобы:</b>\n${bookmark.complaints.replace(/\*\*(.+?)\*\*/g, '<b>$1<\/b>').replace(/\*(.+?)\*/g, '<i>$1<\/i>')}`
          if (bookmark.anamnesis) message += `\n\n<b>Анамнез:</b>\n${bookmark.anamnesis.replace(/\*\*(.+?)\*\*/g, '<b>$1<\/b>').replace(/\*(.+?)\*/g, '<i>$1<\/i>')}`
          if (bookmark.localis) message += `\n\n<b>Status localis:</b>\n${bookmark.localis.replace(/\*\*(.+?)\*\*/g, '<b>$1<\/b>').replace(/\*(.+?)\*/g, '<i>$1<\/i>')}`
          if (bookmark.category) message += `\n\n<i>Категория: ${bookmark.category}</i>`
        }
        if (bookmark.type === 'calculator' && bookmark.description) {
          message += `\n\n${bookmark.description}`
        }

        let url = bookmark.url || ''
        if (url && !url.startsWith('http')) url = `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`
        if (!url || url.startsWith('http://')) url = `${siteUrl}/profile/bookmarks`

        const buttons: any[][] = [
          [{ text: '🌐 Посмотреть на сайте', url }],
          [{ text: '◀️ Назад', callback_data: `favorites_category_${bookmark.type}|${originalChatId}` }]
        ]

        await bot.telegram.editMessageText(chatId, messageId, undefined, message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } } as any)
      } catch (error) {
        console.error('❌ Ошибка:', error)
        await bot.telegram.editMessageText(chatId, messageId, undefined, '❌ Ошибка при загрузке закладки')
      }
      return
    }

    if (data?.startsWith('favorites_back_categories|')) {
      await ctx.answerCbQuery('⏳ Загрузка...')
      try {
        const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
        if (!apiUrl) {
          if (chatId) await bot.telegram.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
          return
        }
        const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, { method: 'GET', rejectUnauthorized: false } as any)
        if (!userCheck?.user) return
        const favorites = await ofetch(`${apiUrl}/api/bookmarks`, { method: 'GET', query: { userId: userCheck.user._id }, rejectUnauthorized: false } as any)
        if (!favorites?.items) return
        const grouped = favorites.items.reduce((acc: any, item: any) => { const t = item.type || 'other'; (acc[t] ||= []).push(item); return acc }, {})
        const typeNames: any = { drug: '💊 Препараты', 'local-status': '🏥 Локальные статусы', calculator: '🔢 Калькуляторы', codifier: '📋 Кодификатор', algorithm: '📚 Алгоритмы', other: '📌 Другое' }
        let message = `📌 Ваше избранное (${favorites.items.length})\n\n`
        for (const [type, items] of Object.entries(grouped)) message += `${typeNames[type] || type}: ${(items as any[]).length}\n`
        message += `\nВыберите категорию для просмотра:`
        const buttons: any[][] = []
        for (const [type, items] of Object.entries(grouped)) {
          const categoryName = typeNames[type] || type
          buttons.push([{ text: `${categoryName} (${(items as any[]).length})`, callback_data: `favorites_category_${type}|${chatId}` }])
        }
        buttons.push([{ text: '🌐 Открыть на сайте', url: `${siteUrl}/profile/bookmarks` }])
        buttons.push([{ text: '◀️ Назад', callback_data: `favorites_back|${chatId}` }])
        if (chatId && messageId) await bot.telegram.editMessageText(chatId, messageId, undefined, message, { reply_markup: { inline_keyboard: buttons } } as any)
      } catch (error) {
        console.error('❌ Ошибка:', error)
      }
      return
    }

    if (data?.startsWith('favorites_back|')) {
      await ctx.answerCbQuery('⏳ Загрузка...')
      if (chatId && userId && messageId) {
        try {
          const apiUrl = process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'https://192.168.1.40:3000' : '')
          if (!apiUrl) {
            await bot.telegram.sendMessage(chatId, '❌ Ошибка конфигурации сервера')
            return
          }
          const userCheck = await ofetch(`${apiUrl}/api/auth/find-by-telegram/${userId}`, { method: 'GET', rejectUnauthorized: false } as any).catch(() => null)
          if (!userCheck?.user) {
            await bot.telegram.editMessageText(chatId, messageId, undefined, `👋 Добро пожаловать в справочник СМП!\n\n🔐 Для доступа к полному функционалу необходимо авторизоваться.\n\nДоступные команды:\n/start - Начать работу\n/favorites - Избранное\n/help - Помощь`, { reply_markup: { inline_keyboard: [[{ text: '🔐 Авторизоваться через Telegram', callback_data: `auth_${userId}` }],[{ text: '📚 Помощь', callback_data: 'help' }]] } } as any)
            return
          }
          await bot.telegram.editMessageText(chatId, messageId, undefined, `👋 Добро пожаловать в справочник СМП!\n\n✅ Вы уже авторизованы в системе.\n\nДоступные команды:\n/favorites - Показать избранное\n/help - Справка\n\nИли выберите действие:`, { reply_markup: { inline_keyboard: [[{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }],[{ text: '📚 Помощь', callback_data: 'help' }]] } } as any)
        } catch (error) {
          console.error('❌ Ошибка:', error)
        }
      }
      return
    }
  })
}

export default bot
