const money = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integer = new Intl.NumberFormat('ru-RU')

const shipmentDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Moscow',
})

export const formatPrice = (value) => (value === null ? 'По запросу' : money.format(value))

export const formatCount = (value) =>
  value === null ? 'Не указан' : `${integer.format(value)} шт.`

export const formatShipment = (value) => {
  const date = value ? new Date(value) : null

  return date && !Number.isNaN(date.getTime()) ? shipmentDate.format(date) : null
}

export function pluralize(value, one, few, many) {
  const lastTwo = value % 100
  const last = value % 10

  if (lastTwo >= 11 && lastTwo <= 14) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few

  return many
}
