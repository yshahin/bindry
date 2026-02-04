import { useReducer, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import { calculateBookletLayout, findOptimalSheetsPerBooklet, type BookletLayout } from '../utils/bookletCalculator'
import { detectTextDirection, inferDirectionFromFilename, type TextDirection } from '../utils/rtlDetector'

const getRangePageCount = (start: number, end: number): number => Math.max(0, end - start + 1)

interface EnrichedBookletLayout extends BookletLayout {
  rangeStart: number
  rangeEnd: number
}

// ------------------------------------------------------------------
// State & Actions
// ------------------------------------------------------------------

export interface State {
  pdfFile: File | null
  totalPages: number
  sheetsPerBooklet: number
  pagesPerSheet: number
  pdfData: ArrayBuffer | null
  textDirection: TextDirection
  detectedDirection: TextDirection | null
  layout: EnrichedBookletLayout | null
  error: string | null
  loading: boolean
  detecting: boolean
  exporting: boolean
  rangeStart: number
  rangeEnd: number
  hasCover: boolean
  coverPages: number
}

export type Action =
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'START_FILE_LOAD' }
  | {
    type: 'FILE_LOADED';
    payload: {
      file: File;
      data: ArrayBuffer;
      totalPages: number;
      initialDirection: TextDirection
    }
  }
  | { type: 'FILE_LOAD_ERROR'; payload: string }
  | { type: 'SET_DETECTED_DIRECTION'; payload: { detected: TextDirection | null, final: TextDirection } }
  | { type: 'UPDATE_PARAM'; payload: Partial<State> }
  | { type: 'RESET_RANGE' }

export const initialState: State = {
  pdfFile: null,
  totalPages: 0,
  sheetsPerBooklet: 4,
  pagesPerSheet: 4,
  pdfData: null,
  textDirection: 'ltr',
  detectedDirection: null,
  layout: null,
  error: null,
  loading: false,
  detecting: false,
  exporting: false,
  rangeStart: 1,
  rangeEnd: 0,
  hasCover: true,
  coverPages: 2,
}

// ------------------------------------------------------------------
// Reducer Helper
// ------------------------------------------------------------------

export function recalculateLayout(state: State): State {
  const {
    totalPages, rangeStart, rangeEnd,
    sheetsPerBooklet, pagesPerSheet,
    textDirection, hasCover, coverPages
  } = state

  const pdfCapacity = totalPages
  if (pdfCapacity <= 0) {
    return { ...state, layout: null }
  }

  const startValue = Math.min(Math.max(1, rangeStart), pdfCapacity)
  const endValue = Math.min(Math.max(startValue, rangeEnd), pdfCapacity)
  const rangeLength = getRangePageCount(startValue, endValue)

  if (rangeLength <= 0) {
    return { ...state, layout: null, rangeStart: startValue, rangeEnd: endValue }
  }

  try {
    const calculatedLayout = calculateBookletLayout(
      rangeLength,
      sheetsPerBooklet,
      pagesPerSheet,
      textDirection === 'rtl',
      hasCover,
      coverPages
    )

    const enrichedLayout: EnrichedBookletLayout = {
      ...calculatedLayout,
      rangeStart: startValue,
      rangeEnd: endValue,
      isRTL: textDirection === 'rtl',
    }

    return {
      ...state,
      layout: enrichedLayout,
      error: null,
      rangeStart: startValue,
      rangeEnd: endValue
    }
  } catch (err) {
    return {
      ...state,
      layout: null,
      rangeStart: startValue,
      rangeEnd: endValue,
      error: err instanceof Error ? err.message : 'Layout calculation failed'
    }
  }
}

