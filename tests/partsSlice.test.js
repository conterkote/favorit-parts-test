import assert from 'node:assert/strict'
import test from 'node:test'
import { configureStore } from '@reduxjs/toolkit'
import reducer, {
  articleChanged,
  brandSelected,
  manufacturersOpened,
  fetchManufacturers,
  fetchOffers,
} from '@Store/Slices/partsSlice/partsSlice'

const manufacturer = (brand) => ({ brand, name: 'Тестовая деталь' })

const offer = (brand) => ({
  id: 'offer',
  productId: 'part',
  name: 'Тестовая деталь',
  brand,
  number: '01089',
  isAnalogue: false,
  warehouse: 'МСК',
  price: 100,
  stock: 1,
  shipment: '',
})

test('late manufacturer response cannot repopulate results after article changes', () => {
  let state = reducer(undefined, articleChanged('old'))

  state = reducer(state, fetchManufacturers.pending('request-old', 'old'))
  state = reducer(state, articleChanged('new'))
  state = reducer(
    state,
    fetchManufacturers.fulfilled({ items: [manufacturer('OLD')] }, 'request-old', 'old'),
  )

  assert.deepEqual(state.manufacturers.items, [])
  assert.equal(state.article, 'new')
})

test('only the latest request can update the same resource', () => {
  let state = reducer(undefined, fetchManufacturers.pending('old', '123'))

  state = reducer(state, fetchManufacturers.pending('new', '123'))
  state = reducer(
    state,
    fetchManufacturers.fulfilled({ items: [manufacturer('NEW')], testMode: true }, 'new', '123'),
  )
  state = reducer(state, fetchManufacturers.rejected(new Error('failure'), 'old', '123'))

  assert.equal(state.manufacturers.status, 'success')
  assert.equal(state.manufacturers.items[0]?.brand, 'NEW')
})

test('switching manufacturers invalidates a pending offers response', () => {
  let state = reducer(undefined, brandSelected('A'))

  state = reducer(state, fetchOffers.pending('old-brand', { number: '123', brand: 'A' }))
  state = reducer(state, brandSelected('B'))
  state = reducer(
    state,
    fetchOffers.fulfilled({ items: [offer('A')] }, 'old-brand', { number: '123', brand: 'A' }),
  )

  assert.equal(state.selectedBrand, 'B')
  assert.deepEqual(state.offers.items, [])
})

test('selecting the active manufacturer preserves current results', () => {
  let state = reducer(undefined, brandSelected('A'))

  state = reducer(state, fetchOffers.pending('active', { number: '123', brand: 'A' }))
  state = reducer(
    state,
    fetchOffers.fulfilled({ items: [offer('A')] }, 'active', { number: '123', brand: 'A' }),
  )
  state = reducer(state, brandSelected('A'))

  assert.equal(state.offers.status, 'success')
  assert.equal(state.offers.items.length, 1)
})

test('aborting the current request returns it to idle without exposing an error', () => {
  let state = reducer(undefined, fetchManufacturers.pending('active', '123'))

  state = reducer(
    state,
    fetchManufacturers.rejected({ name: 'AbortError', message: 'Aborted' }, 'active', '123'),
  )

  assert.equal(state.manufacturers.status, 'idle')
  assert.equal(state.manufacturers.error, null)
})

function readySearch() {
  let state = reducer(undefined, articleChanged('01089'))

  state = reducer(state, fetchManufacturers.pending('brands', '01089'))
  state = reducer(
    state,
    fetchManufacturers.fulfilled(
      { items: [manufacturer('AP'), manufacturer('FEBI')] },
      'brands',
      '01089',
    ),
  )
  state = reducer(state, brandSelected('AP'))
  state = reducer(state, fetchOffers.pending('offers', { number: '01089', brand: 'AP' }))

  return reducer(
    state,
    fetchOffers.fulfilled({ items: [offer('AP')] }, 'offers', { number: '01089', brand: 'AP' }),
  )
}

test('returning to manufacturers preserves the article, brand and loaded offers', () => {
  const state = reducer(readySearch(), manufacturersOpened())

  assert.equal(state.stage, 'manufacturers')
  assert.equal(state.article, '01089')
  assert.equal(state.searchedArticle, '01089')
  assert.equal(state.selectedBrand, 'AP')
  assert.equal(state.manufacturers.items.length, 2)
  assert.equal(state.offers.status, 'success')
  assert.equal(state.offers.items.length, 1)
})

test('opening the same brand returns to offers without another API request', async () => {
  let state = reducer(readySearch(), manufacturersOpened())

  state = reducer(state, brandSelected('AP'))
  const store = configureStore({ reducer: { parts: reducer }, preloadedState: { parts: state } })
  const action = await store.dispatch(fetchOffers({ number: '01089', brand: 'AP' }))

  assert.equal(state.stage, 'offers')
  assert.ok(fetchOffers.rejected.match(action))
  assert.equal(action.meta.condition, true)
  assert.equal(store.getState().parts.offers.status, 'success')
  assert.equal(store.getState().parts.offers.items.length, 1)
})

test('choosing another manufacturer opens offers and discards the previous offers', () => {
  let state = reducer(readySearch(), manufacturersOpened())

  state = reducer(state, brandSelected('FEBI'))

  assert.equal(state.stage, 'offers')
  assert.equal(state.selectedBrand, 'FEBI')
  assert.equal(state.offers.status, 'idle')
  assert.deepEqual(state.offers.items, [])
})

