// GigaChat AI Integration
// Документация: https://developers.sber.ru/docs/ru/gigachat/overview

interface GigaChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GigaChatRequest {
  model: string
  messages: GigaChatMessage[]
  max_tokens?: number
  temperature?: number
}

interface GigaChatResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class GigaChatAI {
  private apiKey: string
  private clientId: string
  private scope: string
  private baseUrl: string = 'https://gigachat.devices.sberbank.ru/api/v1'
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(apiKey: string, clientId?: string, scope?: string) {
    this.apiKey = apiKey
    this.clientId = clientId || ''
    this.scope = scope || 'GIGACHAT_API_PERS'
  }

  // Получение токена доступа
  private async getAccessToken(): Promise<string> {
    // Если токен еще действителен, используем его
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      // Создаем fetch с игнорированием SSL ошибок для российских сервисов
      console.log('🔑 GigaChat: Подготавливаю авторизацию...')
      console.log('📋 GigaChat: Scope:', this.scope)
      console.log('🔐 GigaChat: API Key (первые 20 символов):', this.apiKey.substring(0, 20) + '...')
      
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': crypto.randomUUID(),
          'Authorization': `Basic ${this.apiKey}`  // API ключ уже в формате base64
        },
        body: new URLSearchParams({
          scope: this.scope
        }).toString()
      }

      // В Node.js окружении добавляем игнорирование SSL
      if (typeof process !== 'undefined' && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
        console.log('🔧 GigaChat: Настраиваем SSL для российских сервисов...')
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
      }

      const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ GigaChat: Детали ошибки авторизации:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          apiKey: this.apiKey.substring(0, 20) + '...',
          scope: this.scope
        })
        throw new Error(`Ошибка получения токена: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // -1 минута для безопасности

      console.log('✅ GigaChat: Получен новый токен доступа')
      return this.accessToken
    } catch (error) {
      console.error('❌ GigaChat: Ошибка получения токена:', error)
      throw error
    }
  }

  // Основной метод для отправки запросов
  async run(model: string = 'GigaChat', options: { prompt: string; max_tokens?: number }): Promise<any> {
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const accessToken = await this.getAccessToken()
      
        const messages: GigaChatMessage[] = [
          {
            role: 'system',
            content: 'Ты - дружелюбный помощник СМП. Отвечай живо и естественно, но используй ТОЛЬКО данные из БД. Поддерживай беседу, добавляй контекст, но не выдумывай факты. Для подстанций - точность номеров критична!'
          },
          {
            role: 'user',
            content: options.prompt
          }
        ]

      const requestBody: GigaChatRequest = {
        model: model,
        messages: messages,
        max_tokens: options.max_tokens || 2000,
        temperature: 0.1  // Минимальная температура для строгих фактических ответов
      }

      console.log('🚀 GigaChat: Отправляю запрос...')

      // Убеждаемся, что SSL настроен
      if (typeof process !== 'undefined' && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ GigaChat: Детали ошибки API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          promptLength: options.prompt.length
        })
        throw new Error(`Ошибка GigaChat API: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data: GigaChatResponse = await response.json()
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('GigaChat не вернул ответ')
      }

      const aiResponse = data.choices[0].message.content

      console.log('✅ GigaChat: Получен ответ')
      console.log('📊 GigaChat: Использовано токенов:', data.usage?.total_tokens || 'неизвестно')

      return {
        response: aiResponse,
        usage: data.usage,
        success: true
      }

      } catch (error: any) {
        retryCount++
        console.error(`❌ GigaChat: Попытка ${retryCount}/${maxRetries} неудачна:`, error.message)
        
        if (retryCount >= maxRetries) {
          console.error('❌ GigaChat: Все попытки исчерпаны')
          throw error
        }
        
        // Ждем перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
        console.log(`🔄 GigaChat: Повторная попытка ${retryCount + 1}/${maxRetries}...`)
      }
    }
  }

  // Проверка доступности сервиса
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken()
      return true
    } catch (error) {
      return false
    }
  }
}

// Фабричная функция для создания экземпляра GigaChat
export function createGigaChatAI(apiKey?: string, clientId?: string, scope?: string): GigaChatAI | null {
  if (!apiKey) {
    console.log('⚠️ GigaChat: API ключ не предоставлен')
    return null
  }

  try {
    return new GigaChatAI(apiKey, clientId, scope)
  } catch (error) {
    console.error('❌ GigaChat: Ошибка создания экземпляра:', error)
    return null
  }
}

// Экспорт для использования в API
export function gigaChatAI() {
  const runtimeConfig = useRuntimeConfig()
  const apiKey = runtimeConfig.gigachatApiKey
  const clientId = runtimeConfig.gigachatClientId
  const scope = runtimeConfig.gigachatScope
  
  if (!apiKey) {
    throw new Error('GigaChat API ключ не настроен')
  }
  
  return createGigaChatAI(apiKey, clientId, scope)
}
