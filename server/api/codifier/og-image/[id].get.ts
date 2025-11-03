import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import '~/server/models/MKBCategory'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  await connectDB()
  let id = getRouterParam(event, 'id')
  
  if (!id) {
    return new Response('ID не указан', { status: 400 })
  }

  // Очищаем ID от расширения .png, если оно есть
  id = id.replace(/\.png$/i, '')

  try {
    // Гарантируем регистрацию зависимых моделей перед populate
    try {
      await import('~/server/models/MKBCategory')
    } catch {}

    // Загружаем данные элемента из БД
    const item = await MKB.findById(id)
      .populate('category', 'name url')
      .lean()
    
    if (!item) {
      return new Response('Элемент не найден', { status: 404 })
    }

    // Загружаем логотип из файловой системы; если не найден, пробуем через HTTP
    let logoData: string | undefined
    try {
      // Последовательность путей для прод/дев окружений
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
          console.log('✓ Логотип загружен из файла:', p)
          break
        } catch {}
      }
    } catch (e) {
      console.warn('Ошибка при поиске логотипа локально:', e)
    }

    // Получаем базовый URL для использования в изображении
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
          console.log('✓ Логотип загружен по HTTP:', `${baseUrl}/logo.svg`)
        }
      } catch (e) {
        console.warn('Не удалось загрузить логотип по HTTP:', e)
      }
    }

    // satori требует шрифты для рендеринга текста, но не поддерживает WOFF2
    // Используем прямой URL к TTF файлу или работаем без кастомных шрифтов
    let fontDataRegular: ArrayBuffer | null = null
    let fontDataBold: ArrayBuffer | null = null
    let fontDataMono: ArrayBuffer | null = null
    
    try {
      // Список удалённых источников TTF (несколько зеркал)
      // СТАВИМ Noto Sans первым, чтобы обеспечить кириллицу
      const remoteFontSources = {
        notoRegular: [
          'https://github.com/googlefonts/noto-fonts/blob/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf?raw=1',
        ],
        notoBold: [
          'https://github.com/googlefonts/noto-fonts/blob/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf?raw=1',
        ],
        mono: [
          'https://fonts.gstatic.com/s/robotomono/v23/L0x7DF4xlVMF-BfR8bXMIjhGq3-OXAR1.ttf',
          'https://raw.githubusercontent.com/google/fonts/main/apache/robotomono/RobotoMono-Regular.ttf',
          'https://unpkg.com/@fontsource/roboto-mono@5.0.8/files/roboto-mono-latin-400-normal.ttf',
        ],
        robotoRegular: [
          'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf',
          'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
          'https://unpkg.com/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.ttf',
        ],
        robotoBold: [
          'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Bold.ttf',
          'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
          'https://unpkg.com/@fontsource/roboto@5.0.8/files/roboto-latin-700-normal.ttf',
        ]
      }

      const tryFetch = async (urls: string[]): Promise<ArrayBuffer | null> => {
        for (const u of urls) {
          try {
            const resp = await fetch(u).catch(() => null)
            if (resp?.ok) {
              // Некоторые CDN отдают generic content-type — не проверяем строго
              const buf = await resp.arrayBuffer()
              if (buf && buf.byteLength > 100000) return buf // фильтруем HTML-заглушки
            }
          } catch {}
        }
        return null
      }

      // Сначала пробуем Noto Sans (кириллица)
      if (!fontDataRegular) fontDataRegular = await tryFetch(remoteFontSources.notoRegular)
      if (!fontDataBold) fontDataBold = await tryFetch(remoteFontSources.notoBold)
      if (!fontDataMono) fontDataMono = await tryFetch(remoteFontSources.mono)
      // Затем Roboto как запасной вариант
      if (!fontDataRegular) fontDataRegular = await tryFetch(remoteFontSources.robotoRegular)
      if (!fontDataBold) fontDataBold = await tryFetch(remoteFontSources.robotoBold)
    } catch (e) {
      console.warn('Не удалось загрузить TTF шрифты из удалённых источников:', e)
    }
    
    // Если не удалось загрузить из интернета, загружаем локальные TTF
    // Пробуем несколько возможных путей (dev: public/fonts/, prod: fonts/)
    if (!fontDataRegular) {
      const possiblePaths = [
        join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'), // dev
        join(process.cwd(), 'fonts', 'Roboto-Regular.ttf'), // prod
        '/var/www/html/helpsmp.ru/fonts/Roboto-Regular.ttf', // prod absolute
      ]
      
      let loaded = false
      let lastError: Error | null = null
      
      for (const ttfPath of possiblePaths) {
        try {
          if (!existsSync(ttfPath)) {
            continue
          }
          const ttfBuffer = readFileSync(ttfPath)
          // Проверяем, что это валидный TTF (должен начинаться с заголовка TTF)
          const header = ttfBuffer.slice(0, 4).toString('binary')
          if (header !== 'OTTO' && header !== '\x00\x01\x00\x00') {
            throw new Error('Файл не является валидным TTF/OTF шрифтом')
          }
          // Конвертируем Buffer в ArrayBuffer правильно
          fontDataRegular = ttfBuffer.buffer.slice(
            ttfBuffer.byteOffset, 
            ttfBuffer.byteOffset + ttfBuffer.byteLength
          )
          console.log('✓ Загружен шрифт Roboto-Regular.ttf из:', ttfPath, 'размер:', ttfBuffer.length, 'байт')
          loaded = true
          break
        } catch (e) {
          lastError = e as Error
          continue
        }
      }
      
      if (!loaded) {
        console.warn('Не удалось найти локальный Roboto-Regular.ttf, пробуем удалённые источники...')
      }
    }
    
    if (!fontDataBold) {
      const possiblePaths = [
        join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf'), // dev
        join(process.cwd(), 'fonts', 'Roboto-Bold.ttf'), // prod
        '/var/www/html/helpsmp.ru/fonts/Roboto-Bold.ttf', // prod absolute
      ]
      
      let loaded = false
      let lastError: Error | null = null
      
      for (const ttfPath of possiblePaths) {
        try {
          if (!existsSync(ttfPath)) {
            continue
          }
          const ttfBuffer = readFileSync(ttfPath)
          // Проверяем размер файла
          if (ttfBuffer.length < 100) {
            throw new Error('Файл слишком мал для валидного TTF шрифта')
          }
          
          // Создаем новый ArrayBuffer из Buffer (правильная конвертация)
          const arrayBuffer = new ArrayBuffer(ttfBuffer.length)
          const view = new Uint8Array(arrayBuffer)
          for (let i = 0; i < ttfBuffer.length; i++) {
            view[i] = ttfBuffer[i]
          }
          fontDataBold = arrayBuffer
          
          console.log('✓ Загружен шрифт Roboto-Bold.ttf из:', ttfPath, 'размер:', ttfBuffer.length, 'байт')
          loaded = true
          break
        } catch (e) {
          lastError = e as Error
          continue
        }
      }
      
      if (!loaded) {
        // Если bold не загрузился, используем regular для bold тоже
        console.warn('⚠ Не удалось загрузить Roboto-Bold.ttf, используем Regular. Пробовали пути:', possiblePaths)
        fontDataBold = fontDataRegular
      }
    }
    
    // satori требует хотя бы один шрифт
    if (!fontDataRegular) {
      // В dev окружении возвращаем плейсхолдер PNG, чтобы не падать 500
      if (process.env.NODE_ENV !== 'production') {
        const transparent1x1 = Buffer.from(
          // 1x1 transparent PNG
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABLVn8xQAAAABJRU5ErkJggg==',
          'base64'
        )
        event.node.res.setHeader('Access-Control-Allow-Origin', '*')
        event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        return new Response(transparent1x1, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-store, max-age=0',
            'Content-Length': transparent1x1.length.toString(),
          },
        })
      }
      throw new Error('Не удалось загрузить ни один шрифт для генерации изображения')
    }
    
    // Создаем копию ArrayBuffer для каждого веса шрифта
    // satori может модифицировать буфер, поэтому нужны отдельные копии
    const regularArrayBuffer = fontDataRegular.slice(0)
    const boldArrayBuffer = (fontDataBold || fontDataRegular).slice(0)
    const monoArrayBuffer = (fontDataMono || fontDataRegular).slice(0)
    
    const fonts = [
      // Предпочтительно Noto Sans (поддерживает кириллицу)
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
      // Моноширинный шрифт для кодов
      {
        name: 'Roboto Mono',
        data: monoArrayBuffer,
        weight: 400 as const,
        style: 'normal' as const
      },
      // Дополнительно Roboto как запасной вариант
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
    
    console.log('Подготовлено шрифтов:', fonts.length, 'Regular size:', regularArrayBuffer.byteLength, 'Bold size:', boldArrayBuffer.byteLength)
    
    const query = getQuery(event)
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
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  padding: `${sz(24)}px ${sz(32)}px`,
                  borderBottom: '1px solid #e2e8f0',
                  gap: `${sz(32)}px`,
                },
                children: [
                  logoData ? {
                    type: 'img',
                    props: {
                      src: logoData,
                      width: sz(48),
                      height: sz(48),
                      style: {
                        borderRadius: '8px',
                      },
                    },
                  } : null,
                  {
                    type: 'div',
                    props: {
                      style: {
                            fontSize: `${sz(24, 14)}px`,
                        fontWeight: '500',
                        color: '#62748E',
                      },
                      children: 'КОДИФИКАТОР',
                    },
                  },
                ].filter(Boolean),
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  padding: `${sz(24)}px ${sz(32)}px`,
                  gap: '28px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        gap: '28px',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              flexDirection: 'column',
                            },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#64748b',
                                    marginBottom: '4px',
                                  },
                                  children: 'Код МКБ-10',
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    fontSize: '28px',
                                    fontFamily: 'Roboto Mono, monospace',
                                    fontWeight: '600',
                                    color: '#0f172a',
                                  },
                                  children: item.mkbCode || '—',
                                },
                              },
                            ],
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              flexDirection: 'column',
                            },
                            children: [
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#64748b',
                                    marginBottom: '4px',
                                  },
                                  children: 'Код станции',
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    fontSize: '28px',
                                    fontFamily: 'Roboto Mono, monospace',
                                    fontWeight: '600',
                                    color: '#0f172a',
                                  },
                                  children: item.stationCode || '—',
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                            fontSize: '14px',
                              fontWeight: '500',
                              color: '#64748b',
                            marginBottom: '4px',
                            },
                            children: 'Нозологическая форма',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                            fontSize: '28px',
                              fontWeight: '600',
                              color: '#0f172a',
                            },
                            children: item.name || '—',
                          },
                        },
                      ],
                    },
                  },
                  item.note ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#64748b',
                              marginBottom: '4px',
                            },
                            children: 'Примечание',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                              style: {
                              fontSize: '18px',
                              color: '#475569',
                              lineHeight: '1.5',
                            },
                            children: item.note,
                          },
                        },
                      ],
                    },
                  } : null,
                  item.category ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#64748b',
                              marginBottom: '4px',
                            },
                            children: 'Категория',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '18px',
                              color: '#475569',
                            },
                            children: item.category.name || '—',
                          },
                        },
                      ],
                    },
                  } : null,
                ].filter(Boolean),
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${sz(12)}px ${sz(16)}px`,
                  borderTop: '1px solid #e2e8f0',
                  // backgroundColor убран по требованию — оставляем фон прозрачным
                },
                children: {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '14px',
                      fontWeight: '400',
                      color: '#64748b',
                      textAlign: 'center',
                    },
                    children: 'Поделились кодом с сайта helpsmp.ru',
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
        fonts: fonts,
      }
    )

    // Конвертируем SVG в PNG через @resvg/resvg-js
    const resvg = new Resvg(svg, {
      background: '#f8fafc',
      fitTo: {
        mode: 'width',
        value: width,
      },
    })
    
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()
    
    // Конвертируем Buffer в Uint8Array для Response
    // asPng() возвращает Buffer, который нужно преобразовать в Uint8Array
    const pngUint8Array = new Uint8Array(pngBuffer.length)
    for (let i = 0; i < pngBuffer.length; i++) {
      pngUint8Array[i] = pngBuffer[i]
    }
    
    // Устанавливаем CORS заголовки для доступа с любого домена
    event.node.res.setHeader('Access-Control-Allow-Origin', '*')
    event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    // Управление кешем: если передан v (версионирование) — отключаем кеш для мгновенной проверки изменений
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
    
    // В dev окружении — возвращаем прозрачный плейсхолдер вместо 500
    if (process.env.NODE_ENV !== 'production') {
      const transparent1x1 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABLVn8xQAAAABJRU5ErkJggg==',
        'base64'
      )
      event.node.res.setHeader('Access-Control-Allow-Origin', '*')
      event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      return new Response(transparent1x1, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, max-age=0',
          'Content-Length': transparent1x1.length.toString(),
        },
      })
    }

    // Прод — оставляем 500, чтобы было видно проблему
    return new Response('Internal Server Error', { status: 500 })
  }
})

