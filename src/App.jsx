import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import { calculateBookletLayout, findOptimalSheetsPerBooklet } from './utils/bookletCalculator'
import { detectTextDirection, inferDirectionFromFilename } from './utils/rtlDetector'
import './App.css'

function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [sheetsPerBooklet, setSheetsPerBooklet] = useState(4)
  const [pagesPerSheet, setPagesPerSheet] = useState(4)
  const [pdfData, setPdfData] = useState(null)
  const [textDirection, setTextDirection] = useState('ltr') // 'ltr', 'rtl', 'auto'
  const [detectedDirection, setDetectedDirection] = useState(null)
  const [layout, setLayout] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [exporting, setExporting] = useState(false)

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

      // Detect text direction
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

      // Auto-calculate optimal sheets per booklet if we have pages
      if (pages > 0) {
        const isRTL = detectedDir === 'rtl'
        const optimalSheets = findOptimalSheetsPerBooklet(pages, pagesPerSheet)
        setSheetsPerBooklet(optimalSheets)
        const calculatedLayout = calculateBookletLayout(pages, optimalSheets, pagesPerSheet, isRTL)
        setLayout(calculatedLayout)
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
  }, [pagesPerSheet, textDirection])

  const handleSheetsPerBookletChange = (value) => {
    const newValue = parseInt(value) || 4
    if (newValue > 0) {
      setSheetsPerBooklet(newValue)
      if (totalPages > 0) {
        try {
          const isRTL = textDirection === 'rtl'
          const calculatedLayout = calculateBookletLayout(totalPages, newValue, pagesPerSheet, isRTL)
          setLayout(calculatedLayout)
        } catch (err) {
          setError(err.message)
        }
      }
    }
  }

  const handleTextDirectionChange = (direction) => {
    setTextDirection(direction)
    if (totalPages > 0) {
      try {
        const isRTL = direction === 'rtl'
        const calculatedLayout = calculateBookletLayout(totalPages, sheetsPerBooklet, pagesPerSheet, isRTL)
        setLayout(calculatedLayout)
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handlePagesPerSheetChange = (value) => {
    const newValue = parseInt(value) || 2
    if (newValue > 0 && newValue % 2 === 0) {
      setPagesPerSheet(newValue)
      if (totalPages > 0) {
        try {
          const isRTL = textDirection === 'rtl'
          // Recalculate optimal sheets per booklet for new pages per sheet
          const optimalSheets = findOptimalSheetsPerBooklet(totalPages, newValue)
          setSheetsPerBooklet(optimalSheets)
          const calculatedLayout = calculateBookletLayout(totalPages, optimalSheets, newValue, isRTL)
          setLayout(calculatedLayout)
        } catch (err) {
          setError(err.message)
        }
      }
    }
  }

  const useOptimalSheets = () => {
    if (totalPages > 0) {
      const isRTL = textDirection === 'rtl'
      const optimalSheets = findOptimalSheetsPerBooklet(totalPages, pagesPerSheet)
      setSheetsPerBooklet(optimalSheets)
      const calculatedLayout = calculateBookletLayout(totalPages, optimalSheets, pagesPerSheet, isRTL)
      setLayout(calculatedLayout)
    }
  }

  const generateBookletPdf = useCallback(async () => {
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

    for (const pageNum of layout.pageSequence) {
      if (pageNum === null) {
        bookletPdf.addPage(defaultSize)
      } else if (pageNum >= 1 && pageNum <= sourcePdf.getPageCount()) {
        const [copiedPage] = await bookletPdf.copyPages(sourcePdf, [pageNum - 1])
        bookletPdf.addPage(copiedPage)
      } else {
        bookletPdf.addPage(defaultSize)
      }
    }

    return bookletPdf.save()
  }, [layout, pdfData])

  const handlePrint = async () => {
    if (!layout || !pdfData) {
      setError('Upload a PDF and generate a layout before exporting.')
      return
    }

    setExporting(true)
    try {
      const pdfBytes = await generateBookletPdf()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const baseName = pdfFile?.name?.replace(/\.pdf$/i, '') || 'booklet'
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseName}-booklet.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError(`Unable to generate booklet PDF: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>📚 Booklet Layout Optimizer</h1>
          <p>Calculate optimal booklet layouts to minimize blank pages</p>
        </header>

        <div className="upload-section">
          <div className="upload-area">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              id="pdf-upload"
              className="file-input"
            />
            <label htmlFor="pdf-upload" className="upload-label">
              {loading ? (
                <span>Loading PDF...</span>
              ) : pdfFile ? (
                <div className="file-info">
                  <span className="file-name">✓ {pdfFile.name}</span>
                  <span className="file-pages">{totalPages} pages</span>
                </div>
              ) : (
                <div>
                  <span className="upload-icon">📄</span>
                  <span>Click to upload PDF</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {totalPages > 0 && (
          <>
            <div className="controls-section">
              <h2>Layout Settings</h2>

              <div className="control-group">
                <label>
                  Pages per Sheet (front + back)
                  <span className="hint">Must be multiple of 2</span>
                </label>
                  <div className="quick-buttons">
                    {[4, 8, 16].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePagesPerSheetChange(val)}
                      className={pagesPerSheet === val ? 'active' : ''}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <label>
                  Text Direction
                  <span className="hint">
                    {detectedDirection && detectedDirection !== 'unknown' && (
                      <span className="detected-hint">
                        Detected: {detectedDirection.toUpperCase()}
                      </span>
                    )}
                    {detectedDirection === 'unknown' && (
                      <span className="detected-hint">Could not auto-detect</span>
                    )}
                    {!detectedDirection && detecting && (
                      <span className="detected-hint">Detecting...</span>
                    )}
                  </span>
                </label>
                <div className="direction-buttons">
                  <button
                    type="button"
                    onClick={() => handleTextDirectionChange('ltr')}
                    className={textDirection === 'ltr' ? 'active' : ''}
                    title="Left-to-Right (English, European languages)"
                  >
                    ← LTR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTextDirectionChange('rtl')}
                    className={textDirection === 'rtl' ? 'active' : ''}
                    title="Right-to-Left (Arabic, Hebrew)"
                  >
                    RTL →
                  </button>
                </div>
              </div>

              <div className="control-group">
                <label htmlFor="sheets-per-booklet">
                  Sheets per Booklet (Signature)
                  <span className="hint">Control how many sheets get folded into each booklet</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    id="sheets-per-booklet"
                    min="1"
                    step="1"
                    value={sheetsPerBooklet}
                    onChange={(e) => handleSheetsPerBookletChange(e.target.value)}
                    className="number-input"
                  />
                  <button
                    type="button"
                    onClick={useOptimalSheets}
                    className="optimize-button"
                    title="Find optimal sheet count to minimize blank pages"
                  >
                    🎯 Optimize
                  </button>
                </div>
                <div className="computed-hint">
                  Each booklet = {sheetsPerBooklet * pagesPerSheet} pages
                </div>
              </div>
            </div>

            {layout && (
              <div className="results-section">
                <div className="results-header">
                  <h2>Layout Results</h2>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="print-button"
                    title="Generate a booklet-ready PDF"
                    disabled={exporting}
                  >
                    {exporting ? 'Generating…' : '🖨️ Generate PDF'}
                  </button>
                </div>

                <div className="results-grid">
                  <div className="result-card primary">
                    <div className="result-label">Total Blank Pages</div>
                    <div className="result-value">{layout.totalBlankPages}</div>
                  </div>

                  <div className="result-card">
                    <div className="result-label">Total Booklets</div>
                    <div className="result-value">{layout.totalBooklets}</div>
                  </div>

                  <div className="result-card">
                    <div className="result-label">Total Sheets</div>
                    <div className="result-value">{layout.totalSheets}</div>
                  </div>

                  <div className="result-card">
                    <div className="result-label">Pages per Booklet</div>
                    <div className="result-value">{layout.pagesPerBooklet}</div>
                  </div>

                  <div className="result-card">
                    <div className="result-label">Efficiency</div>
                    <div className="result-value">{layout.efficiency}%</div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Detailed Breakdown</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Total PDF Pages:</span>
                      <span className="detail-value">{layout.totalPages}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Pages per Sheet:</span>
                      <span className="detail-value">{layout.pagesPerSheet}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Sheets per Booklet:</span>
                      <span className="detail-value">{layout.sheetsPerBooklet}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Pages per Booklet:</span>
                      <span className="detail-value">{layout.pagesPerBooklet}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Complete Booklets:</span>
                      <span className="detail-value">{layout.completeBooklets}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Remaining Pages (final booklet):</span>
                      <span className="detail-value">
                        {layout.remainingPages || 0}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Blank Pages (final booklet):</span>
                      <span className="detail-value">{layout.totalBlankPages}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Text Direction:</span>
                      <span className="detail-value">{layout.isRTL ? 'RTL' : 'LTR'}</span>
                    </div>
                  </div>
                </div>

                {layout.booklets && layout.booklets.length > 0 && (
                  <div className="booklets-section">
                    <h3>Booklets / Signatures</h3>
                    <div className="page-order-info">
                      <p className="order-note">
                        {layout.isRTL
                          ? 'RTL order: Pages arranged right-to-left. Only the final booklet can contain blank pages.'
                          : 'LTR order: Pages arranged left-to-right. Only the final booklet can contain blank pages.'}
                      </p>
                    </div>
                    <div className="booklets-container">
                      {layout.booklets.map((booklet) => (
                        <div key={booklet.index} className="booklet-card">
                          <div className="booklet-header">
                            <div>
                              <div className="booklet-title">Booklet {booklet.index}</div>
                              <div className="booklet-meta">
                                {booklet.sheetCount} sheets · {booklet.sheetCount * layout.pagesPerSheet} pages
                              </div>
                            </div>
                            {booklet.blankPages > 0 && (
                              <span className="blank-chip">
                                {booklet.blankPages} blank page{booklet.blankPages === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                          <div className="sheets-container">
                            {booklet.sheets.map((sheet, sheetIndex) => (
                              <div key={sheetIndex} className="sheet-card">
                                <div className="sheet-header">Sheet {sheetIndex + 1}</div>
                                <div className="sheet-layout">
                                  <div className="sheet-side front">
                                    <div className="side-label">Front</div>
                                    <div className="pages-row">
                                      {sheet.slice(0, sheet.length / 2).map((page, idx) => (
                                        <span
                                          key={idx}
                                          className={`page-number ${page === null ? 'blank' : ''}`}
                                        >
                                          {page === null ? '—' : page}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="sheet-side back">
                                    <div className="side-label">Back</div>
                                    <div className="pages-row">
                                      {sheet.slice(sheet.length / 2).map((page, idx) => (
                                        <span
                                          key={idx}
                                          className={`page-number ${page === null ? 'blank' : ''}`}
                                        >
                                          {page === null ? '—' : page}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App

