import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// HTTPS is enabled automatically when the repo-level certs/ pair exists (same
// certs the backend uses). Generate them with mkcert for a trusted, warning-free
// experience; see certs setup in the README.
const certPath = fileURLToPath(new URL('../certs/cert.pem', import.meta.url))
const keyPath = fileURLToPath(new URL('../certs/key.pem', import.meta.url))
const httpsEnabled = fs.existsSync(certPath) && fs.existsSync(keyPath)
const https = httpsEnabled
  ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
  : undefined

// The API and uploads are proxied to the backend. When HTTPS is on, the backend
// is also HTTPS; `secure: false` lets the proxy accept the local self-signed
// cert (mkcert certs are trusted, so this is harmless either way).
const backendOrigin = httpsEnabled
  ? 'https://localhost:5000'
  : 'http://localhost:5000'
const proxy = {
  '/api': { target: backendOrigin, changeOrigin: true, secure: false },
  '/uploads': { target: backendOrigin, changeOrigin: true, secure: false },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    https,
    proxy,
  },
})
