import pdfParse from 'pdf-parse'

export interface PageText {
  pageNumber: number
  text: string
}

export async function extractPdfPages(buffer: Buffer): Promise<PageText[]> {
  const pages: PageText[] = []

  let pageNum = 0
  const data = await pdfParse(buffer, {
    pagerender: function (pageData: { getTextContent: () => Promise<{ items: Array<{ str: string; hasEOL?: boolean }> }> }) {
      pageNum++
      const currentPage = pageNum
      return pageData.getTextContent().then(function (textContent: { items: Array<{ str: string; hasEOL?: boolean }> }) {
        let text = ''
        for (const item of textContent.items) {
          text += item.str
          if (item.hasEOL) text += '\n'
          else text += ' '
        }
        pages.push({ pageNumber: currentPage, text: text.trim() })
        return text
      })
    },
  })

  if (pages.length === 0 && data.text) {
    pages.push({ pageNumber: 1, text: data.text })
  }

  return pages.sort((a, b) => a.pageNumber - b.pageNumber)
}

export function hasReadableText(pages: PageText[]): boolean {
  const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0)
  return totalChars > 100
}
