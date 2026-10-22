import assert from 'node:assert/strict'
import test from 'node:test'
import { groupOffers } from '@Entities/PartOffers/model/offers'

function offer(id, data = {}) {
  return {
    id,
    productId: 'part-1',
    brand: 'Orjin Automotive',
    number: '01089',
    name: 'Рычаг подвески',
    isAnalogue: false,
    warehouse: 'МСК РС',
    hasWarehouse: true,
    price: 100,
    stock: 1,
    shipment: '2026-10-23T12:00:00+03:00',
    ...data,
  }
}

test('one group per product keeps price, stock and shipment from the same primary offer', () => {
  const items = [
    offer('expensive', { price: 300, stock: 8, shipment: '2026-10-22' }),
    offer('cheap', { price: 100, stock: 2, shipment: '2026-10-26' }),
    offer('middle', { price: 200 }),
  ]
  const [group] = groupOffers(items, 'price-asc', false)

  assert.equal(group?.primary.id, 'cheap')
  assert.equal(group?.primary.stock, 2)
  assert.equal(group?.primary.shipment, '2026-10-26')
  assert.deepEqual(
    group?.others.map(({ id }) => id),
    ['middle', 'expensive'],
  )

  assert.deepEqual(
    items.map(({ id }) => id),
    ['expensive', 'cheap', 'middle'],
  )
})

test('descending prices sort both product groups and their remaining warehouse offers', () => {
  const groups = groupOffers(
    [
      offer('a-low', { price: 100 }),
      offer('a-high', { price: 200 }),
      offer('b-high', { productId: 'part-2', price: 400, isAnalogue: true }),
      offer('b-low', { productId: 'part-2', price: 300, isAnalogue: true }),
      offer('no-price', { productId: 'part-3', price: null, isAnalogue: true }),
    ],
    'price-desc',
    false,
  )

  assert.deepEqual(
    groups.map(({ primary }) => primary.id),
    ['b-high', 'a-high', 'no-price'],
  )

  assert.deepEqual(
    groups[0]?.others.map(({ id }) => id),
    ['b-low'],
  )
})

test('stock filtering runs before selecting the primary offer and removes empty groups', () => {
  const groups = groupOffers(
    [
      offer('sold-out', { price: 10, stock: 0 }),
      offer('available', { price: 200, stock: 3 }),
      offer('unknown-stock', { productId: 'part-2', stock: null }),
    ],
    'price-asc',
    true,
  )

  assert.equal(groups.length, 1)
  assert.equal(groups[0]?.primary.id, 'available')
  assert.equal(groups[0]?.others.length, 0)
})

test('shipment sorting uses Moscow calendar dates and places unknown dates last in both directions', () => {
  const items = [
    offer('early', { shipment: '2026-10-22T23:30:00+03:00', price: 150 }),
    offer('late', { shipment: '2026-10-26T10:00:00+03:00', price: 100 }),
    offer('unknown', { shipment: '' }),
    offer('invalid', { shipment: 'not-a-date' }),
  ]
  const [earliest] = groupOffers(items, 'shipment-asc', false)
  const [latest] = groupOffers(items, 'shipment-desc', false)

  assert.equal(earliest?.primary.id, 'early')
  assert.equal(latest?.primary.id, 'late')
  assert.equal(earliest?.others[0]?.id, 'late')
  assert.equal(latest?.others[0]?.id, 'early')
  assert.ok(
    earliest?.others.slice(1).every(({ shipment }) => !shipment || shipment === 'not-a-date'),
  )
})

test('shipment time is an order cutoff, so equal shipping days use price as a tie-breaker', () => {
  const items = [
    offer('morning', { shipment: '2026-10-22T23:00:00Z', price: 200 }),
    offer('evening', { shipment: '2026-10-23T18:00:00+03:00', price: 100 }),
  ]

  assert.equal(groupOffers(items, 'shipment-asc', false)[0]?.primary.id, 'evening')
  assert.equal(groupOffers(items, 'shipment-desc', false)[0]?.primary.id, 'evening')
})

test('zero prices remain valid while missing prices are last in either direction', () => {
  const items = [offer('unknown', { price: null }), offer('zero', { price: 0 }), offer('priced')]

  assert.equal(groupOffers(items, 'price-asc', false)[0]?.primary.id, 'zero')
  assert.deepEqual(
    groupOffers(items, 'price-desc', false)[0]?.others.map(({ id }) => id),
    ['zero', 'unknown'],
  )
})
