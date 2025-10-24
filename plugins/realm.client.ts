import * as Realm from 'realm-web'

export default defineNuxtPlugin(() => {
  // ВРЕМЕННО ОТКЛЮЧЕНО: Плагин Realm замедляет загрузку приложения
  console.log('🔧 Realm plugin disabled for performance')
  return {
    provide: {
      realm: {
        app: computed(() => null),
        currentUser: ref(null),
        isLoggedIn: computed(() => false),
        loginWithJwt: () => Promise.resolve(),
        loginAnonymous: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        ensureSubscriptions: () => Promise.resolve(),
        mongoClient: computed(() => null),
        getDb: () => null,
        getCollection: () => null,
      },
    },
  }

  // const runtimeConfig = useRuntimeConfig()
  const appId = runtimeConfig.public.realmAppId

  const app = computed(() => {
    if (!appId) return null
    // Keep a singleton per client
    // @ts-ignore attach to window for debugging (dev only)
    if (process.client && !(window as any).__realmApp) {
      ;(window as any).__realmApp = new Realm.App({ id: appId })
    }
    return (process.client ? (window as any).__realmApp : new Realm.App({ id: appId })) as Realm.App
  })

  const currentUser = ref<Realm.User | null>(null)
  const isLoggedIn = computed(() => !!currentUser.value)

  async function loginWithJwt(jwt?: string) {
    if (!app.value) throw new Error('Realm AppId не задан. Установите PUBLIC_REALM_APP_ID')
    if (!jwt) return loginAnonymous()
    const credentials = Realm.Credentials.jwt(jwt)
    const user = await app.value.logIn(credentials)
    currentUser.value = user
    return user
  }

  async function loginAnonymous() {
    if (!app.value) throw new Error('Realm AppId не задан. Установите PUBLIC_REALM_APP_ID')
    const credentials = Realm.Credentials.anonymous()
    const user = await app.value.logIn(credentials)
    currentUser.value = user
    return user
  }

  async function logout() {
    if (app.value && app.value.currentUser) {
      await app.value.currentUser.logOut()
      currentUser.value = null
    }
  }

  // Remote MongoDB client
  const mongoClient = computed(() => {
    if (!app.value || !app.value.currentUser) return null
    return app.value.currentUser.mongoClient('mongodb-atlas')
  })

  function getDb(dbName: string) {
    if (!mongoClient.value) throw new Error('Нет соединения с Realm. Пользователь не авторизован')
    return mongoClient.value.db(dbName)
  }

  function getCollection<T = any>(dbName: string, collection: string) {
    return getDb(dbName).collection<T>(collection)
  }

  // Placeholder for Flexible Sync subscriptions configuration
  // NOTE: Для Realm Web Flexible Sync потребуется включённый App Services и схемы с разрешениями
  async function ensureSubscriptions() {
    // Если будет использоваться Flexible Sync через Realm JS (не Web), здесь будет конфиг
    // Для realm-web обычно используем Remote MongoDB (Data API) без локального файла Realm
  }

  // Auto-login flow on client: try JWT from our auth, else anonymous
  if (process.client) {
    const { token } = useAuth()
    const jwt = token.value
    const tryLogin = async () => {
      try {
        if (jwt) await loginWithJwt(jwt)
        else await loginAnonymous()
      } finally {
        await ensureSubscriptions()
      }
    }
    tryLogin().catch(() => {})
  }

  return {
    provide: {
      realm: {
        app,
        currentUser,
        isLoggedIn,
        loginWithJwt,
        loginAnonymous,
        logout,
        ensureSubscriptions,
        mongoClient,
        getDb,
        getCollection,
      },
    },
  }
})

