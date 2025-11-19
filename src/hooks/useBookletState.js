import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import { calculateBookletLayout, findOptimalSheetsPerBooklet } from '../utils/bookletCalculator'
import { detectTextDirection, inferDirectionFromFilename } from '../utils/rtlDetector'

const getRangePageCount = (start, end) => Math.max(0, end - start + 1)

export function useBookletState() {
  const [pdfFile, setPdfFile] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [sheetsPerBooklet, setSheetsPerBooklet] = useState(4)
  const [pagesPerSheet, setPagesPerSheet] = useState(4)
  const [pdfData, setPdfData] = useState(null)
  const [textDirection, setTextDirection] = useState('ltr')
  const [detectedDirection, setDetectedDirection] = useState(null)
  const [layout, setLayout] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(0)

  const applyRangeLayout = useCallback((options = {}) => {
    const pdfCapacity = options.pdfTotalPages ?? totalPages
    if (!pdfCapacity || pdfCapacity <= 0) {
      setLayout(null)
      return null
    }

    const startValue = Math.min(Math.max(1, options.rangeStart ?? rangeStart), pdfCapacity)
    const endValue = Math.min(
      Math.max(startValue, options.rangeEnd ?? rangeEnd),
      pdfCapacity,
    )

    const rangeLength = getRangePageCount(startValue, endValue)
    if (rangeLength <= 0) {
      setLayout(null)
      return null
    }

    const isRTL = options.isRTL ?? textDirection === 'rtl'
    const sheetsValue = options.sheetsPerBooklet ?? sheetsPerBooklet
    const perSheetValue = options.pagesPerSheet ?? pagesPerSheet

    try {
      const calculatedLayout = calculateBookletLayout(rangeLength, sheetsValue, perSheetValue, isRTL)
      const enrichedLayout = {
        ...calculatedLayout,
        rangeStart: startValue,
        rangeEnd: endValue,
        isRTL,
      }
      setLayout(enrichedLayout)
      setError(null)
      return enrichedLayout
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [pagesPerSheet, rangeEnd, rangeStart, sheetsPerBooklet, textDirection, totalPages])

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setLoading(true)
    setDetecting(true)
    setError(null)
    const initialDirection = inferDirectionFromFilename(file.name)
    setTextDirection(initialDirection)
    setDetectedDirection(initialDirection)

    try {
      const arrayBuffer = await file.arrayBuffer()
      setPdfData(arrayBuffer)
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPageCount()

      setPdfFile(file)
      setTotalPages(pages)
      const defaultStart = 1
      const defaultEnd = pages
      setRangeStart(defaultStart)
      setRangeEnd(defaultEnd)

      let detectedDir = initialDirection || 'ltr'
      try {
        const detected = await detectTextDirection(arrayBuffer, file.name)
        setDetectedDirection(detected)
        if (detected === 'rtl' || detected === 'ltr') {
          detectedDir = detected
          setTextDirection(detected)
        }
      } catch (detectErr) {
        console.warn('Could not detect text direction:', detectErr)
        setDetectedDirection('unknown')
      }

      if (pages > 0) {
        const isRTL = detectedDir === 'rtl'
        const optimalSheets = findOptimalSheetsPerBooklet(pages, pagesPerSheet)
        setSheetsPerBooklet(optimalSheets)
        applyRangeLayout({
          rangeStart: defaultStart,
          rangeEnd: defaultEnd,
          sheetsPerBooklet: optimalSheets,
          isRTL,
          pdfTotalPages: pages,
        })
      }
    } catch (err) {
      setError(`Error reading PDF: ${err.message}`)
      setPdfFile(null)
      setTotalPages(0)
      setLayout(null)
      setDetectedDirection(null)
      setPdfData(null)
    } finally {
      setLoading(false)
      setDetecting(false)
    }
  }, [applyRangeLayout, pagesPerSheet])

  const handleSheetsPerBookletChange = useCallback((value) => {
    const newValue = parseInt(value) || 4
    if (newValue > 0) {
      setSheetsPerBooklet(newValue)
      if (getRangePageCount(rangeStart, rangeEnd) > 0) {
        applyRangeLayout({ sheetsPerBooklet: newValue })
      }
    }
  }, [applyRangeLayout, rangeEnd, rangeStart])

  const handleTextDirectionChange = useCallback((direction) => {
    setTextDirection(direction)
    if (getRangePageCount(rangeStart, rangeEnd) > 0) {
      applyRangeLayout({ isRTL: direction === 'rtl' })
    }
  }, [applyRangeLayout, rangeEnd, rangeStart])

  const handlePagesPerSheetChange = useCallback((value) => {
    const newValue = parseInt(value) || 2
    if (newValue > 0 && newValue % 2 === 0) {
      setPagesPerSheet(newValue)
      const selectedPages = getRangePageCount(rangeStart, rangeEnd)
      if (selectedPages > 0) {
        const isRTL = textDirection === 'rtl'
        const optimalSheets = findOptimalSheetsPerBooklet(selectedPages, newValue)
        setSheetsPerBooklet(optimalSheets)
        applyRangeLayout({
          sheetsPerBooklet: optimalSheets,
          pagesPerSheet: newValue,
          isRTL,
        })
      }
    }
  }, [applyRangeLayout, rangeEnd, rangeStart, textDirection])

  const useOptimalSheets = useCallback(() => {
    const selectedPages = getRangePageCount(rangeStart, rangeEnd)
    if (selectedPages > 0) {
      const isRTL = textDirection === 'rtl'
      const optimalSheets = findOptimalSheetsPerBooklet(selectedPages, pagesPerSheet)
      setSheetsPerBooklet(optimalSheets)
      applyRangeLayout({
        sheetsPerBooklet: optimalSheets,
        isRTL,
      })
    }
  }, [applyRangeLayout, pagesPerSheet, rangeEnd, rangeStart, textDirection])

  const handleRangeStartChange = useCallback((value) => {
    if (totalPages <= 0) return
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    const boundedStart = Math.min(Math.max(1, parsed), totalPages)
    const boundedEnd = Math.min(Math.max(boundedStart, rangeEnd), totalPages)
    setRangeStart(boundedStart)
    setRangeEnd(boundedEnd)
    applyRangeLayout({ rangeStart: boundedStart, rangeEnd: boundedEnd })
  }, [applyRangeLayout, rangeEnd, totalPages])

  const handleRangeEndChange = useCallback((value) => {
    if (totalPages <= 0) return
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    const boundedEnd = Math.min(Math.max(rangeStart, parsed), totalPages)
    setRangeEnd(boundedEnd)
    applyRangeLayout({ rangeEnd: boundedEnd })
  }, [applyRangeLayout, rangeStart, totalPages])

  return {
    // State
    pdfFile,
    totalPages,
    sheetsPerBooklet,
    pagesPerSheet,
    pdfData,
    textDirection,
    detectedDirection,
    layout,
    error,
    loading,
    detecting,
    exporting,
    rangeStart,
    rangeEnd,
    selectedPageCount: getRangePageCount(rangeStart, rangeEnd),
    // Setters
    setError,
    setExporting,
    // Handlers
    handleFileUpload,
    handleSheetsPerBookletChange,
    handleTextDirectionChange,
    handlePagesPerSheetChange,
    useOptimalSheets,
    handleRangeStartChange,
    handleRangeEndChange,
  }
}
