import { defineEventHandler, getRouterParam } from 'h3'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import '~/server/models/MKBCategory'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    return new Response('ID не указан', { status: 400 })
  }

  try {
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
      const logoPath = join(process.cwd(), 'public', 'logo.svg')
      const logoBuffer = readFileSync(logoPath)
      logoData = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`
    } catch (e) {
      console.warn('Не удалось загрузить логотип локально, пробуем HTTP:', e)
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
    
    try {
      // Используем raw.githubusercontent.com для прямого доступа к файлам
      const regularUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf'
      const boldUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Bold.ttf'
      
      const [regularResponse, boldResponse] = await Promise.all([
        fetch(regularUrl).catch(() => null),
        fetch(boldUrl).catch(() => null)
      ])
      
      if (regularResponse?.ok && regularResponse.headers.get('content-type')?.includes('font')) {
        fontDataRegular = await regularResponse.arrayBuffer()
      }
      if (boldResponse?.ok && boldResponse.headers.get('content-type')?.includes('font')) {
        fontDataBold = await boldResponse.arrayBuffer()
      }
    } catch (e) {
      console.warn('Не удалось загрузить TTF шрифты из GitHub, пробуем локальные:', e)
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
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: не удалось загрузить шрифт Roboto-Regular.ttf')
        console.error('Пробовали пути:', possiblePaths)
        console.error('Последняя ошибка:', lastError?.message)
        // satori требует хотя бы один шрифт, поэтому бросаем ошибку
        throw new Error(`Не удалось загрузить шрифт для генерации изображения. Пробовали пути: ${possiblePaths.join(', ')}. Ошибка: ${lastError?.message}`)
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
      throw new Error('Не удалось загрузить ни один шрифт для генерации изображения')
    }
    
    // Создаем копию ArrayBuffer для каждого веса шрифта
    // satori может модифицировать буфер, поэтому нужны отдельные копии
    const regularArrayBuffer = fontDataRegular.slice(0)
    const boldArrayBuffer = (fontDataBold || fontDataRegular).slice(0)
    
    const fonts = [
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
            fontFamily: fonts.length > 0 ? 'Roboto' : 'sans-serif',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  padding: '24px 32px',
                  borderBottom: '1px solid #e2e8f0',
                  gap: '16px',
                },
                children: [
                  logoData ? {
                    type: 'img',
                    props: {
                      src: logoData,
                      width: 48,
                      height: 48,
                      style: {
                        borderRadius: '8px',
                      },
                    },
                  } : null,
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#62748E',
                      },
                      children: 'Кодификатор',
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
                  padding: '32px',
                  gap: '24px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        gap: '24px',
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
                                    color: '#475569',
                                    marginBottom: '8px',
                                  },
                                  children: 'Код МКБ-10',
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    fontSize: '24px',
                                    fontFamily: 'monospace',
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
                                    color: '#475569',
                                    marginBottom: '8px',
                                  },
                                  children: 'Код станции',
                                },
                              },
                              {
                                type: 'div',
                                props: {
                                  style: {
                                    fontSize: '24px',
                                    fontFamily: 'monospace',
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
                              color: '#475569',
                              marginBottom: '8px',
                            },
                            children: 'Нозологическая форма',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '20px',
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
                              color: '#475569',
                              marginBottom: '8px',
                            },
                            children: 'Примечание',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '16px',
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
                              color: '#475569',
                              marginBottom: '8px',
                            },
                            children: 'Категория',
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontSize: '16px',
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
                  padding: '20px 32px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#f1f5f9',
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
        width: 1200,
        height: 630,
        fonts: fonts,
      }
    )

    // Конвертируем SVG в PNG через @resvg/resvg-js
    const resvg = new Resvg(svg, {
      background: '#f8fafc',
      fitTo: {
        mode: 'width',
        value: 1200,
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
    
    return new Response(pngUint8Array, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': pngBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Ошибка генерации OG изображения:', error)
    console.error('Stack:', error?.stack)
    console.error('Message:', error?.message)
    
    // Возвращаем более детальную информацию об ошибке
    return new Response(
      JSON.stringify({
        error: 'Ошибка генерации изображения',
        message: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
})

