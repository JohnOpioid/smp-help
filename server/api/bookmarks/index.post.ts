import { defineEventHandler, getCookie, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  console.log('🔍 POST /api/bookmarks called')
  await connectDB()

  const token = getCookie(event, 'token')
  console.log('🔍 Token found:', !!token)
  if (!token) {
    return { success: false, message: 'Токен не найден' }
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string }
    console.log('🔍 Decoded token:', { userId: decoded.userId, email: decoded.email })
    const user = await User.findById(decoded.userId)

    if (!user) {
      console.log('🔍 User not found')
      return { success: false, message: 'Пользователь не найден' }
    }

    const body = await readBody(event)
    console.log('🔍 Request body:', body)
    const { 
      type, title, description, category, url, mkbCode, stationCode, code, 
      complaints, anamnesis, localis,
      // Дополнительные поля для препаратов
      latinName, categories, indications, contraindications, dosages,
      sideEffects, mechanismOfAction, pharmacokinetics
    } = body || {}
    if (!type || !title) {
      console.log('🔍 Invalid data:', { type, title })
      return { success: false, message: 'Неверные данные' }
    }

    const bookmark: any = {
      type,
      title,
      description: description || '',
      category: category || '',
      url: url || '',
      mkbCode: mkbCode || '',
      stationCode: stationCode || '',
      code: code || '',
      complaints: complaints || '',
      anamnesis: anamnesis || '',
      localis: localis || '',
      createdAt: new Date()
    }
    
    // Добавляем все дополнительные поля для препаратов
    const optionalFields = ['latinName', 'categories', 'indications', 'contraindications', 'dosages',
      'sideEffects', 'adverse', 'mechanismOfAction', 'mechanism', 'pharmacokinetics',
      'synonyms', 'analogs', 'interactions', 'antidotes', 'antidote', 'description',
      'forms', 'pediatricDose', 'pediatricDoseUnit', 'ageRestrictions']
    
    optionalFields.forEach(field => {
      const value = body[field]
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          bookmark[field] = value
        } else if (typeof value === 'object' && Object.keys(value).length > 0) {
          bookmark[field] = value
        } else if (typeof value === 'string' && value.trim()) {
          bookmark[field] = value
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          bookmark[field] = value
        }
      }
    })

    console.log('🔍 Creating bookmark:', bookmark)
    // @ts-ignore
    user.bookmarks = user.bookmarks || []
    
    // Проверяем, не существует ли уже такая закладка
    const existingBookmark = user.bookmarks.find((b: any) => b.url === bookmark.url)
    if (existingBookmark) {
      console.log('🔍 Bookmark already exists:', existingBookmark)
      return { success: false, message: 'Закладка уже существует' }
    }
    
    // @ts-ignore
    user.bookmarks.push(bookmark)
    console.log('🔍 User bookmarks before save:', user.bookmarks.length)
    await user.save()
    console.log('🔍 User saved successfully')

    return { success: true, item: user.bookmarks[user.bookmarks.length - 1] }
  } catch (error) {
    console.error('🔍 Error in POST /api/bookmarks:', error)
    return { success: false, message: 'Ошибка добавления закладки' }
  }
})


