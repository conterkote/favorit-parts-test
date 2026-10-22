function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const API_ERRORS = {
  'Empty key!': 'Не настроен ключ API. Укажите FAVORIT_API_KEY в файле .env.',
  'Invalid key client!': 'Сервис отклонил ключ API. Проверьте FAVORIT_API_KEY в файле .env.',
  'Empty number goods!': 'Введите артикул детали.',
  'Request quota exceeded!': 'Лимит запросов к сервису исчерпан. Попробуйте позже.',
}

function sendJson(response, status, payload) {
  if (response.destroyed) return

  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })

  response.end(JSON.stringify(payload))
}

export function createPartsHandler(config, fetchApi = fetch) {
  return async (request, response) => {
    const incoming = new URL(request.url || '/', 'http://localhost')

    if (incoming.pathname !== '/api/parts') return false

    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET')
      sendJson(response, 405, { error: 'Допустим только GET-запрос.' })

      return true
    }

    const number = incoming.searchParams.get('number')?.trim()
    const brand = incoming.searchParams.get('brand')?.trim()

    if (!number || number.length > 80 || (brand && brand.length > 120)) {
      sendJson(response, 400, { error: 'Введите артикул длиной от 1 до 80 символов.' })

      return true
    }

    const target = new URL(config.apiUrl)

    target.search = new URLSearchParams({ key: config.apiKey, number }).toString()

    if (brand) {
      target.searchParams.set('brand', brand)
      target.searchParams.set('analogues', 'on')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort('timeout'), config.timeout)
    const onClose = () => {
      if (!response.writableEnded) controller.abort('client-closed')
    }

    const onRequestError = () => controller.abort('client-closed')

    response.on('close', onClose)
    request.on('error', onRequestError)

    try {
      const upstream = await fetchApi(target, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (!upstream.ok) {
        sendJson(response, 502, {
          error: 'Сервис запчастей временно недоступен. Попробуйте ещё раз.',
        })

        return true
      }

      const raw = await upstream.text()

      if (!raw.trim()) {
        sendJson(response, 200, { goods: [], meta: { testMode: config.testMode } })

        return true
      }

      const payload = JSON.parse(raw.replace(/^\uFEFF/, ''))

      if (isRecord(payload) && payload.error) {
        const details = Array.isArray(payload.error)
          ? payload.error.join(' ')
          : String(payload.error)
        const message = Object.entries(API_ERRORS).find(([key]) => details.includes(key))?.[1]

        sendJson(response, 502, {
          error: message || 'Сервис не смог выполнить запрос. Попробуйте позже.',
        })

        return true
      }

      if (!isRecord(payload) || !Array.isArray(payload.goods)) {
        sendJson(response, 502, { error: 'Сервис вернул ответ в неизвестном формате.' })

        return true
      }

      sendJson(response, 200, { goods: payload.goods, meta: { testMode: config.testMode } })
    } catch (error) {
      if (controller.signal.reason === 'client-closed') {
        if (!response.destroyed && !response.writableEnded) response.end()
        return true
      }

      const message = controller.signal.aborted
        ? 'Сервис долго не отвечает. Повторите запрос.'
        : error instanceof SyntaxError
          ? 'Сервис вернул некорректный ответ. Попробуйте ещё раз.'
          : 'Не удалось связаться с сервисом запчастей. Проверьте подключение и повторите запрос.'

      sendJson(response, controller.signal.aborted ? 504 : 502, { error: message })
    } finally {
      clearTimeout(timeout)
      response.off('close', onClose)
      request.off('error', onRequestError)
    }

    return true
  }
}
