import { isRecord } from '@Utility/isRecord'

async function requestParts(params, signal) {
  const response = await fetch(`/api/parts?${new URLSearchParams(params)}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || (isRecord(payload) && payload.error)) {
    const message =
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : 'Не удалось получить данные. Попробуйте ещё раз.'
    throw new Error(message)
  }

  if (!isRecord(payload) || !Array.isArray(payload.goods)) {
    throw new Error('Сервис вернул ответ в неизвестном формате.')
  }

  const testMode =
    isRecord(payload.meta) && typeof payload.meta.testMode === 'boolean'
      ? payload.meta.testMode
      : null

  return { goods: payload.goods, meta: { testMode } }
}

export const partsApi = {
  getManufacturers: (number, signal) => requestParts({ number }, signal),
  getOffers: ({ number, brand }, signal) => requestParts({ number, brand }, signal),
}
