import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/brilliant_clone/ in production,
// but kept at root for local `vite dev`/`vite preview`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/brilliant_clone/' : '/',
  plugins: [react()],
}))
