// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { port: 3000, host: 'localhost' },
  modules: ['@nuxt/ui'],
  nitro: {
    preset: 'node-server'
  },
  app: {
    head: {
      title: 'Справочник СМП',
      titleTemplate: '%s — Справочник СМП',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы.' }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help',
    adminSetupToken: process.env.ADMIN_SETUP_TOKEN || 'setup-token',
    gigachatApiKey: process.env.GIGACHAT_API_KEY,
    gigachatClientId: process.env.GIGACHAT_CLIENT_ID,
    gigachatScope: process.env.GIGACHAT_SCOPE,
    public: {
      apiBase: '/api',
      yamapsApiKey: process.env.YAMAPS_API_KEY || '0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c'
    }
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {}
    }
  }
})