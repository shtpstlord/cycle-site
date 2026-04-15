import dotenv from 'dotenv'
import { syncChannelFull } from './channel-sync.js'

dotenv.config()

function parsePositiveNumber(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.floor(parsed)
}

async function main() {
  const overrides = {}

  const maxPages = parsePositiveNumber(process.env.TG_CHANNEL_SYNC_FULL_MAX_PAGES)
  if (maxPages) {
    overrides.maxPages = maxPages
  }

  const timeoutMs = parsePositiveNumber(process.env.TG_CHANNEL_SYNC_TIMEOUT_MS)
  if (timeoutMs) {
    overrides.requestTimeoutMs = timeoutMs
  }

  const result = await syncChannelFull(overrides)
  console.log('[channel-sync:full] completed')
  console.log(JSON.stringify(result, null, 2))
}

try {
  await main()
} catch (error) {
  console.error('[channel-sync:full] failed:', error)
  process.exitCode = 1
}
