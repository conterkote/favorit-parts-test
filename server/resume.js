import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'

export function createResumeHandler(file) {
  return async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end()
      return
    }

    try {
      const info = await stat(file)

      if (!info.isFile()) {
        response.writeHead(404).end()
        return
      }

      const etag = `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`

      response.setHeader('Content-Disposition', 'inline; filename="resume.pdf"')
      response.setHeader('Cache-Control', 'public, no-cache')
      response.setHeader('ETag', etag)

      if (request.headers['if-none-match'] === etag) {
        response.writeHead(304).end()
        return
      }

      response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': info.size,
        'X-Content-Type-Options': 'nosniff',
      })

      if (request.method === 'HEAD') response.end()
      else await pipeline(createReadStream(file), response)
    } catch (error) {
      if (response.destroyed) return

      if (!response.headersSent) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        })
      }

      response.end('Не удалось открыть резюме.')
    }
  }
}
