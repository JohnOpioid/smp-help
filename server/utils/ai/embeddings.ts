import type { Tensor } from '@xenova/transformers'
import { pipeline } from '@xenova/transformers'

// Кэшируем инстанс пайплайна, чтобы не грузить модель заново
let embeddingsPipelinePromise: Promise<any> | null = null

export async function getEmbeddingsModel() {
  if (!embeddingsPipelinePromise) {
    // Модель с поддержкой русского языка (multilingual)
    embeddingsPipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return embeddingsPipelinePromise
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) return []
  const extractor = await getEmbeddingsModel()
  const outputs: any = await extractor(texts, { pooling: 'mean', normalize: true })

  // Возможные варианты возвращаемого формата:
  // 1) Один тензор с dims [batch, dim]
  // 2) Один тензор с dims [dim] (если один текст)
  // 3) Массив тензоров (редко)

  // Если пришел массив тензоров
  if (Array.isArray(outputs)) {
    return outputs.map((t: any) => Array.from(t.data))
  }

  // Если пришел один тензор
  const tensor: Tensor = outputs as Tensor
  const data = Array.from((tensor as any).data as Float32Array | number[])
  const dims: number[] = (tensor as any).dims || []

  if (dims.length === 1) {
    // [dim]
    return [data as number[]]
  }

  if (dims.length === 2) {
    // [batch, dim]
    const [batch, dim] = dims
    const vectors: number[][] = new Array(batch)
    for (let i = 0; i < batch; i++) {
      const start = i * dim
      vectors[i] = data.slice(start, start + dim) as number[]
    }
    return vectors
  }

  // Неожиданный формат — возвращаем как один вектор
  return [data as number[]]
}



