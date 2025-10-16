import { ChromaClient, type IncludeEnum } from 'chromadb'

let client: ChromaClient | null = null

export function getChromaClient() {
  if (!client) {
    client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://127.0.0.1:8000' })
  }
  return client
}

export async function getOrCreateCollection(name: string) {
  const c = getChromaClient()
  try {
    return await c.getCollection({ name })
  } catch {
    return await c.createCollection({ name, metadata: { source: 'smp-help' } })
  }
}

export async function queryCollection(name: string, queryEmbeddings: number[][], nResults = 10) {
  const collection = await getOrCreateCollection(name)
  const result = await collection.query({
    queryEmbeddings,
    nResults,
    include: ['distances', 'documents', 'metadatas', 'embeddings'] as unknown as IncludeEnum[]
  })
  return result
}



