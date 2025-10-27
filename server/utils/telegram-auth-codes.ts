// Централизованное хранилище кодов авторизации
// В production рекомендуется использовать Redis

interface AuthCode {
  userId: string
  telegramId: string
  code: string
  expires: number
  chatId?: number  // Для отправки обновленного сообщения
  messageId?: number  // Для обновления сообщения
}

const authCodes = new Map<string, AuthCode>() // telegramId -> AuthCode
const codesByCode = new Map<string, string>() // code -> telegramId

// Отдельное хранилище для pending кодов (синхронизация)
interface PendingCode {
  telegramId: string
  code: string
  timestamp: number
}

const pendingCodesMap = new Map<string, PendingCode>()

export function storeAuthCode(telegramId: string, userId: string, code: string, expiresInSeconds: number = 600, chatId?: number, messageId?: number): void {
  const expires = Date.now() + expiresInSeconds * 1000
  
  // Очищаем старые коды
  cleanupExpiredCodes()
  
  authCodes.set(telegramId, {
    userId,
    telegramId,
    code,
    expires,
    chatId,
    messageId
  })
  
  // Сохраняем обратную связь code -> telegramId
  codesByCode.set(code, telegramId)
}

export function storeAuthCodeWithChat(telegramId: string, chatId: number, messageId: number): void {
  console.log('💾 storeAuthCodeWithChat вызывается:', { telegramId, chatId, messageId })
  
  // Обновляем существующий код, добавляя chatId и messageId
  const existing = authCodes.get(telegramId)
  console.log('💾 Существующий код найден:', !!existing)
  
  if (existing) {
    existing.chatId = chatId
    existing.messageId = messageId
    authCodes.set(telegramId, existing)
    console.log('💾 Код обновлен с chatId и messageId')
  } else {
    console.error('❌ Существующий код не найден для telegramId:', telegramId)
  }
}

export function storeAuthCodeForSync(telegramId: string, code: string): void {
  console.log('💾 Сохраняем код для синхронизации:', { telegramId, code })
  
  // Сохраняем код в Map
  pendingCodesMap.set(telegramId, {
    telegramId,
    code,
    timestamp: Date.now()
  })
  
  // Очищаем старые коды (старше 1 минуты)
  const now = Date.now()
  for (const [key, value] of pendingCodesMap.entries()) {
    if (now - value.timestamp > 60000) {
      pendingCodesMap.delete(key)
    }
  }
  
  console.log('💾 Всего pending кодов:', pendingCodesMap.size)
}

export function getAllPendingCodes(): PendingCode[] {
  console.log('📋 Проверяем pending коды, всего в Map:', pendingCodesMap.size)
  
  if (pendingCodesMap.size > 0) {
    console.log('📋 Содержимое Map:')
    for (const [key, value] of pendingCodesMap.entries()) {
      console.log(`  Key: ${key}, Code: ${value.code}, Timestamp: ${value.timestamp}`)
    }
  }
  
  // Очищаем старые коды
  const now = Date.now()
  for (const [key, value] of pendingCodesMap.entries()) {
    console.log(`  Код: ${value.code}, возраст: ${now - value.timestamp}ms`)
    if (now - value.timestamp > 60000) {
      pendingCodesMap.delete(key)
      console.log(`  Удален старый код: ${value.code}`)
    }
  }
  
  const result = Array.from(pendingCodesMap.values())
  console.log(`📋 Возвращаем ${result.length} кодов`)
  
  if (result.length > 0) {
    console.log('📋 Коды:', result.map(c => ({ telegramId: c.telegramId, code: c.code })))
  }
  
  return result
}

export function removePendingCode(telegramId: string, code: string): void {
  pendingCodesMap.delete(telegramId)
}

export function getAuthCodeWithChat(telegramId: string): AuthCode | null {
  cleanupExpiredCodes()
  return authCodes.get(telegramId) || null
}

export function getAuthCode(telegramId: string): AuthCode | null {
  cleanupExpiredCodes()
  return authCodes.get(telegramId) || null
}

export function getAuthCodeByCode(code: string): { telegramId: string; userId: string } | null {
  cleanupExpiredCodes()
  const telegramId = codesByCode.get(code)
  if (!telegramId) return null
  
  const authCode = authCodes.get(telegramId)
  if (!authCode) return null
  
  return {
    telegramId,
    userId: authCode.userId
  }
}

export function removeAuthCode(telegramId: string): void {
  const authCode = authCodes.get(telegramId)
  if (authCode) {
    codesByCode.delete(authCode.code)
    authCodes.delete(telegramId)
  }
}

export function removeAuthCodeByCode(code: string): void {
  const telegramId = codesByCode.get(code)
  if (telegramId) {
    codesByCode.delete(code)
    authCodes.delete(telegramId)
  }
}

function cleanupExpiredCodes(): void {
  const now = Date.now()
  for (const [key, value] of authCodes.entries()) {
    if (value.expires < now) {
      codesByCode.delete(value.code)
      authCodes.delete(key)
    }
  }
}

// Периодическая очистка (раз в минуту)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCodes, 60 * 1000)
}

