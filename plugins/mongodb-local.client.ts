// plugins/mongodb-local.client.ts
import Dexie from 'dexie'

// Локальная база данных для офлайн-режима
interface CachedDocument {
  _id: string
  collection: string
  data: any
  updatedAt: number
}

interface QueuedMutation {
  id?: number
  collection: string
  operation: 'insert' | 'update' | 'delete'
  data: any
  createdAt: number
}

class LocalDB extends Dexie {
  documents!: Dexie.Table<CachedDocument, string>
  mutations!: Dexie.Table<QueuedMutation, number>
  
  constructor() {
    super('smp-help-local')
    this.version(1).stores({
      documents: '_id, collection, updatedAt',
      mutations: '++id, createdAt'
    })
  }
}

const localDB = new LocalDB()

export default defineNuxtPlugin(() => {
  // ВРЕМЕННО ОТКЛЮЧЕНО: Плагин локальной БД замедляет загрузку приложения
  console.log('🔧 MongoDB local plugin disabled for performance')
  return {
    provide: {
      localDB: {
        cacheDocument: () => Promise.resolve(),
        getCachedDocuments: () => Promise.resolve([]),
        queueMutation: () => Promise.resolve(),
        flushMutations: () => Promise.resolve()
      }
    }
  }

  // const runtimeConfig = useRuntimeConfig()
  
          // Определяем базовый URL для API
          const getApiUrl = () => {
            if (process.client) {
              // Проверяем hostname для определения среды
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              
                      if (isLocalhost) {
                        // Localhost (Capacitor) - используем IP хоста с HTTP
                        return 'http://192.168.1.40:3000'
                      } else {
                        // Продакшен - используем helpsmp.ru
                        return 'https://helpsmp.ru'
                      }
            }
            return runtimeConfig.public.apiUrl || '/api'
          }

  // Локальные методы для работы с данными
  const localMethods = {
    // Кэширование документа
    async cacheDocument(collection: string, document: any) {
      await localDB.documents.put({
        _id: document._id || document.id,
        collection,
        data: document,
        updatedAt: Date.now()
      })
    },

    // Получение кэшированных документов
    async getCachedDocuments(collection: string, query: any = {}) {
      const docs = await localDB.documents
        .where('collection')
        .equals(collection)
        .toArray()
      
      return docs.map(doc => doc.data)
    },

    // Добавление мутации в очередь
    async queueMutation(collection: string, operation: string, data: any) {
      await localDB.mutations.add({
        collection,
        operation: operation as any,
        data,
        createdAt: Date.now()
      })
    },

    // Отправка очереди мутаций
    async flushMutations() {
      if (!navigator.onLine) return
      
      const mutations = await localDB.mutations.orderBy('createdAt').toArray()
      
      for (const mutation of mutations) {
        try {
          // Отправка на локальный API с правильным URL
          const apiUrl = getApiUrl()
          const response = await fetch(`${apiUrl}/api/${mutation.collection}`, {
            method: mutation.operation === 'insert' ? 'POST' : 
                   mutation.operation === 'update' ? 'PUT' : 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mutation.data)
          })
          
          if (response.ok) {
            await localDB.mutations.delete(mutation.id!)
          }
        } catch (error) {
          console.error('Ошибка отправки мутации:', error)
          break
        }
      }
    }
  }

  // Автоматическая отправка очереди при восстановлении сети
  if (process.client) {
    window.addEventListener('online', () => {
      localMethods.flushMutations()
    })
    
    // Периодическая отправка
    setInterval(() => {
      localMethods.flushMutations()
    }, 30000)
  }

  return {
    provide: {
      localDB: localMethods
    }
  }
})

