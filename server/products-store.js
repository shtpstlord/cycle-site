import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_PRODUCTS } from './seed-products.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../data')
const PRODUCTS_PATH = path.resolve(DATA_DIR, 'products.json')
const DEFAULT_IMAGE = 'https://placehold.co/640x840/f4f0eb/111?text=CYCLE'
const DEFAULT_NAME = 'No title'
const DEFAULT_STATUS = 'available'
const SOURCE_TYPE_TELEGRAM = 'telegram'

function parsePrice(value) {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.round(parsed)
}

function normalizeString(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function normalizeSourcePostId(value) {
  if (value === null || value === undefined) {
    return null
  }

  const raw = String(value).trim()
  if (!raw) {
    return null
  }

  const trailingDigits = raw.match(/(\d+)(?!.*\d)/)
  return trailingDigits?.[1] ?? raw
}

function normalizeIsoDate(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function normalizeStatus(value) {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) {
    return DEFAULT_STATUS
  }

  if (raw === 'sold' || /(sold|sold out|продан|продано|распродан)/iu.test(raw)) {
    return 'sold'
  }

  if (raw === 'reserved' || /(reserved|reserve|бронь|забронир)/iu.test(raw)) {
    return 'reserved'
  }

  return DEFAULT_STATUS
}

function normalizeCategory(value) {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

  return raw || 'tops'
}

function sanitizeImageList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeImages(value) {
  const cleaned = sanitizeImageList(value)
  return cleaned.length > 0 ? cleaned : [DEFAULT_IMAGE]
}

function formatPostTime(date = new Date()) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeSourceType(value) {
  const raw = normalizeString(value).toLowerCase()
  return raw || null
}

function normalizeProduct(input, fallbackId = 1) {
  const id = Number(input?.id)
  const price = parsePrice(input?.price)
  const hasOldPrice = Object.prototype.hasOwnProperty.call(input ?? {}, 'oldPrice')
  const oldPrice = hasOldPrice ? parsePrice(input?.oldPrice) : null
  const createdAt = normalizeIsoDate(input?.createdAt) ?? new Date().toISOString()

  return {
    id: Number.isFinite(id) && id > 0 ? id : fallbackId,
    name: normalizeString(input?.name) || DEFAULT_NAME,
    category: normalizeCategory(input?.category),
    size: normalizeString(input?.size) || 'ONE SIZE',
    price: price ?? 0,
    oldPrice,
    images: normalizeImages(input?.images),
    subtitle: normalizeString(input?.subtitle),
    quote: normalizeString(input?.quote),
    postViews: Number.isFinite(Number(input?.postViews)) ? Number(input.postViews) : 0,
    postTime: normalizeString(input?.postTime) || formatPostTime(),
    status: normalizeStatus(input?.status),
    sourceType: normalizeSourceType(input?.sourceType),
    sourceChannel: normalizeString(input?.sourceChannel) || null,
    sourcePostId: normalizeSourcePostId(input?.sourcePostId),
    sourceUrl: normalizeString(input?.sourceUrl) || null,
    sourceDateTime: normalizeIsoDate(input?.sourceDateTime),
    sourceText: normalizeString(input?.sourceText),
    syncedAt: normalizeIsoDate(input?.syncedAt),
    createdAt,
  }
}

function buildSourceKey(sourceChannel, sourcePostId) {
  if (!sourceChannel || !sourcePostId) {
    return null
  }

  return `${sourceChannel}:${sourcePostId}`
}

function buildFallbackDedupKey(product) {
  const normalized = normalizeProduct(product, product?.id ?? 1)
  const image = normalized.images[0] ? normalized.images[0].split('?')[0].toLowerCase() : ''
  return `${normalized.name.toLowerCase()}|${normalized.size.toUpperCase()}|${normalized.price}|${image}`
}

function sortProducts(products) {
  return [...products].sort((left, right) => {
    const leftTs = Date.parse(left?.sourceDateTime || left?.createdAt || '')
    const rightTs = Date.parse(right?.sourceDateTime || right?.createdAt || '')

    if (Number.isFinite(leftTs) && Number.isFinite(rightTs) && leftTs !== rightTs) {
      return rightTs - leftTs
    }

    return (Number(right?.id) || 0) - (Number(left?.id) || 0)
  })
}

function arraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false
  }
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }

  return true
}

