import { describe, it, expect } from 'vitest'
import { bookletReducer, initialState, State } from './useBookletState'

// Mocking File object since it's not available in Node environment by default
class MockFile {
  name: string
  type: string
  constructor(_bits: any[], name: string, options?: { type?: string }) {
    this.name = name
    this.type = options?.type || ''
  }
}
global.File = MockFile as any


describe('bookletReducer', () => {

  it('should return initial state', () => {
    // We can't actually call reducer without action with useReducer,
    // but here we are testing the reducer function directly.
    // Testing start state is basically checking initialState export.
    expect(initialState.sheetsPerBooklet).toBe(4)
    expect(initialState.totalPages).toBe(0)
  })

  it('should handle SET_ERROR', () => {
    const errorMsg = 'Something went wrong'
    const newState = bookletReducer(initialState, { type: 'SET_ERROR', payload: errorMsg })
    expect(newState.error).toBe(errorMsg)
  })

  it('should handle SET_EXPORTING', () => {
    const newState = bookletReducer(initialState, { type: 'SET_EXPORTING', payload: true })
    expect(newState.exporting).toBe(true)
  })

  it('should handle START_FILE_LOAD', () => {
    const startState: State = {
      ...initialState,
      error: 'Old error',
      layout: {} as any,
      totalPages: 10
    }
    const newState = bookletReducer(startState, { type: 'START_FILE_LOAD' })

    expect(newState.loading).toBe(true)
    expect(newState.detecting).toBe(true)
    expect(newState.error).toBe(null)
    expect(newState.layout).toBe(null)
    expect(newState.pdfFile).toBe(null)
    expect(newState.totalPages).toBe(0)
    expect(newState.pdfData).toBe(null)
  })

  it('should handle FILE_LOADED and calculate layout', () => {
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' })
    const mockData = new ArrayBuffer(8)
    const totalPages = 20 // 20 pages, 4 sheets per booklet (default)

    // Default sheetsPerBooklet is 4, pagesPerSheet is 4.
    // 20 pages fits into 20 / 16 = 1.25 -> 2 booklets.

    const newState = bookletReducer(initialState, {
      type: 'FILE_LOADED',
      payload: {
        file: mockFile,
        data: mockData,
        totalPages,
        initialDirection: 'ltr'
      }
    })

    expect(newState.pdfFile).toBe(mockFile)
    expect(newState.pdfData).toBe(mockData)
    expect(newState.totalPages).toBe(totalPages)
    expect(newState.rangeStart).toBe(1)
    expect(newState.rangeEnd).toBe(totalPages)
    expect(newState.textDirection).toBe('ltr')

    // Check if layout was calculated
    expect(newState.layout).not.toBeNull()
    expect(newState.layout?.totalPages).toBe(totalPages)
  })

  it('should handle UPDATE_PARAM and recalculate layout', () => {
    // Setup state with a loaded file
    const loadedState = bookletReducer(initialState, {
      type: 'FILE_LOADED',
      payload: {
        file: new File([''], 'test.pdf', { type: 'application/pdf' }),
        data: new ArrayBuffer(0),
        totalPages: 16,
        initialDirection: 'ltr'
      }
    })

    expect(loadedState.layout).not.toBeNull()

    // Change sheets per booklet
    const newState = bookletReducer(loadedState, {
      type: 'UPDATE_PARAM',
      payload: { sheetsPerBooklet: 2 }
    })

    expect(newState.sheetsPerBooklet).toBe(2)
    expect(newState.layout?.sheetsPerBooklet).toBe(2)
  })

  it('should handle RESET_RANGE', () => {
    const loadedState = bookletReducer(initialState, {
      type: 'FILE_LOADED',
      payload: {
        file: new File([''], 'test.pdf', { type: 'application/pdf' }),
        data: new ArrayBuffer(0),
        totalPages: 20,
        initialDirection: 'ltr'
      }
    })

    // Modify range
    const modifiedRangeState = bookletReducer(loadedState, {
      type: 'UPDATE_PARAM',
      payload: { rangeStart: 5, rangeEnd: 10 }
    })
    expect(modifiedRangeState.rangeStart).toBe(5)

    // Reset
    const resetState = bookletReducer(modifiedRangeState, { type: 'RESET_RANGE' })
    expect(resetState.rangeStart).toBe(1)
    expect(resetState.rangeEnd).toBe(20)
    expect(resetState.layout?.rangeStart).toBe(1)
  })

  it('should handle invalid layout calculation gracefully', () => {
    // Force an error state essentially by providing weird inputs if possible
    // Or check error handling in recalculateLayout

    // Example: 0 pages per sheet (though handlePagesPerSheetChange prevents this before dispatch,
    // the reducer should handle it if payload is bad?)
    // Actually pagesPerSheet is checked in main loop, but let's try 0 pages total

    const newState = bookletReducer(initialState, {
      type: 'UPDATE_PARAM',
      payload: { totalPages: 0 }
    })

    expect(newState.layout).toBeNull()
  })

})
