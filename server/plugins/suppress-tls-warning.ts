export default defineNitroPlugin((nitroApp) => {
  // Подавляем предупреждение о небезопасном TLS в development
  if (process.env.NODE_ENV !== 'production') {
    const originalEmitWarning = process.emitWarning
    process.emitWarning = function(warning: any, ...args: any[]) {
      // Пропускаем предупреждение о NODE_TLS_REJECT_UNAUTHORIZED
      if (warning && (
        typeof warning === 'string' && warning.includes('NODE_TLS_REJECT_UNAUTHORIZED') ||
        warning.toString?.().includes('NODE_TLS_REJECT_UNAUTHORIZED') ||
        warning.code === 'DEP0018'
      )) {
        return
      }
      return originalEmitWarning.call(process, warning, ...args)
    }
  }
})