function hasSourceProductChanges(existing, incoming) {
  const existingNormalized = normalizeProduct(existing, existing.id)
  const incomingNormalized = normalizeProduct(
    {
      ...existingNormalized,
      ...incoming,
      syncedAt: existingNormalized.syncedAt,
      createdAt: existingNormalized.createdAt,
      id: existingNormalized.id,
    },
    existingNormalized.id,
  )

  if (incomingNormalized.name !== existingNormalized.name) {
    return true
  }
  if (incomingNormalized.size !== existingNormalized.size) {
    return true
  }
  if (incomingNormalized.subtitle !== existingNormalized.subtitle) {
    return true
  }
  if (incomingNormalized.quote !== existingNormalized.quote) {
    return true
  }
  if (incomingNormalized.category !== existingNormalized.category) {
    return true
  }
  if (incomingNormalized.price !== existingNormalized.price) {
    return true
  }
  if (incomingNormalized.oldPrice !== existingNormalized.oldPrice) {
    return true
  }
  if (!arraysEqual(incomingNormalized.images, existingNormalized.images)) {
    return true
  }
  if (incomingNormalized.postViews !== existingNormalized.postViews) {
    return true
  }
  if (incomingNormalized.postTime !== existingNormalized.postTime) {
    return true
  }
  if (incomingNormalized.status !== existingNormalized.status) {
    return true
  }
  if (incomingNormalized.sourceType !== existingNormalized.sourceType) {
    return true
  }
  if (incomingNormalized.sourceChannel !== existingNormalized.sourceChannel) {
    return true
  }
  if (incomingNormalized.sourcePostId !== existingNormalized.sourcePostId) {
    return true
  }
  if (incomingNormalized.sourceUrl !== existingNormalized.sourceUrl) {
    return true
  }
  if (incomingNormalized.sourceDateTime !== existingNormalized.sourceDateTime) {
    return true
  }
  if (incomingNormalized.sourceText !== existingNormalized.sourceText) {
    return true
  }

  return false
}

function mergeSyncedProduct(existing, incoming) {
  const base = normalizeProduct(existing, existing.id)
  return normalizeProduct(
    {
      ...base,
      ...incoming,
      id: base.id,
      createdAt: base.createdAt,
      syncedAt: normalizeIsoDate(incoming?.syncedAt) ?? new Date().toISOString(),
      sourceType: normalizeSourceType(incoming?.sourceType) ?? base.sourceType ?? SOURCE_TYPE_TELEGRAM,
      status: normalizeStatus(incoming?.status ?? base.status),
      postViews: Number.isFinite(Number(incoming?.postViews)) ? Number(incoming.postViews) : base.postViews,
      postTime: normalizeString(incoming?.postTime) || base.postTime || formatPostTime(),
      images: sanitizeImageList(incoming?.images).length > 0 ? incoming.images : base.images,
    },
    base.id,
  )
}

function buildNewSyncedProduct(input, nextId) {
  const sourceDateTime = normalizeIsoDate(input?.sourceDateTime)
  const createdAt = normalizeIsoDate(input?.createdAt) ?? sourceDateTime ?? new Date().toISOString()

  return normalizeProduct(
    {
      ...input,
      id: nextId,
      createdAt,
      syncedAt: normalizeIsoDate(input?.syncedAt) ?? new Date().toISOString(),
      sourceType: normalizeSourceType(input?.sourceType) ?? SOURCE_TYPE_TELEGRAM,
      status: normalizeStatus(input?.status),
      postViews: Number.isFinite(Number(input?.postViews)) ? Number(input.postViews) : 0,
      postTime:
        normalizeString(input?.postTime) ||
        formatPostTime(sourceDateTime ? new Date(sourceDateTime) : new Date()),
    },
    nextId,
  )
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  try {
    await fs.access(PRODUCTS_PATH)
  } catch {
    const seeded = SEED_PRODUCTS.map((item) => normalizeProduct(item, item.id))
    await fs.writeFile(PRODUCTS_PATH, JSON.stringify({ products: seeded }, null, 2), 'utf8')
  }
}

export async function readProducts() {
  await ensureStore()

  const content = await fs.readFile(PRODUCTS_PATH, 'utf8')
  const parsed = JSON.parse(content)
  const products = Array.isArray(parsed?.products) ? parsed.products : []

  return products.map((item, index) => normalizeProduct(item, index + 1))
}

export async function writeProducts(products) {
  const normalized = products.map((item, index) => normalizeProduct(item, index + 1))
  await fs.writeFile(PRODUCTS_PATH, JSON.stringify({ products: normalized }, null, 2), 'utf8')
  return normalized
}

export async function createProduct(input) {
  const current = await readProducts()
  const nextId = current.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1

  const product = normalizeProduct(
    {
      ...input,
      id: nextId,
      createdAt: new Date().toISOString(),
      postViews: 0,
      postTime: formatPostTime(),
    },
    nextId,
  )

  if (!product.name || product.price <= 0 || !product.size) {
    throw new Error('Invalid product payload: name, size and price are required')
  }

  const updated = [product, ...current]
  await writeProducts(updated)
  return product
}

