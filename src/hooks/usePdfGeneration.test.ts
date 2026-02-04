import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useBookletPdfGenerator } from './usePdfGeneration'
import { PDFDocument } from 'pdf-lib'
import { BookletLayout } from '../utils/bookletCalculator'

// Mock PDFDocument methods
const mockSave = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
const mockAddPage = vi.fn()
const mockCopyPages = vi.fn().mockResolvedValue(['mockCopiedPage1', 'mockCopiedPage2', 'mockCopiedPage3'])
const mockGetPageCount = vi.fn().mockReturnValue(10)
const mockGetSize = vi.fn().mockReturnValue({ width: 612, height: 792 })
const mockGetPage = vi.fn().mockReturnValue({ getSize: mockGetSize })

// We need to mock static load and create methods
const mockSourcePdf = {
  getPageCount: mockGetPageCount,
  getPage: mockGetPage,
}

const mockBookletPdf = {
  addPage: mockAddPage,
  copyPages: mockCopyPages,
  save: mockSave,
}

vi.mock('pdf-lib', () => {
  return {
    PDFDocument: {
      load: vi.fn(),
      create: vi.fn(),
    },
  }
})

describe('useBookletPdfGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(PDFDocument.load).mockResolvedValue(mockSourcePdf as any)
    vi.mocked(PDFDocument.create).mockResolvedValue(mockBookletPdf as any)
  })

  it('should throw error if input data is missing', async () => {
    const { result } = renderHook(() => useBookletPdfGenerator(null, null))
    await expect(result.current()).rejects.toThrow('A PDF with a generated layout is required.')
  })

  it('should generate a PDF with correct page sequence', async () => {
    const mockPdfData = new ArrayBuffer(10)
    const mockLayout: BookletLayout = {
      sequence: [1, null, 2], // 1st page, blank, 2nd page
      rangeStart: 1,
      rangeEnd: 10,
      totalPages: 10,
      pagesPerSheet: 4,
      sheetsPerBooklet: 4,
      isRTL: false,
      totalBooklets: 1,
      completeBooklets: 0,
      remainingPages: 0,
      efficiency: 100,
      totalPhysicalPages: 0,
      totalBlankPages: 0,
      totalSheets: 0,
      pagesPerBooklet: 0,
      booklets: []
    }

    // Mock copyPages implementation for this test
    const copiedPages = ['page1_copy', 'page2_copy']
    mockCopyPages.mockResolvedValueOnce(copiedPages)

    const { result } = renderHook(() => useBookletPdfGenerator(mockPdfData, mockLayout))

    const pdfBytes = await result.current()

    expect(PDFDocument.load).toHaveBeenCalledWith(mockPdfData)
    expect(PDFDocument.create).toHaveBeenCalled()

    // Check optimization: copyPages called once with all valid indices
    // 1 -> index 0
    // 2 -> index 1
    expect(mockCopyPages).toHaveBeenCalledWith(mockSourcePdf, [0, 1])

    // Check addPage calls
    // It should add pages in sequence order
    expect(mockAddPage).toHaveBeenCalledTimes(3)

    // 1st page: copiedPages[0]
    expect(mockAddPage).toHaveBeenNthCalledWith(1, 'page1_copy')

    // 2nd page: blank (default size)
    expect(mockAddPage).toHaveBeenNthCalledWith(2, [612, 792])

    // 3rd page: copiedPages[1]
    expect(mockAddPage).toHaveBeenNthCalledWith(3, 'page2_copy')

    expect(pdfBytes).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('should handle page ranges correctly', async () => {
    const mockPdfData = new ArrayBuffer(10)
    // Range starts at 5. So layout sequence 1 refers to actual page 5 (index 4)
    const mockLayout: BookletLayout = {
      sequence: [1, 2],
      rangeStart: 5,
      rangeEnd: 10,
      totalPages: 10,
      pagesPerSheet: 4,
      sheetsPerBooklet: 4,
      isRTL: false,
      totalBooklets: 1,
      completeBooklets: 0,
      remainingPages: 0,
      efficiency: 100,
      totalPhysicalPages: 0,
      totalBlankPages: 0,
      totalSheets: 0,
      pagesPerBooklet: 0,
      booklets: []
    }

    mockCopyPages.mockResolvedValueOnce(['p5_copy', 'p6_copy'])

    const { result } = renderHook(() => useBookletPdfGenerator(mockPdfData, mockLayout))
    await result.current()

    // Expected indices:
    // 1 -> 5 (start offset 4 + 1 - 1 = 4)
    // 2 -> 6 (start offset 4 + 2 - 1 = 5)
    expect(mockCopyPages).toHaveBeenCalledWith(mockSourcePdf, [4, 5])
  })
})
