import { getConfig } from '../server/config.js'
import { createPartsHandler } from '../server/partsProxy.js'

const handleParts = createPartsHandler(getConfig())

export default async function handler(request, response) {
  await handleParts(request, response)
}
