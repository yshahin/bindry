import { type BookletLayout, type Booklet, type PageNumber } from '../utils/bookletCalculator'

interface SheetCardProps {
  sheet: PageNumber[]
  sheetIndex: number
  layoutRangeStart: number
}

function SheetCard({ sheet, sheetIndex, layoutRangeStart }: SheetCardProps) {
  return (
    <div className="sheet-card">
      <div className="sheet-header">Sheet {sheetIndex + 1}</div>
      <div className="sheet-layout">
        <div className="sheet-side front">
          <div className="side-label">Front</div>
          <div className="pages-row">
            {sheet.slice(0, sheet.length / 2).map((page, idx) => {
              const absolutePage = page === null ? null : layoutRangeStart + page - 1
              return (
                <span
                  key={idx}
                  className={`page-number ${page === null ? 'blank' : ''}`}
                >
                  {absolutePage === null ? '—' : absolutePage}
                </span>
              )
            })}
          </div>
        </div>
        <div className="sheet-side back">
          <div className="side-label">Back</div>
          <div className="pages-row">
            {sheet.slice(sheet.length / 2).map((page, idx) => {
              const absolutePage = page === null ? null : layoutRangeStart + page - 1
              return (
                <span
                  key={idx}
                  className={`page-number ${page === null ? 'blank' : ''}`}
                >
                  {absolutePage === null ? '—' : absolutePage}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface BookletCardProps {
  booklet: Booklet
  layout: BookletLayout
  layoutRangeStart: number
}

function BookletCard({ booklet, layout, layoutRangeStart }: BookletCardProps) {
  const pagesPerBooklet = layout.pagesPerBooklet || booklet.pages || 0
  const relativeRangeStart = (booklet.index - 1) * pagesPerBooklet + 1
  const relativeRangeEnd = relativeRangeStart + pagesPerBooklet - 1

  return (
    <div className="booklet-card">
      <div className="booklet-header">
        <div>
          <div className="booklet-title">Booklet {booklet.index}</div>
          <div className="booklet-meta">
            <span>
              {booklet.sheetCount} sheets · {booklet.sheetCount * layout.pagesPerSheet} pages
            </span>
            <span className="booklet-range">
              Pages {relativeRangeStart}–{relativeRangeEnd}
            </span>
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
          <SheetCard
            key={sheetIndex}
            sheet={sheet}
            sheetIndex={sheetIndex}
            layoutRangeStart={layoutRangeStart}
          />
        ))}
      </div>
    </div>
  )
}

interface BookletViewProps {
  layout: BookletLayout | null
  layoutRangeStart: number
}

export default function BookletView({ layout, layoutRangeStart }: BookletViewProps) {
  if (!layout?.booklets || layout.booklets.length === 0) {
    return null
  }

  return (
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
          <BookletCard
            key={booklet.index}
            booklet={booklet}
            layout={layout}
            layoutRangeStart={layoutRangeStart}
          />
        ))}
      </div>
    </div>
  )
}
