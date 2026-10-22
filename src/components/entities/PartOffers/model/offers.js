export const offerSortOptions = [
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'shipment-asc', label: 'Отправят раньше' },
  { value: 'shipment-desc', label: 'Отправят позже' },
]

const shipmentCalendar = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'Europe/Moscow',
})

function shipmentDay(value) {
  if (!value) return null

  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) return null

  const parts = shipmentCalendar.formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)

  return Date.UTC(year, month - 1, day)
}

function compareNullable(a, b, descending) {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1

  return descending ? b - a : a - b
}

export function groupOffers(items, sort, inStock) {
  const groups = new Map()
  const dates = new Map()

  function compare(a, b) {
    const byPrice = compareNullable(a.price, b.price, sort === 'price-desc')
    const byShipment = compareNullable(
      dates.get(a.id) ?? null,
      dates.get(b.id) ?? null,
      sort === 'shipment-desc',
    )
    const comparison = sort.startsWith('shipment') ? byShipment || byPrice : byPrice || byShipment

    return comparison || a.brand.localeCompare(b.brand, 'ru') || a.id.localeCompare(b.id)
  }

  for (const offer of items) {
    if (inStock && (offer.stock ?? 0) <= 0) continue

    dates.set(offer.id, shipmentDay(offer.shipment))
    const group = groups.get(offer.productId)

    if (group) group.push(offer)
    else groups.set(offer.productId, [offer])
  }

  const result = []

  for (const [productId, offers] of groups) {
    const [primary, ...others] = offers.sort(compare)

    if (primary) {
      const offerCount = offers.filter((offer) => offer.hasWarehouse).length

      result.push({ productId, primary, others, offerCount })
    }
  }

  return result.sort((a, b) => compare(a.primary, b.primary))
}
