import { describe, it, expect } from 'vitest'
import { inferDirectionFromFilename } from './rtlDetector'

describe('inferDirectionFromFilename', () => {
  it('should default to ltr for empty filename', () => {
    expect(inferDirectionFromFilename('')).toBe('ltr')
    expect(inferDirectionFromFilename(undefined)).toBe('ltr')
  })

  it('should detect rtl from keywords', () => {
    expect(inferDirectionFromFilename('my-arabic-book.pdf')).toBe('rtl')
    expect(inferDirectionFromFilename('hebrew_doc.pdf')).toBe('rtl')
    expect(inferDirectionFromFilename('study_guide_rtl.pdf')).toBe('rtl')
    expect(inferDirectionFromFilename('urdu_poetry.pdf')).toBe('rtl')
    expect(inferDirectionFromFilename('Farsi_History.pdf')).toBe('rtl')
  })

  it('should detect rtl from unicode characters', () => {
    expect(inferDirectionFromFilename('كتاب.pdf')).toBe('rtl') // Arabic
    expect(inferDirectionFromFilename('ספר.pdf')).toBe('rtl') // Hebrew
  })

  it('should return ltr for ltr filenames', () => {
    expect(inferDirectionFromFilename('english-book.pdf')).toBe('ltr')
    expect(inferDirectionFromFilename('math_notes.pdf')).toBe('ltr')
    expect(inferDirectionFromFilename('123456.pdf')).toBe('ltr')
  })

  it('should be case insensitive', () => {
    expect(inferDirectionFromFilename('ARABIC_BOOK.pdf')).toBe('rtl')
  })
})
