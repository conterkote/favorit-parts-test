import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getConfig } from './config.js'
import { createPartsHandler } from './partsProxy.js'
import { createResumeHandler } from './resume.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const config = getConfig()
const handleParts = createPartsHandler(config)
const handleResume = createResumeHandler(resolve(root, 'server/files/resume.pdf'))
const isDev = process.argv.includes('--dev')

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
}

let vite

const server = createServer(async (request, response) => {
  try {
    if (await handleParts(request, response)) return

    const url = new URL(request.url || '/', 'http://localhost')
    if (url.pathname === '/resume.pdf') {
      await handleResume(request, response)
      return
    }

    if (url.pathname.startsWith('/api/')) {
      response.writeHead(404).end()
      return
    }

    if (vite) {
      vite.middlewares(request, response)
      return
    }

    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end()
      return
    }

    let file = resolve(dist, `.${decodeURIComponent(url.pathname)}`)

    if (!file.startsWith(dist + sep) && file !== dist) {
      response.writeHead(403).end()
      return
    }

    const info = await stat(file).catch(() => null)

    if (!info?.isFile()) {
      if (extname(url.pathname)) {
        response.writeHead(404).end()
        return
      }

      file = resolve(dist, 'index.html')
    }

    const fileInfo = await stat(file)

    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
      'Content-Length': fileInfo.size,
      'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    })

    if (request.method === 'HEAD') response.end()
    else createReadStream(file).pipe(response)
  } catch {
    if (!response.headersSent)
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })

    response.end(
      'Не удалось обработать запрос. Выполните npm run build перед запуском production-сервера.',
    )
  }
})

if (isDev) {
  const { createServer: createViteServer } = await import('vite')

  vite = await createViteServer({
    root,
    server: { middlewareMode: true, hmr: { server } },
    appType: 'spa',
  })
}

server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Порт ${config.port} уже занят. Укажите другой PORT в .env.`
      : error.message,
  )

  process.exitCode = 1
  vite?.close()
})

server.listen(config.port, config.host, () => {
  console.log(`PARTLINE: http://${config.host}:${config.port}`)
  console.log(
    config.testMode
      ? 'Favorit Parts: тестовый ключ из документации'
      : 'Favorit Parts: ключ из окружения',
  )
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await vite?.close()
    server.close()
    server.closeAllConnections()
  })
}
