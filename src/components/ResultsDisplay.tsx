import { type BookletLayout } from '../utils/bookletCalculator'

interface ResultsSummaryProps {
  onPrint: () => void
  exporting: boolean
}

function ResultsSummary({ onPrint, exporting }: ResultsSummaryProps) {
  return (
    <div className="results-header">
      <h2>Layout Results</h2>
      <button
        type="button"
        onClick={onPrint}
        className="print-button"
        title="Generate a booklet-ready PDF"
        disabled={exporting}
      >
        {exporting ? 'Generating…' : '🖨️ Generate PDF'}
      </button>
    </div>
  )
}

interface ResultsGridProps {
  layout: BookletLayout
}

function ResultsGrid({ layout }: ResultsGridProps) {
  return (
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
  )
}

interface DetailsBreakdownProps {
  layout: BookletLayout
  totalPages: number
}

function DetailsBreakdown({ layout, totalPages }: DetailsBreakdownProps) {
  return (
    <div className="details-section">
      <h3>Detailed Breakdown</h3>
      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-label">Total PDF Pages:</span>
          <span className="detail-value">{totalPages}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Selected Range:</span>
          <span className="detail-value">
            {layout.rangeStart}–{layout.rangeEnd} ({layout.totalPages} page{layout.totalPages === 1 ? '' : 's'})
          </span>
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
  )
}

interface ResultsDisplayProps {
  layout: BookletLayout
  totalPages: number
  onPrint: () => void
  exporting: boolean
}

export default function ResultsDisplay({ layout, totalPages, onPrint, exporting }: ResultsDisplayProps) {
  return (
    <div className="results-section">
      <ResultsSummary onPrint={onPrint} exporting={exporting} />
      <ResultsGrid layout={layout} />
      <DetailsBreakdown layout={layout} totalPages={totalPages} />
    </div>
  )
}
