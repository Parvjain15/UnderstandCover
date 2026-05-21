import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = []
  const batchSize = 10

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const results = await Promise.all(batch.map((t) => generateEmbedding(t)))
    embeddings.push(...results)
    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  return embeddings
}

export async function callGeminiWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      })
      return completion.choices[0]?.message?.content ?? ''
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : ''
      const isRateLimit = msg.includes('429') || msg.includes('rate') || msg.includes('quota')
      if (isRateLimit && attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 3000))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export function extractJSON(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) return jsonMatch[1]
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text
}