test('new search clears both stages and rejects a late offers response', () => {
  let state = reducer(readySearch(), fetchOffers.pending('late', { number: '01089', brand: 'AP' }))

  state = reducer(state, articleChanged(''))
  state = reducer(
    state,
    fetchOffers.fulfilled({ items: [offer('AP')] }, 'late', { number: '01089', brand: 'AP' }),
  )

  assert.equal(state.stage, 'manufacturers')
  assert.equal(state.article, '')
  assert.equal(state.searchedArticle, '')
  assert.equal(state.selectedBrand, '')
  assert.deepEqual(state.manufacturers.items, [])
  assert.deepEqual(state.offers.items, [])
})

test('returning during loading allows the same manufacturer to be opened after cancellation', () => {
  let state = reducer(
    readySearch(),
    fetchOffers.pending('loading', { number: '01089', brand: 'AP' }),
  )

  state = reducer(state, manufacturersOpened())
  state = reducer(
    state,
    fetchOffers.rejected({ name: 'AbortError', message: 'Aborted' }, 'loading', {
      number: '01089',
      brand: 'AP',
    }),
  )
  state = reducer(state, brandSelected('AP'))

  assert.equal(state.stage, 'offers')
  assert.equal(state.offers.status, 'idle')
  assert.equal(state.manufacturers.items.length, 2)
})

test('setting the same article preserves loaded manufacturers, offers and the current stage', () => {
  const previous = readySearch()
  const state = reducer(previous, articleChanged('01089'))

  assert.equal(state, previous)
  assert.equal(state.manufacturers.status, 'success')
  assert.equal(state.offers.status, 'success')
  assert.equal(state.stage, 'offers')
})

test('setting the same article during loading keeps the pending request valid', () => {
  let state = reducer(undefined, articleChanged('01089'))

  state = reducer(state, fetchManufacturers.pending('active', '01089'))
  const previous = state

  state = reducer(state, articleChanged('01089'))

  assert.equal(state, previous)
  assert.equal(state.manufacturers.status, 'loading')
  assert.equal(state.manufacturers.requestId, 'active')
  state = reducer(
    state,
    fetchManufacturers.fulfilled({ items: [manufacturer('AP')] }, 'active', '01089'),
  )

  assert.equal(state.manufacturers.status, 'success')
  assert.equal(state.manufacturers.items[0]?.brand, 'AP')
})

test('explicit search for the same article accepts only the restarted request', () => {
  let state = reducer(readySearch(), fetchManufacturers.pending('first', '01089'))

  state = reducer(state, articleChanged('01089'))
  state = reducer(state, fetchManufacturers.pending('restarted', '01089'))
  state = reducer(
    state,
    fetchManufacturers.rejected({ name: 'AbortError', message: 'Aborted' }, 'first', '01089'),
  )
  state = reducer(
    state,
    fetchManufacturers.fulfilled({ items: [manufacturer('OLD')] }, 'first', '01089'),
  )

  assert.equal(state.manufacturers.status, 'loading')
  assert.equal(state.manufacturers.requestId, 'restarted')
  state = reducer(
    state,
    fetchManufacturers.fulfilled({ items: [manufacturer('NEW')] }, 'restarted', '01089'),
  )

  assert.equal(state.manufacturers.status, 'success')
  assert.equal(state.manufacturers.items[0]?.brand, 'NEW')
})

test('refreshing the same article retains manufacturers, offers and the current stage', () => {
  const previous = readySearch()
  let state = reducer(previous, fetchManufacturers.pending('refresh', '01089'))

  assert.equal(state.manufacturers.status, 'loading')
  assert.deepEqual(state.manufacturers.items, previous.manufacturers.items)
  assert.equal(state.offers, previous.offers)
  assert.equal(state.selectedBrand, 'AP')
  assert.equal(state.stage, 'offers')

  state = reducer(
    state,
    fetchManufacturers.fulfilled(
      { items: [manufacturer('AP'), manufacturer('FEBI'), manufacturer('ASAM')] },
      'refresh',
      '01089',
    ),
  )

  assert.equal(state.manufacturers.items.length, 3)
  assert.equal(state.offers, previous.offers)
  assert.equal(state.stage, 'offers')
})

test('failed or cancelled refresh keeps previously loaded results available', () => {
  const previous = readySearch()
  const loading = reducer(previous, fetchManufacturers.pending('refresh', '01089'))
  const failed = reducer(
    loading,
    fetchManufacturers.rejected(new Error('Network'), 'refresh', '01089'),
  )
  const cancelled = reducer(
    loading,
    fetchManufacturers.rejected({ name: 'AbortError', message: 'Aborted' }, 'refresh', '01089'),
  )

  assert.equal(failed.manufacturers.status, 'error')
  assert.deepEqual(failed.manufacturers.items, previous.manufacturers.items)
  assert.equal(failed.offers, previous.offers)
  assert.equal(cancelled.manufacturers.status, 'success')
  assert.deepEqual(cancelled.manufacturers.items, previous.manufacturers.items)
  assert.equal(cancelled.offers, previous.offers)
})