export function bookletReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_EXPORTING':
      return { ...state, exporting: action.payload }

    case 'START_FILE_LOAD':
      return {
        ...state,
        loading: true,
        detecting: true,
        error: null,
        layout: null,
        pdfFile: null,
        totalPages: 0,
        pdfData: null
      }

    case 'FILE_LOADED': {
      const { totalPages, initialDirection } = action.payload
      const newState = {
        ...state,
        pdfFile: action.payload.file,
        pdfData: action.payload.data,
        totalPages,
        rangeStart: 1,
        rangeEnd: totalPages,
        textDirection: initialDirection,
        detectedDirection: initialDirection,
        // Calculate initial optimal sheets
        sheetsPerBooklet: findOptimalSheetsPerBooklet(totalPages, state.pagesPerSheet, state.hasCover, state.coverPages)
      }
      return recalculateLayout(newState)
    }

    case 'FILE_LOAD_ERROR':
      return {
        ...state,
        loading: false,
        detecting: false,
        pdfFile: null,
        totalPages: 0,
        layout: null,
        pdfData: null,
        error: action.payload
      }

    case 'SET_DETECTED_DIRECTION': {
      const newState = {
        ...state,
        detectedDirection: action.payload.detected,
        textDirection: action.payload.final,
        loading: false,
        detecting: false
      }
      return recalculateLayout(newState)
    }

    case 'UPDATE_PARAM': {
      const newState = { ...state, ...action.payload }
      // Validations if needed before recalc
      if (newState.coverPages <= 0) newState.coverPages = 2
      if (newState.sheetsPerBooklet <= 0) newState.sheetsPerBooklet = 1

      // Special logic: if pagesPerSheet changed, maybe re-optimize sheetsPerBooklet?
      // Keeping it simple: trust the payload, but if user explicitly changed pagesPerSheet,
      // the handler usually handles the optimization logic.
      // However, to keep reducer pure, we can move optimization logic here if we wanted.
      // For now, let's assume the payload contains the optimized values if needed.

      return recalculateLayout(newState)
    }

    case 'RESET_RANGE': {
      if (state.totalPages <= 0) return state
      const newState = {
        ...state,
        rangeStart: 1,
        rangeEnd: state.totalPages
      }
      return recalculateLayout(newState)
    }

    default:
      return state
  }
}

// ------------------------------------------------------------------
// Hook Export
// ------------------------------------------------------------------

export interface BookletState extends State {
  selectedPageCount: number
  setError: (error: string | null) => void
  setExporting: (exporting: boolean) => void
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleSheetsPerBookletChange: (value: string) => void
  handleTextDirectionChange: (direction: TextDirection) => void
  handlePagesPerSheetChange: (value: number) => void
  useOptimalSheets: () => void
  handleRangeStartChange: (value: string) => void
  handleRangeEndChange: (value: string) => void
  handleResetRange: () => void
  handleHasCoverChange: (value: boolean) => void
  handleCoverPagesChange: (value: number) => void
}

