import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchYandexLiveSnapshot } from '../lib/yandex-live.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SNAPSHOT_PATH = path.resolve(__dirname, '../data/yandex-snapshot.json')

async function readExistingSnapshot() {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // ignore: snapshot can be missing on first run
  }

  return null
}

function toStoredSnapshot(snapshot) {
  const photos = Array.isArray(snapshot?.photos)
    ? snapshot.photos.filter((item) => typeof item === 'string' && item.trim())
    : []
  const reviews = Array.isArray(snapshot?.reviews)
    ? snapshot.reviews.filter((item) => item && typeof item === 'object' && item.id)
    : []
  const summary = snapshot?.summary && typeof snapshot.summary === 'object' ? snapshot.summary : null

  if (!summary || photos.length === 0 || reviews.length === 0) {
    throw new Error('Fetched Yandex payload is incomplete, keeping existing snapshot')
  }

  return {
    source: snapshot?.source && typeof snapshot.source === 'object' ? snapshot.source : {},
    summary,
    photos,
    reviews,
    updatedAt: snapshot?.updatedAt || new Date().toISOString(),
  }
}

async function writeSnapshot(snapshot) {
  await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true })
  await fs.writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
}

async function main() {
  const existingSnapshot = await readExistingSnapshot()

  try {
    const freshSnapshot = await fetchYandexLiveSnapshot()
    const normalized = toStoredSnapshot(freshSnapshot)
    await writeSnapshot(normalized)
    console.log(
      `[yandex-snapshot] updated: reviews=${normalized.reviews.length}, photos=${normalized.photos.length}, updatedAt=${normalized.updatedAt}`,
    )
  } catch (error) {
    if (existingSnapshot) {
      console.warn(
        `[yandex-snapshot] refresh failed, keeping existing snapshot: ${String(error?.message ?? error)}`,
      )
      return
    }

    throw error
  }
}

main().catch((error) => {
  console.error('[yandex-snapshot] failed:', error)
  process.exit(1)
})