export async function upsertProductsBySource(incomingProducts) {
  if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
    return {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
    }
  }

  const current = await readProducts()
  const nextProducts = [...current]
  const sourceIndex = new Map()

  for (let index = 0; index < nextProducts.length; index += 1) {
    const product = nextProducts[index]
    const key = buildSourceKey(product.sourceChannel, product.sourcePostId)
    if (key) {
      sourceIndex.set(key, index)
    }
  }

  let nextId = nextProducts.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  let created = 0
  let updated = 0
  let skipped = 0

  for (const incoming of incomingProducts) {
    const sourceChannel = normalizeString(incoming?.sourceChannel)
    const sourcePostId = normalizeSourcePostId(incoming?.sourcePostId)
    const key = buildSourceKey(sourceChannel, sourcePostId)

    if (!key) {
      skipped += 1
      continue
    }

    const incomingPrepared = {
      ...incoming,
      sourceType: normalizeSourceType(incoming?.sourceType) ?? SOURCE_TYPE_TELEGRAM,
      sourceChannel,
      sourcePostId,
      status: normalizeStatus(incoming?.status),
    }

    const existingIndex = sourceIndex.get(key)
    if (existingIndex === undefined) {
      const createdProduct = buildNewSyncedProduct(incomingPrepared, nextId)
      nextProducts.push(createdProduct)
      sourceIndex.set(key, nextProducts.length - 1)
      nextId += 1
      created += 1
      continue
    }

    const existingProduct = nextProducts[existingIndex]
    if (!hasSourceProductChanges(existingProduct, incomingPrepared)) {
      skipped += 1
      continue
    }

    const merged = mergeSyncedProduct(existingProduct, {
      ...incomingPrepared,
      syncedAt: normalizeIsoDate(incoming?.syncedAt) ?? new Date().toISOString(),
    })
    nextProducts[existingIndex] = merged
    updated += 1
  }

  if (created > 0 || updated > 0) {
    const sorted = sortProducts(nextProducts)
    await writeProducts(sorted)
  }

  return {
    total: incomingProducts.length,
    created,
    updated,
    skipped,
  }
}

export async function pruneProductsBySourceKeys(sourceKeys, options = {}) {
  const normalizedKeys = new Set(
    [...(sourceKeys ?? [])]
      .filter(Boolean)
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean),
  )

  const channelFilterRaw = normalizeString(options.channel).toLowerCase()
  const channelFilter = channelFilterRaw || null
  const current = await readProducts()
  const kept = []
  let removed = 0

  for (const product of current) {
    const normalized = normalizeProduct(product, product.id)
    const isTelegram = normalized.sourceType === SOURCE_TYPE_TELEGRAM
    const channel = normalizeString(normalized.sourceChannel).toLowerCase()
    const inScope = isTelegram && (!channelFilter || channel === channelFilter)

    if (!inScope) {
      kept.push(normalized)
      continue
    }

    const sourceKey = buildSourceKey(normalized.sourceChannel, normalized.sourcePostId)?.toLowerCase()
    if (!sourceKey || !normalizedKeys.has(sourceKey)) {
      removed += 1
      continue
    }

    kept.push(normalized)
  }

  if (removed > 0) {
    await writeProducts(sortProducts(kept))
  }

  return {
    total: current.length,
    kept: kept.length,
    removed,
    changed: removed > 0,
  }
}

export async function cleanupProductsStore(options = {}) {
  const keepOnlyTelegram = options.keepOnlyTelegram !== false
  const current = await readProducts()
  const sorted = sortProducts(current)

  const seenSource = new Set()
  const seenFallback = new Set()
  const cleaned = []
  let removedNonTelegram = 0
  let removedDuplicates = 0

  for (const product of sorted) {
    const normalized = normalizeProduct(product, product.id)

    if (keepOnlyTelegram && normalized.sourceType !== SOURCE_TYPE_TELEGRAM) {
      removedNonTelegram += 1
      continue
    }

    const sourceKey = buildSourceKey(normalized.sourceChannel, normalized.sourcePostId)
    if (sourceKey) {
      if (seenSource.has(sourceKey)) {
        removedDuplicates += 1
        continue
      }
      seenSource.add(sourceKey)
    } else {
      const fallbackKey = buildFallbackDedupKey(normalized)
      if (seenFallback.has(fallbackKey)) {
        removedDuplicates += 1
        continue
      }
      seenFallback.add(fallbackKey)
    }

    cleaned.push(normalized)
  }

  const changed = cleaned.length !== current.length
  if (changed) {
    await writeProducts(cleaned)
  }

  return {
    total: current.length,
    kept: cleaned.length,
    removedNonTelegram,
    removedDuplicates,
    changed,
  }
}
