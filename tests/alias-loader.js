import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)

const {
  compilerOptions: { paths },
} = JSON.parse(readFileSync(new URL('jsconfig.json', root), 'utf8'))

export function resolve(specifier, context, nextResolve) {
  for (const [name, [target]] of Object.entries(paths)) {
    const wildcard = name.endsWith('*')
    const prefix = wildcard ? name.slice(0, -1) : name

    if (wildcard ? !specifier.startsWith(prefix) : specifier !== name) continue

    const relative = wildcard ? target.replace('*', specifier.slice(prefix.length)) : target

    for (const suffix of ['', '.js', '/index.js']) {
      const url = new URL(relative + suffix, root)

      if (!url.pathname.endsWith('.js') || !existsSync(fileURLToPath(url))) continue

      return { url: url.href, shortCircuit: true }
    }
  }

  return nextResolve(specifier, context)
}
