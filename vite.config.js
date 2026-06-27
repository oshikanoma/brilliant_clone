import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { generateLesson } from './server/homework.js'
import { decidePlacement } from './server/placement.js'

// Local dev middleware that mirrors the production serverless functions under
// /api/*. They read OPENAI_API_KEY from the (un-prefixed) env so the key stays
// on the server and is never bundled into the client.
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function apiPlugin(env) {
  // POST-only JSON endpoint helper.
  const handle = (server, route, run) => {
    server.middlewares.use(route, async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Use POST' }))
        return
      }
      try {
        const payload = await readJsonBody(req)
        const result = await run(payload)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result))
      } catch (err) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(err?.message || err) }))
      }
    })
  }

  return {
    name: 'algebruh-api-dev',
    configureServer(server) {
      handle(server, '/api/homework', (p) =>
        generateLesson({ problem: p.problem, apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL })
      )
      handle(server, '/api/placement', (p) =>
        decidePlacement({ history: p.history, apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL })
      )
    },
  }
}

// Served from https://<user>.github.io/brilliant_clone/ in production,
// but kept at root for local `vite dev`/`vite preview`.
export default defineConfig(({ command, mode }) => {
  // Load all env vars (including un-prefixed, server-only ones) for the dev proxy.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: command === 'build' ? '/brilliant_clone/' : '/',
    plugins: [react(), apiPlugin(env)],
  }
})
