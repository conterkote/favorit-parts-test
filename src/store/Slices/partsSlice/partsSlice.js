import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { partsApi } from '@Store/APIs/partsApi/partsApi'
import { normalizeManufacturers, normalizeOffers } from '@Store/APIs/partsApi/normalizers'

const resource = () => ({ items: [], status: 'idle', error: null, requestId: null })

const initialState = {
  article: '',
  searchedArticle: '',
  selectedBrand: '',
  stage: 'manufacturers',
  testMode: null,
  manufacturers: resource(),
  offers: resource(),
}

const errorMessage = (error) => {
  if (error instanceof TypeError)
    return 'Нет связи с сервером. Проверьте подключение и повторите запрос.'

  return error instanceof Error && error.message ? error.message : 'Не удалось выполнить запрос.'
}

export const fetchManufacturers = createAsyncThunk(
  'parts/fetchManufacturers',
  async (number, { signal, rejectWithValue }) => {
    try {
      const payload = await partsApi.getManufacturers(number, signal)

      return { items: normalizeManufacturers(payload.goods), testMode: payload.meta.testMode }
    } catch (error) {
      if (signal.aborted) throw error

      return rejectWithValue(errorMessage(error))
    }
  },
)

export const fetchOffers = createAsyncThunk(
  'parts/fetchOffers',
  async (params, { signal, rejectWithValue }) => {
    try {
      const payload = await partsApi.getOffers(params, signal)

      return {
        items: normalizeOffers(payload.goods, params.brand, params.number),
        testMode: payload.meta.testMode,
      }
    } catch (error) {
      if (signal.aborted) throw error

      return rejectWithValue(errorMessage(error))
    }
  },
  {
    condition: ({ number, brand }, { getState }) => {
      const { parts } = getState()

      return (
        parts.stage === 'offers' &&
        parts.selectedBrand === brand &&
        parts.searchedArticle === number &&
        parts.offers.status !== 'success'
      )
    },
  },
)

function bindResource(builder, thunk, getResource, onPending, preserveItems = false) {
  builder.addCase(thunk.pending, (state, action) => {
    const current = getResource(state)

    if (!preserveItems) current.items = []

    current.status = 'loading'
    current.error = null
    current.requestId = action.meta.requestId
    onPending?.(state, action.meta.arg)
  })

  builder.addCase(thunk.fulfilled, (state, action) => {
    const current = getResource(state)

    if (current.requestId !== action.meta.requestId) return

    current.items = action.payload.items
    current.status = 'success'
    current.error = null
    current.requestId = null

    if (typeof action.payload.testMode === 'boolean') state.testMode = action.payload.testMode
  })

  builder.addCase(thunk.rejected, (state, action) => {
    const current = getResource(state)

    if (current.requestId !== action.meta.requestId) return

    if (!preserveItems) current.items = []

    current.status = action.meta.aborted ? (current.items.length ? 'success' : 'idle') : 'error'
    current.error = action.meta.aborted ? null : action.payload || 'Не удалось выполнить запрос.'
    current.requestId = null
  })
}

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    articleChanged(state, action) {
      if (state.article === action.payload) return

      state.article = action.payload
      state.stage = 'manufacturers'
      state.searchedArticle = ''
      state.selectedBrand = ''
      state.manufacturers = resource()
      state.offers = resource()
    },
    brandSelected(state, action) {
      state.stage = 'offers'

      if (state.selectedBrand === action.payload) return

      state.selectedBrand = action.payload
      state.offers = resource()
    },
    manufacturersOpened(state) {
      state.stage = 'manufacturers'
    },
  },
  extraReducers(builder) {
    bindResource(
      builder,
      fetchManufacturers,
      (state) => state.manufacturers,
      (state, number) => {
        if (state.searchedArticle === number) return

        state.searchedArticle = number
        state.stage = 'manufacturers'
        state.selectedBrand = ''
        state.offers = resource()
      },
      true,
    )

    bindResource(builder, fetchOffers, (state) => state.offers)
  },
})

export const { articleChanged, brandSelected, manufacturersOpened } = partsSlice.actions

export default partsSlice.reducer
