const https = require('https')
const fs = require('fs')
const path = require('path')

const fontsDir = path.join(__dirname, '..', 'public', 'fonts')

// Создаем директорию если её нет
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true })
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Редирект
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject)
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

async function main() {
  console.log('Загрузка шрифтов Roboto...')
  
  // Используем прямые ссылки из репозитория google/fonts на GitHub через jsdelivr
  // jsdelivr предоставляет прямой доступ к raw файлам
  const regularUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/Roboto-Regular.ttf'
  const boldUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/roboto/Roboto-Bold.ttf'
  
  let downloaded = false
  
  try {
    await downloadFile(regularUrl, path.join(fontsDir, 'Roboto-Regular.ttf'))
    console.log('✓ Roboto-Regular.ttf загружен')
    downloaded = true
  } catch (e) {
    console.error('✗ Ошибка загрузки Roboto-Regular.ttf:', e.message)
  }
  
  try {
    await downloadFile(boldUrl, path.join(fontsDir, 'Roboto-Bold.ttf'))
    console.log('✓ Roboto-Bold.ttf загружен')
  } catch (e) {
    console.error('✗ Ошибка загрузки Roboto-Bold.ttf:', e.message)
    console.log('⚠ Bold будет использовать Regular при генерации')
  }
  
  if (!downloaded) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить шрифты!')
    console.error('Пожалуйста, скачайте TTF файлы вручную:')
    console.error('1. Откройте https://fonts.google.com/specimen/Roboto')
    console.error('2. Скачайте TTF файлы')
    console.error('3. Разместите их в public/fonts/')
    process.exit(1)
  }
  
  console.log('Готово!')
}

main().catch(console.error)

