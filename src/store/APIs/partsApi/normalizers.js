import { isRecord } from '@Utility/isRecord'

const text = (value) => (typeof value === 'string' ? value.trim() : '')

const numeric = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (value === '') return null

  const number = Number(value)

  return Number.isFinite(number) && number >= 0 ? number : null
}

function validGoods(goods) {
  if (!Array.isArray(goods)) return []

  return goods.filter(
    (item) =>
      isRecord(item) &&
      typeof item.brand === 'string' &&
      typeof item.number === 'string' &&
      Boolean(text(item.brand)) &&
      Boolean(text(item.number)),
  )
}

export function normalizeManufacturers(goods) {
  const manufacturers = new Map()

  for (const item of validGoods(goods)) {
    const brand = text(item.brand)
    const key = brand.toLocaleUpperCase('en-US')

    if (!manufacturers.has(key)) {
      manufacturers.set(key, { brand, name: text(item.name) || 'Название не указано' })
    }
  }

  return Array.from(manufacturers.values()).sort((a, b) => a.brand.localeCompare(b.brand, 'ru'))
}

export function normalizeOffers(goods, selectedBrand, selectedNumber) {
  const offers = new Map()
  const visited = new WeakSet()
  const queue = validGoods(goods)

  for (const item of queue) {
    const productId = text(item.goodsID) || `${text(item.brand)}:${text(item.number)}`

    if (visited.has(item)) continue

    visited.add(item)

    for (const analogue of validGoods(item.analogues)) {
      queue.push(analogue)
    }

    const warehouses = Array.isArray(item.warehouses) ? item.warehouses.filter(isRecord) : []
    const sources = warehouses.length ? warehouses : [null]

    for (const warehouse of sources) {
      const price = warehouse ? numeric(warehouse.price) : null
      const stock = numeric(warehouse ? warehouse.stock : item.count)
      const shipment = text(warehouse?.shipmentDate)
      const warehouseId = text(warehouse?.id) || text(warehouse?.code)
      const id = JSON.stringify([
        productId,
        warehouseId,
        shipment,
        price,
        stock,
        warehouse?.notRefund,
      ])

      offers.set(id, {
        id,
        productId,
        name: text(item.name) || 'Название не указано',
        brand: text(item.brand),
        number: text(item.number),
        isAnalogue:
          text(item.brand).toUpperCase() !== selectedBrand.trim().toUpperCase() ||
          text(item.number).toUpperCase() !== selectedNumber.trim().toUpperCase(),
        hasWarehouse: warehouse !== null,
        warehouse: text(warehouse?.code) || (warehouse ? 'Без названия' : 'Нет данных'),
        price,
        stock,
        shipment,
      })
    }
  }

  return Array.from(offers.values())
}
