import Dexie from 'dexie'

type CachedResponse = {
  url: string
  method: string
  status: number
  headers: Record<string, string>
  body: string
  updatedAt: number
}

type QueuedMutation = {
  id?: number
  url: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  createdAt: number
}

class OfflineDB extends Dexie {
  responses!: Dexie.Table<CachedResponse, string>
  mutations!: Dexie.Table<QueuedMutation, number>
  constructor() {
    super('smp_help_offline')
    this.version(1).stores({
      responses: 'url, method, updatedAt',
      mutations: '++id, createdAt'
    })
  }
}

const db = new OfflineDB()

async function toObject(headers: Headers): Promise<Record<string, string>> {
  const o: Record<string, string> = {}
  headers.forEach((v, k) => { o[k] = v })
  return o
}

async function cloneResponse(resp: Response): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const cloned = resp.clone()
  const body = await cloned.text()
  const headers = await toObject(cloned.headers)
  return { status: cloned.status, headers, body }
}

async function buildResponse(entry: CachedResponse): Promise<Response> {
  return new Response(entry.body, { status: entry.status, headers: entry.headers })
}

async function flushQueue() {
  const items = await db.mutations.orderBy('createdAt').toArray()
  for (const it of items) {
    try {
      await fetch(it.url, {
        method: it.method,
        headers: { 'content-type': 'application/json', ...(it.headers || {}) },
        body: it.body != null ? JSON.stringify(it.body) : undefined
      })
      if (it.id != null) await db.mutations.delete(it.id)
    } catch {
      // останется в очереди
      break
    }
  }
}

export default defineNuxtPlugin(() => {
  const originalFetch = window.fetch.bind(window)

  // Периодическая попытка отправки очереди
  const tryFlush = () => { flushQueue().catch(() => {}) }
  window.addEventListener('online', tryFlush)
  setInterval(tryFlush, 30_000)

  // Переопределяем fetch
  // - GET: при офлайне отдаём кэш; при онлайне — обновляем кэш
  // - Мутации: при офлайне добавляем в очередь и возвращаем 202
  //   при онлайне — обычный запрос
  // Не кэшируем auth и бинарные
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = String((init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET')) || 'GET').toUpperCase()

    const isGet = method === 'GET'
    const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
    const isAuth = url.includes('/api/auth/')
    const isBinary = (init?.headers && typeof init.headers === 'object' && String((init.headers as any)['content-type'] || '').includes('multipart'))

    const isOnline = navigator.onLine

    // Офлайн поведение
    if (!isOnline) {
      if (isGet && !isAuth && !isBinary) {
        const cached = await db.responses.get(url)
        if (cached) return buildResponse(cached)
        // Фолбэк 503, если нет кэша
        return new Response('Offline', { status: 503 })
      }
      if (isMutation && !isAuth && !isBinary) {
        // Кладём в очередь и имитируем 202
        const payload: QueuedMutation = {
          url,
          method: method as any,
          headers: (init?.headers as any) || {},
          body: init?.body ? (() => { try { return JSON.parse(String(init.body)) } catch { return String(init.body) } })() : undefined,
          createdAt: Date.now()
        }
        await db.mutations.add(payload)
        return new Response(JSON.stringify({ queued: true }), { status: 202, headers: { 'content-type': 'application/json' } })
      }
    }

    // Онлайн — обычный запрос c кэшированием GET
    try {
      const resp = await originalFetch(input as any, init)
      if (isGet && !isAuth && !isBinary && resp.ok) {
        const cloned = await cloneResponse(resp)
        await db.responses.put({ url, method, ...cloned, updatedAt: Date.now() })
      }
      if (isMutation && resp.ok) {
        // после успешной мутации пробуем отправить очередь
        tryFlush()
      }
      return resp
    } catch (e) {
      // При ошибке сети — отдаём кэш если есть
      if (isGet) {
        const cached = await db.responses.get(url)
        if (cached) return buildResponse(cached)
      }
      throw e
    }
  }) as typeof window.fetch
})