export function useBookletState(): BookletState {
  const [state, dispatch] = useReducer(bookletReducer, initialState)

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const setExporting = useCallback((exporting: boolean) => {
    dispatch({ type: 'SET_EXPORTING', payload: exporting })
  }, [])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      dispatch({ type: 'SET_ERROR', payload: 'Please upload a PDF file' })
      return
    }

    dispatch({ type: 'START_FILE_LOAD' })

    const initialDirection = inferDirectionFromFilename(file.name)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPageCount()

      dispatch({
        type: 'FILE_LOADED',
        payload: {
          file,
          data: arrayBuffer,
          totalPages: pages,
          initialDirection
        }
      })

      // Continue with async detection
      try {
        const detected = await detectTextDirection(arrayBuffer, file.name)
        const final = (detected === 'rtl' || detected === 'ltr') ? detected : initialDirection || 'ltr'

        dispatch({
          type: 'SET_DETECTED_DIRECTION',
          payload: { detected, final }
        })
      } catch (detectErr) {
        console.warn('Could not detect text direction:', detectErr)
        dispatch({
          type: 'SET_DETECTED_DIRECTION',
          payload: { detected: 'unknown', final: initialDirection || 'ltr' }
        })
      }

    } catch (err) {
      dispatch({
        type: 'FILE_LOAD_ERROR',
        payload: `Error reading PDF: ${err instanceof Error ? err.message : 'Unknown error'}`
      })
    }
  }, [])

  const handleSheetsPerBookletChange = useCallback((value: string): void => {
    const newValue = parseInt(value) || 4
    if (newValue > 0) {
      dispatch({ type: 'UPDATE_PARAM', payload: { sheetsPerBooklet: newValue } })
    }
  }, [])

  const handleTextDirectionChange = useCallback((direction: TextDirection): void => {
    dispatch({ type: 'UPDATE_PARAM', payload: { textDirection: direction } })
  }, [])

  const handlePagesPerSheetChange = useCallback((value: number): void => {
    const newValue = parseInt(String(value)) || 2
    if (newValue > 0 && newValue % 2 === 0) {
      const selectedPages = getRangePageCount(state.rangeStart, state.rangeEnd)
      let update: Partial<State> = { pagesPerSheet: newValue }

      if (selectedPages > 0) {
        const optimalSheets = findOptimalSheetsPerBooklet(selectedPages, newValue, state.hasCover, state.coverPages)
        update.sheetsPerBooklet = optimalSheets
      }

      dispatch({ type: 'UPDATE_PARAM', payload: update })
    }
  }, [state.rangeStart, state.rangeEnd, state.hasCover, state.coverPages])

  const useOptimalSheets = useCallback((): void => {
    const selectedPages = getRangePageCount(state.rangeStart, state.rangeEnd)
    if (selectedPages > 0) {
      const optimalSheets = findOptimalSheetsPerBooklet(selectedPages, state.pagesPerSheet, state.hasCover, state.coverPages)
      dispatch({ type: 'UPDATE_PARAM', payload: { sheetsPerBooklet: optimalSheets } })
    }
  }, [state.rangeStart, state.rangeEnd, state.pagesPerSheet, state.hasCover, state.coverPages])

  const handleRangeStartChange = useCallback((value: string): void => {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      dispatch({ type: 'UPDATE_PARAM', payload: { rangeStart: parsed } })
    }
  }, [])

  const handleRangeEndChange = useCallback((value: string): void => {
    const parsed = parseInt(value, 10)
    if (!Number.isNaN(parsed)) {
      dispatch({ type: 'UPDATE_PARAM', payload: { rangeEnd: parsed } })
    }
  }, [])

  const handleResetRange = useCallback((): void => {
    dispatch({ type: 'RESET_RANGE' })
  }, [])

  const handleHasCoverChange = useCallback((value: boolean): void => {
    const selectedPages = getRangePageCount(state.rangeStart, state.rangeEnd)
    const optimalSheets = findOptimalSheetsPerBooklet(selectedPages, state.pagesPerSheet, value, state.coverPages)
    dispatch({ type: 'UPDATE_PARAM', payload: { hasCover: value, sheetsPerBooklet: optimalSheets } })
  }, [state.rangeStart, state.rangeEnd, state.pagesPerSheet, state.coverPages])

  const handleCoverPagesChange = useCallback((value: number): void => {
    const newValue = parseInt(String(value)) || 2
    if (newValue > 0 && newValue <= 10) {
      const selectedPages = getRangePageCount(state.rangeStart, state.rangeEnd)
      const optimalSheets = findOptimalSheetsPerBooklet(selectedPages, state.pagesPerSheet, state.hasCover, newValue)
      dispatch({ type: 'UPDATE_PARAM', payload: { coverPages: newValue, sheetsPerBooklet: optimalSheets } })
    }
  }, [state.rangeStart, state.rangeEnd, state.pagesPerSheet, state.hasCover])

  return {
    ...state,
    selectedPageCount: getRangePageCount(state.rangeStart, state.rangeEnd),
    setError,
    setExporting,
    handleFileUpload,
    handleSheetsPerBookletChange,
    handleTextDirectionChange,
    handlePagesPerSheetChange,
    useOptimalSheets,
    handleRangeStartChange,
    handleRangeEndChange,
    handleResetRange,
    handleHasCoverChange,
    handleCoverPagesChange,
  }
}
