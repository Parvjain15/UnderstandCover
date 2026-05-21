import type { PageText } from './extract'

export interface PolicyChunkInput {
  pageNumber: number
  sectionTitle: string | null
  clauseReference: string | null
  chunkText: string
  chunkIndex: number
}

const HEADING_PATTERNS = [
  /^(Section|SECTION)\s+\d+[\.\s]/,
  /^(Clause|CLAUSE)\s+[\d\.]+/,
  /^\d+\.\s+[A-Z]/,
  /^\d+\.\d+[\s\.]/,
  /^[A-Z][A-Z\s]{4,}$/,
  /^(DEFINITIONS|EXCLUSIONS|CONDITIONS|COVER|COVERAGE|WHAT\s+IS\s+COVERED|WHAT\s+IS\s+NOT\s+COVERED)/i,
]

const CLAUSE_REF_PATTERN = /\b(\d+\.\d+(?:\.\d+)?)\b/

function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 100) return false
  return HEADING_PATTERNS.some((p) => p.test(trimmed))
}

function extractClauseRef(text: string): string | null {
  const match = text.match(CLAUSE_REF_PATTERN)
  return match ? match[1] : null
}

function chunkByParagraph(text: string, maxChars = 1500, overlap = 200): string[] {
  const paragraphs = text.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trim())
      const words = current.split(' ')
      current = words.slice(-Math.floor(overlap / 5)).join(' ') + '\n\n'
    }
    current += para + '\n\n'
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim())
  }

  return chunks
}

export function chunkPolicyPages(pages: PageText[]): PolicyChunkInput[] {
  const chunks: PolicyChunkInput[] = []
  let chunkIndex = 0
  let currentSection: string | null = null

  for (const page of pages) {
    const lines = page.text.split('\n')
    let pageText = ''

    for (const line of lines) {
      if (isHeading(line)) {
        if (pageText.trim().length > 100) {
          const subChunks = chunkByParagraph(pageText)
          for (const sub of subChunks) {
            chunks.push({
              pageNumber: page.pageNumber,
              sectionTitle: currentSection,
              clauseReference: extractClauseRef(sub),
              chunkText: sub,
              chunkIndex: chunkIndex++,
            })
          }
          pageText = ''
        }
        currentSection = line.trim()
      }
      pageText += line + '\n'
    }

    if (pageText.trim().length > 50) {
      const subChunks = chunkByParagraph(pageText)
      for (const sub of subChunks) {
        if (sub.trim().length > 30) {
          chunks.push({
            pageNumber: page.pageNumber,
            sectionTitle: currentSection,
            clauseReference: extractClauseRef(sub),
            chunkText: sub,
            chunkIndex: chunkIndex++,
          })
        }
      }
    }
  }

  return chunks
}
