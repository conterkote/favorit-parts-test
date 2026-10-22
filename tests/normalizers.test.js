import assert from 'node:assert/strict'
import test from 'node:test'
import { groupOffers } from '@Entities/PartOffers/model/offers'
import { normalizeManufacturers, normalizeOffers } from '@Store/APIs/partsApi/normalizers'

const product = (data = {}) => ({
  goodsID: '1',
  brand: 'MEYLE',
  number: '123',
  name: 'Рычаг',
  count: 10,
  price: 999999,
  ...data,
})

test('manufacturers exclude the empty API sentinel and deduplicate case-insensitively', () => {
  const result = normalizeManufacturers([
    { brand: '', number: '', count: 0 },
    product(),
    product({ brand: 'meyle' }),
    null,
  ])

  assert.equal(result.length, 1)
  assert.equal(result[0]?.brand, 'MEYLE')
})

test('prices come exclusively from warehouses, including zero', () => {
  const items = normalizeOffers(
    [
      product({
        warehouses: [
          { id: 'a', price: 150, stock: 4 },
          { id: 'b', price: 0, stock: 0 },
          { id: 'c', stock: 6 },
        ],
      }),
    ],
    'MEYLE',
    '123',
  )

  assert.deepEqual(
    items.map(({ price, stock }) => ({ price, stock })),
    [
      { price: 150, stock: 4 },
      { price: 0, stock: 0 },
      { price: null, stock: 6 },
    ],
  )
})

test('nested analogues and products without warehouses remain visible without obsolete prices', () => {
  const analogue = product({
    goodsID: '2',
    brand: 'MAPCO',
    number: '456',
    count: 0,
    warehouses: [],
  })
  const items = normalizeOffers(
    [product({ analogues: [analogue], warehouses: [{ id: 'a', price: '120.50', stock: '3' }] })],
    'MEYLE',
    '123',
  )

  assert.equal(items.length, 2)
  assert.equal(items[1]?.isAnalogue, true)
  assert.equal(items[1]?.price, null)
  assert.equal(items[1]?.stock, 0)
})

test('duplicate products merge warehouse offers and exact duplicate offers are removed', () => {
  const warehouse = { id: 'a', price: 50, stock: 2 }
  const items = normalizeOffers(
    [
      product({ warehouses: [warehouse, warehouse] }),
      product({ warehouses: [{ id: 'b', price: 70, stock: 3 }] }),
    ],
    'MEYLE',
    '123',
  )

  assert.equal(items.length, 2)
})

test('missing and invalid numeric fields never become fabricated zeroes', () => {
  const items = normalizeOffers(
    [
      product({
        warehouses: [
          { price: null, stock: '' },
          { price: -1, stock: 'invalid' },
          { price: false, stock: null },
        ],
      }),
    ],
    'MEYLE',
    '123',
  )

  assert.equal(items.length, 1)
  assert.equal(items[0]?.price, null)
  assert.equal(items[0]?.stock, null)
})

test('requested products match both brand and number, including when repeated among analogues', () => {
  const items = normalizeOffers(
    [
      product({ analogues: [product({ goodsID: 'same-brand', number: '456' })] }),
      product({ goodsID: 'root-analogue', number: '789' }),
    ],
    ' meyle ',
    '123',
  )

  assert.equal(items.find(({ number }) => number === '123')?.isAnalogue, false)
  assert.equal(items.find(({ number }) => number === '456')?.isAnalogue, true)
  assert.equal(items.find(({ number }) => number === '789')?.isAnalogue, true)
})

test('products without warehouses stay visible but do not count as warehouse offers', () => {
  const items = normalizeOffers(
    [
      { brand: 'ASAM', number: '01089', count: 0 },
      { brand: 'AP', number: '01089', warehouses: [{ code: 'МСК', stock: 1 }] },
    ],
    'ASAM',
    '01089',
  )
  const groups = groupOffers(items, 'price-asc', false)

  assert.equal(groups.length, 2)
  assert.equal(groups.find(({ primary }) => primary.brand === 'ASAM').offerCount, 0)
  assert.equal(groups.find(({ primary }) => primary.brand === 'AP').offerCount, 1)
  assert.equal(
    groups.reduce((count, group) => count + group.offerCount, 0),
    1,
  )
})
