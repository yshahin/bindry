import { useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'

export function useBookletPdfGenerator(pdfData, layout) {
  return useCallback(async () => {
    if (!pdfData || !layout || !layout.pageSequence?.length) {
      throw new Error('A PDF with a generated layout is required.')
    }

    const sourcePdf = await PDFDocument.load(pdfData)
    const bookletPdf = await PDFDocument.create()

    let defaultSize = [612, 792]
    if (sourcePdf.getPageCount() > 0) {
      const { width, height } = sourcePdf.getPage(0).getSize()
      defaultSize = [width, height]
    }

    const pageRangeOffset = Math.max(0, (layout.rangeStart ?? 1) - 1)
    for (const pageNum of layout.pageSequence) {
      if (pageNum === null) {
        bookletPdf.addPage(defaultSize)
        continue
      }

      const absoluteIndex = pageRangeOffset + pageNum - 1
      if (absoluteIndex >= 0 && absoluteIndex < sourcePdf.getPageCount()) {
        const [copiedPage] = await bookletPdf.copyPages(sourcePdf, [absoluteIndex])
        bookletPdf.addPage(copiedPage)
      } else {
        bookletPdf.addPage(defaultSize)
      }
    }

    return bookletPdf.save()
  }, [layout, pdfData])
}

export function downloadPdfBlob(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
