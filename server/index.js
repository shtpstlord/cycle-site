import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import dotenv from 'dotenv'
import express from 'express'
import { createProduct, readProducts } from './products-store.js'
import { startTelegramBot } from './telegram-bot.js'
import { startChannelSync } from './channel-sync.js'
import { getYandexLiveSnapshot } from '../lib/yandex-live.js'
import { fetchImageViaProxy, ImageProxyError } from '../lib/image-proxy.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT) || 3001
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')
const UPLOADS_DIR = path.resolve(__dirname, '../uploads')
const DIST_DIR = path.resolve(__dirname, '../dist')
const DATA_DIR = path.resolve(__dirname, '../data')

const app = express()
let channelSyncController = null

app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))
app.use('/data', express.static(DATA_DIR))

function checkApiKey(req, res, next) {
  const configuredKey = process.env.API_KEY
  if (!configuredKey) {
    next()
    return
  }

  const incomingKey = req.get('x-api-key')
  if (incomingKey !== configuredKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/products', async (_req, res) => {
  try {
    const products = await readProducts()
    res.json({ products })
  } catch (error) {
    console.error('[api] read products error:', error)
    res.status(500).json({ error: 'Failed to load products' })
  }
})

app.get('/api/yandex-live', async (_req, res) => {
  try {
    const snapshot = await getYandexLiveSnapshot()
    res.set('Cache-Control', 'public, max-age=45, stale-while-revalidate=120')
    res.json(snapshot)
  } catch (error) {
    console.error('[api] yandex-live error:', error)
    res.status(502).json({
      ok: false,
      error: 'Failed to load Yandex live data',
      details: String(error?.message ?? error),
    })
  }
})

app.get('/api/image-proxy', async (req, res) => {
  try {
    const payload = await fetchImageViaProxy(req.query.url)
    res.set('Content-Type', payload.contentType)
    res.set('Cache-Control', payload.cacheControl)
    res.send(payload.body)
  } catch (error) {
    const statusCode = error instanceof ImageProxyError ? error.statusCode : 502
    console.error('[api] image-proxy error:', error)
    res.status(statusCode).json({
      ok: false,
      error: 'Failed to load image',
      details: String(error?.message ?? error),
    })
  }
})

app.post('/api/products', checkApiKey, async (req, res) => {
  try {
    const product = await createProduct(req.body)
    res.status(201).json({ product })
  } catch (error) {
    console.error('[api] create product error:', error)
    res.status(400).json({ error: error.message })
  }
})

async function setupFrontendRoutes() {
  try {
    await fs.access(path.resolve(DIST_DIR, 'index.html'))

    app.use(express.static(DIST_DIR))

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next()
        return
      }

      res.sendFile(path.resolve(DIST_DIR, 'index.html'))
    })
  } catch {
    // dist is optional in local dev when Vite serves the frontend.
  }
}

await setupFrontendRoutes()

const server = app.listen(PORT, async () => {
  const fallbackPublicBase = `http://localhost:${PORT}`
  const runtimePublicBase = PUBLIC_BASE_URL || fallbackPublicBase
  console.log(`[api] listening on port ${PORT}`)

  try {
    await startTelegramBot({
      uploadsDir: UPLOADS_DIR,
      publicBaseUrl: runtimePublicBase,
      webAppUrl: process.env.WEB_APP_URL,
    })
  } catch (error) {
    console.error('[bot] startup failed, API keeps running:', error)
  }

  try {
    channelSyncController = await startChannelSync()
  } catch (error) {
    console.error('[channel-sync] startup failed, API keeps running:', error)
  }
})

server.on('error', (error) => {
  console.error('[api] server error:', error)
})

function shutdownChannelSync() {
  try {
    channelSyncController?.stop?.()
  } catch (error) {
    console.error('[channel-sync] shutdown error:', error)
  }
}

process.once('SIGINT', shutdownChannelSync)
process.once('SIGTERM', shutdownChannelSync)
