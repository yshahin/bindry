export type PageNumber = number | null

export interface Booklet {
  index: number
  sheets: PageNumber[][]
  sheetCount: number
  pages: number
  blankPages: number
  isFinal: boolean
  pageOrder: PageNumber[]
}

export interface BookletStructure {
  booklets: Booklet[]
  totalPhysicalPages: number
  totalBlankPages: number
  totalSheets: number
  pagesPerBooklet: number
  sequence: PageNumber[]
}

export interface BookletLayout extends BookletStructure {
  totalPages: number
  pagesPerSheet: number
  sheetsPerBooklet: number
  isRTL: boolean
  totalBooklets: number
  completeBooklets: number
  remainingPages: number
  efficiency: number
  rangeStart?: number
  rangeEnd?: number
}

interface ImposedPages {
  sheets: PageNumber[][]
  sequence: PageNumber[]
}

/**
 * Arranges pages on a single sheet for booklet printing
 * Returns [front..., back...] order
 */
function imposeStandardFourUp(pages: PageNumber[], sheetsPerBooklet: number, isRTL: boolean): ImposedPages {
  let low = 0
  let high = pages.length - 1
  const sheets: PageNumber[][] = []
  const sequence: PageNumber[] = []

  const takeLow = (): PageNumber => (low <= high ? pages[low++] ?? null : null)
  const takeHigh = (): PageNumber => (low <= high ? pages[high--] ?? null : null)

  for (let sheetIdx = 0; sheetIdx < sheetsPerBooklet; sheetIdx++) {
    const frontLeft = takeHigh()
    const frontRight = takeLow()
    const backLeft = takeLow()
    const backRight = takeHigh()

    let sheetOrder: PageNumber[] = [frontLeft, frontRight, backLeft, backRight]

    if (isRTL) {
      sheetOrder = [frontRight, frontLeft, backRight, backLeft]
    }

    sheets.push(sheetOrder)
    sequence.push(...sheetOrder)
  }

  return { sheets, sequence }
}

function arrangeBookletPagesFallback(pages: PageNumber[], pagesPerSheet: number): ImposedPages {
  const sheets: PageNumber[][] = []
  for (let i = 0; i < pages.length; i += pagesPerSheet) {
    sheets.push(pages.slice(i, i + pagesPerSheet))
  }
  return { sheets, sequence: pages.slice() }
}

export function generateBookletStructure(
  totalPages: number,
  sheetsPerBooklet: number,
  pagesPerSheet: number,
  isRTL: boolean = false
): BookletStructure {
  const pagesPerBooklet = sheetsPerBooklet * pagesPerSheet

  const totalPhysicalPagesNeeded = Math.ceil(totalPages / pagesPerSheet) * pagesPerSheet
  const totalBooklets = Math.ceil(totalPhysicalPagesNeeded / pagesPerBooklet) || 1
  const totalPhysicalPages = totalBooklets * pagesPerBooklet
  const totalBlankPages = Math.max(0, totalPhysicalPages - totalPages)
  const totalSheets = totalPhysicalPages / pagesPerSheet

  const pagesWithBlanks: PageNumber[] = []
  for (let i = 1; i <= totalPages; i++) pagesWithBlanks.push(i)
  for (let i = 0; i < totalBlankPages; i++) pagesWithBlanks.push(null)

  const booklets: Booklet[] = []

  for (let bookletIndex = 0; bookletIndex < totalBooklets; bookletIndex++) {
    const start = bookletIndex * pagesPerBooklet
    const bookletPages = pagesWithBlanks.slice(start, start + pagesPerBooklet)
    const imposed = pagesPerSheet === 4
      ? imposeStandardFourUp(bookletPages, sheetsPerBooklet, isRTL)
      : arrangeBookletPagesFallback(bookletPages, pagesPerSheet)
    const sheets = imposed.sheets
    const blankPages = bookletPages.filter((p) => p === null).length

    booklets.push({
      index: bookletIndex + 1,
      sheets,
      sheetCount: sheets.length,
      pages: pagesPerBooklet,
      blankPages,
      isFinal: bookletIndex === totalBooklets - 1,
      pageOrder: sheets.flat(),
    })
  }

  const pageSequence = booklets.flatMap((booklet) => booklet.sheets.flat())

  return {
    booklets,
    totalPhysicalPages,
    totalBlankPages,
    totalSheets,
    pagesPerBooklet,
    sequence: pageSequence,
  }
}

export function calculateBookletLayout(
  totalPages: number,
  sheetsPerBooklet: number,
  pagesPerSheet: number,
  isRTL: boolean = false
): BookletLayout {
  if (pagesPerSheet % 2 !== 0) {
    throw new Error('Pages per sheet must be a multiple of 2')
  }

  if (sheetsPerBooklet <= 0) {
    throw new Error('Sheets per booklet must be positive')
  }

  const {
    booklets,
    totalPhysicalPages,
    totalBlankPages,
    totalSheets,
    pagesPerBooklet,
    sequence,
  } = generateBookletStructure(totalPages, sheetsPerBooklet, pagesPerSheet, isRTL)

  const completeBooklets = Math.floor(totalPages / pagesPerBooklet)
  const remainingPages = totalPages % pagesPerBooklet
  const efficiency = totalPages > 0 ? ((totalPages / totalPhysicalPages) * 100).toFixed(1) : '0'

  return {
    totalPages,
    pagesPerSheet,
    sheetsPerBooklet,
    pagesPerBooklet,
    isRTL,
    totalBooklets: booklets.length,
    completeBooklets,
    remainingPages,
    totalSheets,
    totalPhysicalPages,
    totalBlankPages,
    efficiency: parseFloat(efficiency),
    booklets,
    sequence,
  }
}

export function findOptimalSheetsPerBooklet(totalPages: number, pagesPerSheet: number): number {
  if (totalPages <= 0) return 4

  const preferredSheetCounts = [3, 4, 5, 6, 7, 8]
  const maxPossibleSheets = Math.ceil(totalPages / pagesPerSheet)
  let candidates = preferredSheetCounts.filter((count) => count <= maxPossibleSheets)

  if (!candidates.length) {
    // For very small documents fall back to at least 2 sheets
    candidates = [Math.max(2, Math.min(maxPossibleSheets, preferredSheetCounts[0]))]
  }

  let bestSheets = candidates[0]
  let minBlankPages = Infinity

  candidates.forEach((sheets) => {
    const layout = calculateBookletLayout(totalPages, sheets, pagesPerSheet)
    if (
      layout.totalBlankPages < minBlankPages ||
      (layout.totalBlankPages === minBlankPages && sheets > bestSheets)
    ) {
      minBlankPages = layout.totalBlankPages
      bestSheets = sheets
    }
  })

  return bestSheets
}

