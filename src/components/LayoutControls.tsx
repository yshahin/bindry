import { type TextDirection } from '../utils/rtlDetector'

interface PagesPerSheetControlProps {
  pagesPerSheet: number
  onPagesPerSheetChange: (value: number) => void
}

function PagesPerSheetControl({ pagesPerSheet, onPagesPerSheetChange }: PagesPerSheetControlProps) {
  return (
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
            onClick={() => onPagesPerSheetChange(val)}
            className={pagesPerSheet === val ? 'active' : ''}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  )
}

interface PrintRangeControlProps {
  rangeStart: number
  rangeEnd: number
  totalPages: number
  selectedPageCount: number
  onRangeStartChange: (value: string) => void
  onRangeEndChange: (value: string) => void
  onResetRange: () => void
}

function PrintRangeControl({
  rangeStart,
  rangeEnd,
  totalPages,
  selectedPageCount,
  onRangeStartChange,
  onRangeEndChange,
  onResetRange
}: PrintRangeControlProps) {
  return (
    <div className="control-group">
      <label>
        Print Range
        <span className="hint">Choose the start and end page for the booklet</span>
      </label>
      <div className="range-inputs">
        <input
          type="number"
          min="1"
          max={totalPages}
          value={rangeStart}
          onChange={(e) => onRangeStartChange(e.target.value)}
          className="number-input"
        />
        <span className="range-separator">—</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={rangeEnd}
          onChange={(e) => onRangeEndChange(e.target.value)}
          className="number-input"
        />
        <button
          type="button"
          onClick={onResetRange}
          className="optimize-button"
          title="Reset to full page range"
          disabled={rangeStart === 1 && rangeEnd === totalPages}
        >
          🔄 Reset
        </button>
      </div>
      <div className="range-hint">
        Printing {selectedPageCount} page{selectedPageCount === 1 ? '' : 's'} from {rangeStart} to {rangeEnd}
      </div>
    </div>
  )
}

interface TextDirectionControlProps {
  textDirection: TextDirection
  detectedDirection: TextDirection | null
  detecting: boolean
  onTextDirectionChange: (direction: TextDirection) => void
}

function TextDirectionControl({
  textDirection,
  detectedDirection,
  detecting,
  onTextDirectionChange
}: TextDirectionControlProps) {
  return (
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
          onClick={() => onTextDirectionChange('ltr')}
          className={textDirection === 'ltr' ? 'active' : ''}
          title="Left-to-Right (English, European languages)"
        >
          ← LTR
        </button>
        <button
          type="button"
          onClick={() => onTextDirectionChange('rtl')}
          className={textDirection === 'rtl' ? 'active' : ''}
          title="Right-to-Left (Arabic, Hebrew)"
        >
          RTL →
        </button>
      </div>
    </div>
  )
}

interface SheetsPerBookletControlProps {
  sheetsPerBooklet: number
  pagesPerSheet: number
  onSheetsPerBookletChange: (value: string) => void
  onOptimize: () => void
}

function SheetsPerBookletControl({
  sheetsPerBooklet,
  pagesPerSheet,
  onSheetsPerBookletChange,
  onOptimize
}: SheetsPerBookletControlProps) {
  return (
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
          onChange={(e) => onSheetsPerBookletChange(e.target.value)}
          className="number-input"
        />
        <button
          type="button"
          onClick={onOptimize}
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
  )
}

interface BookCoverControlProps {
  hasCover: boolean
  coverPages: number
  onHasCoverChange: (value: boolean) => void
  onCoverPagesChange: (value: number) => void
}

function BookCoverControl({
  hasCover,
  coverPages,
  onHasCoverChange,
  onCoverPagesChange
}: BookCoverControlProps) {
  return (
    <div className="control-group">
      <label>
        Book Cover
        <span className="hint">Add blank pages at beginning and end for gluing the cover</span>
      </label>
      <div className="input-group">
        <input
          type="number"
          id="cover-pages"
          min="1"
          max="10"
          step="1"
          value={coverPages}
          onChange={(e) => onCoverPagesChange(Number(e.target.value))}
          className="number-input"
          disabled={!hasCover}
        />
        <button
          type="button"
          onClick={() => onHasCoverChange(!hasCover)}
          className={hasCover ? 'optimize-button active' : 'optimize-button'}
          title={hasCover ? 'Remove cover pages' : 'Add cover pages'}
        >
          📕 Book Cover
        </button>
      </div>
      {hasCover && (
        <div className="computed-hint">
          Total: {coverPages * 2} blank pages ({coverPages} at start, {coverPages} at end)
        </div>
      )}
    </div>
  )
}

interface LayoutControlsProps {
  pagesPerSheet: number
  rangeStart: number
  rangeEnd: number
  totalPages: number
  selectedPageCount: number
  textDirection: TextDirection
  detectedDirection: TextDirection | null
  detecting: boolean
  sheetsPerBooklet: number
  hasCover: boolean
  coverPages: number
  onPagesPerSheetChange: (value: number) => void
  onRangeStartChange: (value: string) => void
  onRangeEndChange: (value: string) => void
  onResetRange: () => void
  onTextDirectionChange: (direction: TextDirection) => void
  onSheetsPerBookletChange: (value: string) => void
  onOptimize: () => void
  onHasCoverChange: (value: boolean) => void
  onCoverPagesChange: (value: number) => void
}

export default function LayoutControls({
  pagesPerSheet,
  rangeStart,
  rangeEnd,
  totalPages,
  selectedPageCount,
  textDirection,
  detectedDirection,
  detecting,
  sheetsPerBooklet,
  hasCover,
  coverPages,
  onPagesPerSheetChange,
  onRangeStartChange,
  onRangeEndChange,
  onResetRange,
  onTextDirectionChange,
  onSheetsPerBookletChange,
  onOptimize,
  onHasCoverChange,
  onCoverPagesChange
}: LayoutControlsProps) {
  return (
    <div className="controls-section">
      <h2>Layout Settings</h2>

      <PagesPerSheetControl
        pagesPerSheet={pagesPerSheet}
        onPagesPerSheetChange={onPagesPerSheetChange}
      />

      <BookCoverControl
        hasCover={hasCover}
        coverPages={coverPages}
        onHasCoverChange={onHasCoverChange}
        onCoverPagesChange={onCoverPagesChange}
      />

      <PrintRangeControl
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalPages={totalPages}
        selectedPageCount={selectedPageCount}
        onRangeStartChange={onRangeStartChange}
        onRangeEndChange={onRangeEndChange}
        onResetRange={onResetRange}
      />

      <TextDirectionControl
        textDirection={textDirection}
        detectedDirection={detectedDirection}
        detecting={detecting}
        onTextDirectionChange={onTextDirectionChange}
      />

      <SheetsPerBookletControl
        sheetsPerBooklet={sheetsPerBooklet}
        pagesPerSheet={pagesPerSheet}
        onSheetsPerBookletChange={onSheetsPerBookletChange}
        onOptimize={onOptimize}
      />
    </div>
  )
}
