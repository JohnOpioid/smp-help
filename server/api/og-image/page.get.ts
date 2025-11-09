import { defineEventHandler, getQuery } from 'h3'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'
import TestCategory from '~/server/models/TestCategory'
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const path = (query.path as string) || '/'
    
    // Проверяем, является ли это страницей алгоритма (путь вида /algorithms/.../id)
    let algorithmData: { title: string; mkbCodes: string[] } | null = null
    if (path.startsWith('/algorithms/')) {
      const pathSegments = path.split('/').filter(Boolean)
      // Последний сегмент должен быть ID алгоритма (24 символа hex)
      const lastSegment = pathSegments[pathSegments.length - 1]
      if (lastSegment && mongoose.Types.ObjectId.isValid(lastSegment)) {
        try {
          await connectDB()
          const algorithm = await Algorithm.findById(lastSegment).lean() as any
          if (algorithm && algorithm.title) {
            algorithmData = {
              title: String(algorithm.title || 'Алгоритм'),
              mkbCodes: Array.isArray(algorithm.mkbCodes) ? algorithm.mkbCodes.map((c: any) => String(c)) : []
            }
          }
        } catch (e) {
          console.warn('Ошибка загрузки алгоритма для OG изображения:', e)
        }
      }
    }
    
    // Проверяем, является ли это страницей теста (путь вида /tests/id)
    let testCategoryData: { name: string; mkbCodes: string[] } | null = null
    if (path.startsWith('/tests/')) {
      const pathSegments = path.split('/').filter(Boolean)
      // Второй сегмент должен быть ID категории теста (24 символа hex)
      const categoryId = pathSegments[1]
      if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        try {
          await connectDB()
          const testCategory = await TestCategory.findById(categoryId).lean() as any
          if (testCategory && testCategory.name) {
            testCategoryData = {
              name: String(testCategory.name || 'Тест'),
              mkbCodes: Array.isArray(testCategory.mkbCodes) ? testCategory.mkbCodes.map((c: any) => String(c)) : []
            }
          }
        } catch (e) {
          console.warn('Ошибка загрузки категории теста для OG изображения:', e)
        }
      }
    }
    
    // Получаем название раздела из пути
    const getSectionName = (p: string): string => {
      if (p === '/' || p === '') return 'Справочник СМП'
      if (p.startsWith('/algorithms')) return 'Алгоритмы'
      if (p.startsWith('/tests')) return 'Тесты'
      if (p.startsWith('/calculators')) return 'Калькуляторы'
      if (p.startsWith('/classroom/instructions')) return 'Инструкции'
      if (p.startsWith('/apps')) return 'Приложения'
      if (p.startsWith('/favorites') || p.startsWith('/profile/bookmarks')) return 'Избранное'
      if (p.startsWith('/profile')) return 'Профиль'
      if (p.startsWith('/about')) return 'О проекте'
      if (p.startsWith('/contacts')) return 'Контакты'
      if (p.startsWith('/privacy')) return 'Конфиденциальность'
      if (p.startsWith('/updates')) return 'Обновления'
      if (p.startsWith('/help')) return 'Помощь'
      if (p.startsWith('/promo')) return 'Промо'
      if (p.startsWith('/substations')) return 'Подстанции'
      if (p.startsWith('/local-statuses')) return 'Локальные статусы'
      if (p.startsWith('/drugs')) return 'Лекарственные средства'
      if (p.startsWith('/codifier')) return 'Кодификатор'
      return 'Справочник СМП'
    }
    
    // Получаем описание раздела
    const getSectionDescription = (p: string): string => {
      if (p === '/' || p === '') return 'Алгоритмы, инструкции, кодификаторы и медицинские калькуляторы'
      if (p.startsWith('/algorithms')) {
        // Для алгоритмов возвращаем название алгоритма как описание
        return algorithmData ? algorithmData.title : 'Пошаговые алгоритмы диагностики и лечения различных заболеваний'
      }
      if (p.startsWith('/tests')) {
        // Для тестов возвращаем название категории теста как описание
        return testCategoryData ? testCategoryData.name : 'Ответы на тесты пернаментного обучения'
      }
      if (p.startsWith('/calculators')) return 'Инструменты для расчета дозировок, индексов и других показателей'
      if (p.startsWith('/classroom/instructions')) return 'Учебные материалы и инструкции для медицинских работников'
      if (p.startsWith('/apps')) return 'Мобильные приложения и инструменты для СМП'
      if (p.startsWith('/favorites') || p.startsWith('/profile/bookmarks')) return 'Сохраненные материалы и закладки'
      if (p.startsWith('/profile')) return 'Личный кабинет пользователя'
      if (p.startsWith('/about')) return 'Информация о проекте и команде разработки'
      if (p.startsWith('/contacts')) return 'Контактная информация и обратная связь'
      if (p.startsWith('/privacy')) return 'Политика конфиденциальности и обработки данных'
      if (p.startsWith('/updates')) return 'История обновлений и нововведений'
      if (p.startsWith('/help')) return 'Справка и помощь по использованию сервиса'
      if (p.startsWith('/promo')) return 'Промо-материалы и специальные предложения'
      if (p.startsWith('/substations')) return 'Информация о подстанциях скорой медицинской помощи'
      if (p.startsWith('/local-statuses')) return 'Локальные статусы и классификации'
      if (p.startsWith('/drugs')) return 'Полная информация о лекарственных препаратах и их применении'
      if (p.startsWith('/codifier')) return 'Международная классификация болезней и медицинские коды'
      return 'Алгоритмы, инструкции, кодификаторы и медицинские калькуляторы'
    }
    
    const sectionName = getSectionName(path)
    const sectionDescription = getSectionDescription(path)
    
    // Загружаем логотип
    let logoData: string | undefined
    try {
      const candidates = [
        '/var/www/html/helpsmp.ru/logo.svg',
        '/var/www/html/helpsmp.ru/public/logo.svg',
        join(process.cwd(), 'logo.svg'),
        join(process.cwd(), 'public', 'logo.svg')
      ]
      
      for (const p of candidates) {
        try {
          if (!existsSync(p)) continue
          const buf = readFileSync(p)
          logoData = `data:image/svg+xml;base64,${buf.toString('base64')}`
          break
        } catch {}
      }
    } catch (e) {
      console.warn('Ошибка при поиске логотипа локально:', e)
    }
    
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = event.node.req.headers.host || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    if (!logoData) {
      try {
        const resp = await fetch(`${baseUrl}/logo.svg`).catch(() => null)
        if (resp?.ok) {
          const svgText = await resp.text()
          const b64 = Buffer.from(svgText, 'utf-8').toString('base64')
          logoData = `data:image/svg+xml;base64,${b64}`
        }
      } catch (e) {
        console.warn('Не удалось загрузить логотип по HTTP:', e)
      }
    }
    
    // Загружаем шрифты (используем ту же логику, что и в кодификаторе)
    let fontDataRegular: ArrayBuffer | null = null
    let fontDataBold: ArrayBuffer | null = null
    let fontDataMono: ArrayBuffer | null = null
    
    try {
      // Пробуем загрузить Noto Sans (поддерживает кириллицу)
      const notoRegularUrls = [
        'https://github.com/googlefonts/noto-fonts/blob/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf?raw=1',
      ]
      
      for (const url of notoRegularUrls) {
        try {
          const resp = await fetch(url)
          if (resp.ok) {
            fontDataRegular = await resp.arrayBuffer()
            break
          }
        } catch {}
      }
      
      const notoBoldUrls = [
        'https://github.com/googlefonts/noto-fonts/blob/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf?raw=1',
      ]
      
      for (const url of notoBoldUrls) {
        try {
          const resp = await fetch(url)
          if (resp.ok) {
            fontDataBold = await resp.arrayBuffer()
            break
          }
        } catch {}
      }
      
      // Пробуем загрузить Roboto Mono
      const monoUrls = [
        'https://fonts.gstatic.com/s/robotomono/v23/L0x7DF4xlVMF-BfR8bXMIjhGq3-OXAR1.ttf',
        'https://raw.githubusercontent.com/google/fonts/main/apache/robotomono/RobotoMono-Regular.ttf',
      ]
      
      for (const url of monoUrls) {
        try {
          const resp = await fetch(url)
          if (resp.ok) {
            fontDataMono = await resp.arrayBuffer()
            break
          }
        } catch {}
      }
      
      // Fallback на Roboto
      if (!fontDataRegular) {
        try {
          const resp = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf')
          if (resp.ok) {
            fontDataRegular = await resp.arrayBuffer()
          }
        } catch {}
      }
      
      if (!fontDataBold) {
        try {
          const resp = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf')
          if (resp.ok) {
            fontDataBold = await resp.arrayBuffer()
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Ошибка загрузки шрифтов:', e)
    }
    
    if (!fontDataRegular) {
      if (process.env.NODE_ENV !== 'production') {
        const transparent1x1 = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABLVn8xQAAAABJRU5ErkJggg==',
          'base64'
        )
        event.node.res.setHeader('Access-Control-Allow-Origin', '*')
        return new Response(transparent1x1, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-store, max-age=0',
          },
        })
      }
      throw new Error('Не удалось загрузить шрифты')
    }
    
    const regularArrayBuffer = fontDataRegular.slice(0)
    const boldArrayBuffer = (fontDataBold || fontDataRegular).slice(0)
    const monoArrayBuffer = (fontDataMono || fontDataRegular).slice(0)
    
    const fonts = [
      {
        name: 'Noto Sans',
        data: regularArrayBuffer,
        weight: 400 as const,
        style: 'normal' as const
      },
      {
        name: 'Noto Sans',
        data: boldArrayBuffer,
        weight: 600 as const,
        style: 'normal' as const
      },
      {
        name: 'Roboto Mono',
        data: monoArrayBuffer,
        weight: 400 as const,
        style: 'normal' as const
      },
      {
        name: 'Roboto',
        data: regularArrayBuffer,
        weight: 400 as const,
        style: 'normal' as const
      },
      {
        name: 'Roboto',
        data: boldArrayBuffer,
        weight: 600 as const,
        style: 'normal' as const
      }
    ]
    
    const reqW = Number(query.w || query.width || 0)
    const reqH = Number(query.h || query.height || 0)
    const width = Number.isFinite(reqW) && reqW > 0 ? Math.min(Math.max(reqW, 50), 2000) : 900
    const height = Number.isFinite(reqH) && reqH > 0 ? Math.min(Math.max(reqH, 50), 2000) : 600

    // коэффициент масштабирования относительно базового макета 1200x630
    const baseW = 1200
    const baseH = 630
    const scale = Math.min(width / baseW, height / baseH)
    const sz = (n: number, min = 10) => Math.max(Math.round(n * scale), min)
    // Усиливаем ТОЛЬКО размер шрифтов контента для лучшей читаемости
    const contentBoost = 1.35
    const szi = (n: number, min = 10) => Math.max(Math.round(n * scale * contentBoost), min)
    
    // Генерируем SVG через satori в том же стиле, что и кодификатор
    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#f8fafc',
            fontFamily: 'Noto Sans, Roboto, sans-serif',
          },
          children: [
            // Контент с логотипом по центру и названием под ним (без шапки)
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${sz(48)}px ${sz(32)}px`,
                  gap: `${sz(32)}px`,
                },
                children: (() => {
                  const childrenArray: any[] = []
                  
                  // Логотип по центру
                  if (logoData) {
                    childrenArray.push({
                      type: 'img',
                      props: {
                        src: logoData,
                        width: sz(120),
                        height: sz(120),
                        style: {
                          borderRadius: '8px',
                        },
                      },
                    })
                  }
                  
                  // Название раздела под логотипом (цвет как в шапке #62748E)
                  childrenArray.push({
                    type: 'div',
                    props: {
                      style: {
                        fontSize: `${szi(42, 24)}px`,
                        fontWeight: '600',
                        color: '#62748E',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        marginBottom: `${sz(16)}px`,
                      },
                      children: sectionName,
                    },
                  })
                  
                  // Описание раздела под названием (для алгоритмов - название алгоритма, для тестов - название категории)
                  if (sectionDescription) {
                    const hasMkbCodes = (algorithmData && algorithmData.mkbCodes && algorithmData.mkbCodes.length > 0) || 
                                       (testCategoryData && testCategoryData.mkbCodes && testCategoryData.mkbCodes.length > 0)
                    childrenArray.push({
                      type: 'div',
                      props: {
                        style: {
                          fontSize: `${szi(18, 14)}px`,
                          fontWeight: '400',
                          color: '#64748b',
                          textAlign: 'center',
                          lineHeight: 1.5,
                          maxWidth: '80%',
                          marginBottom: hasMkbCodes ? `${sz(16)}px` : '0',
                        },
                        children: sectionDescription,
                      },
                    })
                  }
                  
                  // Для алгоритмов и тестов показываем коды МКБ в виде бейджей под описанием
                  const mkbCodesToShow = algorithmData?.mkbCodes || testCategoryData?.mkbCodes || []
                  if (mkbCodesToShow.length > 0) {
                    childrenArray.push({
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: `${sz(8)}px`,
                          maxWidth: '90%',
                        },
                        children: mkbCodesToShow.map((code: string) => ({
                          type: 'div',
                          props: {
                            style: {
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontSize: `${szi(14, 11)}px`,
                              fontWeight: '400',
                              fontFamily: 'Roboto Mono, monospace',
                              padding: `${sz(4)}px ${sz(8)}px`,
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                            },
                            children: String(code),
                          },
                        })),
                      },
                    })
                  }
                  
                  return childrenArray
                })(),
              },
            },
            // Footer
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${sz(12)}px ${sz(16)}px`,
                  borderTop: '1px solid #e2e8f0',
                },
                children: {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: `${sz(14, 10)}px`,
                      fontWeight: '400',
                      color: '#64748b',
                      textAlign: 'center',
                    },
                    children: 'Поделились с сайта helpsmp.ru',
                  },
                },
              },
            },
          ],
        },
      },
      {
        width,
        height,
        fonts,
      }
    )
    
    // Конвертируем SVG в PNG
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: width,
      },
    })
    
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()
    const pngUint8Array = new Uint8Array(pngBuffer)
    
    event.node.res.setHeader('Access-Control-Allow-Origin', '*')
    event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    const queryForCache = getQuery(event)
    const cacheHeader = queryForCache?.v ? 'no-store, max-age=0' : 'public, max-age=3600'
    
    return new Response(pngUint8Array, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': cacheHeader,
        'Content-Length': pngBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Ошибка генерации OG изображения:', error)
    
    if (process.env.NODE_ENV !== 'production') {
      const transparent1x1 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABLVn8xQAAAABJRU5ErkJggg==',
        'base64'
      )
      event.node.res.setHeader('Access-Control-Allow-Origin', '*')
      return new Response(transparent1x1, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, max-age=0',
        },
      })
    }
    
    return new Response('Internal Server Error', { status: 500 })
  }
})

