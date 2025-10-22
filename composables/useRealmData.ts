import Dexie, { Table } from 'dexie'

export function useRealm() {
  const nuxtApp = useNuxtApp()
  const realm = nuxtApp.$realm
  return realm
}

// Типы локального кэша и очереди
interface SnapshotEntry<T = any> {
  key: string // `${db}.${collection}`
  data: T[]
  updatedAt: number
}

interface QueuedRealmMutation {
  id?: number
  db: string
  collection: string
  op: 'insertOne' | 'updateOne'
  filter?: Record<string, any>
  document?: Record<string, any>
  update?: Record<string, any>
  createdAt: number
}

class RealmDexieDB extends Dexie {
  snapshots!: Table<SnapshotEntry, string>
  mutations!: Table<QueuedRealmMutation, number>
  constructor() {
    super('smp_help_realm')
    this.version(1).stores({
      snapshots: 'key, updatedAt',
      mutations: '++id, createdAt'
    })
  }
}

const realmDB = new RealmDexieDB()

function buildKey(db: string, collection: string) {
  return `${db}.${collection}`
}

async function flushRealmQueue(getCollection: (db: string, collection: string) => any) {
  if (!navigator.onLine) return
  const items = await realmDB.mutations.orderBy('createdAt').toArray()
  for (const it of items) {
    try {
      const col = getCollection(it.db, it.collection)
      if (it.op === 'insertOne' && it.document) {
        await col.insertOne(it.document)
      } else if (it.op === 'updateOne' && it.filter && it.update) {
        await col.updateOne(it.filter, it.update, { upsert: true })
      }
      if (it.id != null) await realmDB.mutations.delete(it.id)
    } catch {
      break
    }
  }
}

// Чтение: снапшот коллекции с кэшированием (по умолчанию вся коллекция)
export function useRealmRead(dbName = 'smp-help') {
  const realm = useRealm()

  async function getCollectionSnapshot<T = any>(collectionName: string, query: Record<string, any> = {}, options: { projection?: Record<string, 0 | 1>; limit?: number } = {}) {
    const key = buildKey(dbName, collectionName)

    // Офлайн: вернуть кэш если есть
    if (!navigator.onLine) {
      const cached = await realmDB.snapshots.get(key)
      return (cached?.data as T[]) || []
    }

    // Онлайн: получить из Remote MongoDB, обновить кэш
    try {
      const col = realm.getCollection(dbName, collectionName)
      const docs: T[] = await col.find(query, { projection: options.projection, limit: options.limit ?? 1000 })
      await realmDB.snapshots.put({ key, data: docs, updatedAt: Date.now() })
      return docs
    } catch (e) {
      // При ошибке сети/доступа отдать кэш
      const cached = await realmDB.snapshots.get(key)
      if (cached) return cached.data as T[]
      throw e
    }
  }

  return { getCollectionSnapshot }
}

// Запись: upsert документ с поддержкой офлайн-очереди
export function useRealmWrite(dbName = 'smp-help') {
  const realm = useRealm()

  async function upsertOne(collectionName: string, doc: Record<string, any>) {
    const col = realm.getCollection(dbName, collectionName)

    // Определяем, есть ли идентификатор
    const hasId = doc && (doc._id != null)

    // Офлайн — кладём в очередь
    if (!navigator.onLine) {
      if (hasId) {
        await realmDB.mutations.add({
          db: dbName,
          collection: collectionName,
          op: 'updateOne',
          filter: { _id: doc._id },
          update: { $set: doc },
          createdAt: Date.now()
        })
      } else {
        await realmDB.mutations.add({
          db: dbName,
          collection: collectionName,
          op: 'insertOne',
          document: doc,
          createdAt: Date.now()
        })
      }
      return { queued: true }
    }

    // Онлайн — выполняем сразу
    try {
      if (hasId) {
        const res = await col.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true })
        return { ok: true, result: res }
      } else {
        const res = await col.insertOne(doc)
        return { ok: true, result: res }
      }
    } catch (e) {
      // При сбое — положим в очередь (best-effort)
      try {
        if (hasId) {
          await realmDB.mutations.add({
            db: dbName,
            collection: collectionName,
            op: 'updateOne',
            filter: { _id: doc._id },
            update: { $set: doc },
            createdAt: Date.now()
          })
        } else {
          await realmDB.mutations.add({
            db: dbName,
            collection: collectionName,
            op: 'insertOne',
            document: doc,
            createdAt: Date.now()
          })
        }
        return { queued: true }
      } catch {
        throw e
      }
    }
  }

  // Авто-реплей очереди при восстановлении сети
  if (process.client) {
    const tryFlush = () => flushRealmQueue(realm.getCollection).catch(() => {})
    window.addEventListener('online', tryFlush)
    setInterval(tryFlush, 30_000)
  }

  return { upsertOne }
}

