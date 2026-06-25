import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { decidePlacement } from './server/placement.js'

// Local dev middleware that mirrors the production serverless function at
// /api/placement. It reads OPENAI_API_KEY from the (un-prefixed) env so the key
// stays on the server and is never bundled into the client. If the key is
// missing or OpenAI errors, it returns 502 and the client falls back to its
// local binary-search engine.
function placementApiPlugin(env) {
  return {
    name: 'placement-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/placement', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Use POST' }))
          return
        }
        let body = ''
        for await (const chunk of req) body += chunk
        try {
          const payload = JSON.parse(body || '{}')
          const decision = await decidePlacement({
            history: payload.history,
            curriculum: payload.curriculum,
            apiKey: env.OPENAI_API_KEY,
            model: env.OPENAI_MODEL,
          })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(decision))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(err?.message || err) }))
        }
      })
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
    plugins: [react(), placementApiPlugin(env)],
  }
})
