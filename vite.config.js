import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const {
  compilerOptions: { paths },
} = JSON.parse(readFileSync(new URL('./jsconfig.json', import.meta.url), 'utf8'))

const alias = Object.entries(paths).map(([name, [target]]) => ({
  find: name.endsWith('/*') ? name.slice(0, -2) : new RegExp('^' + name + '$'),
  replacement: fileURLToPath(new URL(target.replace(/\*$/, ''), import.meta.url)).replace(
    /[\\/]$/,
    '',
  ),
}))

export default defineConfig({ plugins: [react()], resolve: { alias } })
