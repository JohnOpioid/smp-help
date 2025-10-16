import { Ollama } from 'ollama'

export class MedicalDrugExtractor {
  private ollama: Ollama
  private model: string = 'llama3.1:8b'

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    })
  }

  async extractDrugsFromAlgorithm(algorithmContent: string, diagnosis: string): Promise<{
    drugs: Array<{
      name: string
      dosage: string
      context: string
      indication: string
    }>
    summary: string
  }> {
    const prompt = `
Ты медицинский ассистент. Проанализируй алгоритм лечения и извлеки все препараты с дозировками.

ДИАГНОЗ: ${diagnosis}

АЛГОРИТМ:
${algorithmContent}

ЗАДАЧА:
1. Найди ВСЕ препараты в тексте
2. Извлеки дозировки для каждого препарата
3. Определи контекст применения (при каких условиях назначается)
4. Напиши краткое резюме лечения

ФОРМАТ ОТВЕТА (JSON):
{
  "drugs": [
    {
      "name": "Название препарата",
      "dosage": "Дозировка",
      "context": "При каких условиях назначается",
      "indication": "Показание к применению"
    }
  ],
  "summary": "Краткое резюме лечения"
}

ВАЖНО:
- Ищи препараты по всему тексту, включая таблицы
- Извлекай точные дозировки
- Указывай контекст применения (например: "при тахикардии ≥ 100 ударов в мин")
- Отвечай только в формате JSON
`

    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: 0.1, // Низкая температура для точности
          top_p: 0.9
        }
      })

      const content = response.message.content
      
      // Парсим JSON ответ
      try {
        const parsed = JSON.parse(content)
        return parsed
      } catch (parseError) {
        console.error('Ошибка парсинга JSON от Ollama:', parseError)
        console.error('Ответ:', content)
        
        // Fallback: пытаемся извлечь препараты вручную
        return this.fallbackExtraction(content)
      }
    } catch (error) {
      console.error('Ошибка Ollama:', error)
      return {
        drugs: [],
        summary: 'Ошибка анализа алгоритма'
      }
    }
  }

  private fallbackExtraction(content: string) {
    // Простое извлечение препаратов из текста
    const drugMatches = content.match(/([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/gi) || []
    
    const drugs = drugMatches.map(match => {
      const parts = match.split(/\s+/)
      const name = parts[0]
      const dosage = parts.slice(1).join(' ')
      
      return {
        name,
        dosage,
        context: '',
        indication: ''
      }
    })

    return {
      drugs,
      summary: 'Извлечение препаратов (fallback режим)'
    }
  }

  async generateHumanResponse(query: string, results: any[]): Promise<string> {
    const prompt = `
Ты дружелюбный медицинский ассистент. Ответь на вопрос пользователя естественным языком, как в беседе.

ВОПРОС ПОЛЬЗОВАТЕЛЯ: ${query}

НАЙДЕННЫЕ РЕЗУЛЬТАТЫ: ${JSON.stringify(results, null, 2)}

ЗАДАЧА:
- Ответь естественно и дружелюбно
- Объясни, что найдено
- Предложи дополнительные вопросы
- Используй медицинскую терминологию, но доступно

СТИЛЬ:
- Как в беседе с коллегой
- Короткие предложения
- Эмодзи для дружелюбности
- Предложения по дальнейшим действиям
`

    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: 0.7, // Более творческий ответ
          top_p: 0.9
        }
      })

      return response.message.content
    } catch (error) {
      console.error('Ошибка генерации ответа:', error)
      return 'Извините, произошла ошибка при генерации ответа.'
    }
  }
}

export const medicalExtractor = new MedicalDrugExtractor()
