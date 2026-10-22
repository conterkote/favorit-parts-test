import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { getConfig } from '../server/config.js'
import { createPartsHandler } from '../server/partsProxy.js'
import { isRecord } from '@Utility/isRecord'

async function requestProxy(context, handler, path = '/api/parts?number=123') {
  const server = createServer((request, response) => {
    void handler(request, response)
  })

  context.after(
    () =>
      new Promise((resolve, reject) => {
        server.closeAllConnections()
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  )

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  const address = server.address()

  assert.ok(address && typeof address !== 'string')
  const response = await fetch(`http://127.0.0.1:${address.port}${path}`)
  const body = await response.json()

  assert.ok(isRecord(body))

  return { status: response.status, body }
}

test('proxy encodes special characters and adds analogues only for a brand search', async (context) => {
  const targets = []
  const handle = createPartsHandler(getConfig({}), async (url) => {
    targets.push(url)

    return new Response(JSON.stringify({ goods: [] }))
  })
  const result = await requestProxy(
    context,
    handle,
    `/api/parts?${new URLSearchParams({ number: '12#&3', brand: 'Meat & Doria' })}`,
  )
  const target = targets[0]

  assert.ok(target)
  assert.equal(target.searchParams.get('number'), '12#&3')
  assert.equal(target.searchParams.get('brand'), 'Meat & Doria')
  assert.equal(target.searchParams.get('analogues'), 'on')
  assert.equal(result.status, 200)
  assert.equal(JSON.stringify(result.body).includes('00000000'), false)
})

test('manufacturer search does not send brand or analogues', async (context) => {
  const handle = createPartsHandler(getConfig({}), async (url) => {
    assert.equal(url.searchParams.has('brand'), false)
    assert.equal(url.searchParams.has('analogues'), false)

    return new Response('')
  })
  const result = await requestProxy(context, handle)

  assert.deepEqual(result.body.goods, [])
})

test('API errors returned with HTTP 200 become a recoverable error', async (context) => {
  const handle = createPartsHandler(
    getConfig({}),
    async () => new Response(JSON.stringify({ error: 'Invalid key client!' })),
  )
  const result = await requestProxy(context, handle)

  assert.equal(result.status, 502)
  assert.equal(typeof result.body.error, 'string')
  assert.match(String(result.body.error), /ключ API/)
})

test('malformed and unexpected JSON do not reach the client as success', async (context) => {
  for (const raw of ['not json', '{"other":true}']) {
    const handle = createPartsHandler(getConfig({}), async () => new Response(raw))
    const result = await requestProxy(context, handle)

    assert.equal(result.status, 502)
  }
})

test('upstream timeout returns 504', async (context) => {
  const handle = createPartsHandler(
    { ...getConfig({}), timeout: 5 },
    async (_, { signal }) =>
      new Promise((_2, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      }),
  )
  const result = await requestProxy(context, handle)

  assert.equal(result.status, 504)
})

test('empty input is rejected without contacting the API', async (context) => {
  const handle = createPartsHandler(getConfig({}), async () => assert.fail('must not fetch'))
  const result = await requestProxy(context, handle, '/api/parts?number=')

  assert.equal(result.status, 400)
})
