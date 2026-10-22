export const TEST_API_KEY = '00000000-0000-0000-0000-000000000001'

export function getConfig(env = process.env) {
  const apiUrl = new URL(env.FAVORIT_API_URL || 'http://api.favorit-parts.ru/hs/hsprice/')
  const apiKey = env.FAVORIT_API_KEY || TEST_API_KEY

  if (!['http:', 'https:'].includes(apiUrl.protocol)) {
    throw new Error('FAVORIT_API_URL должен использовать HTTP или HTTPS.')
  }

  return {
    apiUrl,
    apiKey,
    testMode: apiKey === TEST_API_KEY,
    host: env.HOST || '127.0.0.1',
    port: Number(env.PORT || 5173),
    timeout: 2e4,
  }
}
