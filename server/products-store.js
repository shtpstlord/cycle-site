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

  if (raw === 'sold' || /(sold|продан|продано)/i.test(raw)) {
    return 'sold'
  }

  if (raw === 'reserved' || /(reserved|reserve|брон)/i.test(raw)) {
    return 'reserved'
  }

  return DEFAULT_STATUS
}

function normalizeCategory(value) {
  const raw = String(value ?? '').toLowerCase()
  if (['tops', 'pants', 'outerwear', 'shoes'].includes(raw)) {
    return raw
  }

  return 'tops'
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
  if (!raw) {
    return null
  }

  return raw
}

function normalizeProduct(input, fallbackId = 1) {
  const id = Number(input?.id)
  const price = parsePrice(input?.price)
  const hasOldPrice = Object.prototype.hasOwnProperty.call(input ?? {}, 'oldPrice')
  const oldPrice = hasOldPrice ? parsePrice(input?.oldPrice) : null
  const createdAt = normalizeIsoDate(input?.createdAt) ?? new Date().toISOString()
  const sourceDateTime = normalizeIsoDate(input?.sourceDateTime)
  const syncedAt = normalizeIsoDate(input?.syncedAt)
  const sourceType = normalizeSourceType(input?.sourceType)
  const sourceChannel = normalizeString(input?.sourceChannel) || null
  const sourcePostId = normalizeSourcePostId(input?.sourcePostId)
  const sourceUrl = normalizeString(input?.sourceUrl) || null
  const sourceText = normalizeString(input?.sourceText)

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
    postTime: String(input?.postTime ?? formatPostTime()).trim() || formatPostTime(),
    status: normalizeStatus(input?.status),
    sourceType,
    sourceChannel,
    sourcePostId,
    sourceUrl,
    sourceDateTime,
    sourceText,
    syncedAt,
    createdAt,
  }
}

function buildSourceKey(sourceChannel, sourcePostId) {
  if (!sourceChannel || !sourcePostId) {
    return null
  }

  return `${sourceChannel}:${sourcePostId}`
}

function buildNewSyncedProduct(input, nextId) {
  const sourceDateTime = normalizeIsoDate(input?.sourceDateTime)
  const createdAt = normalizeIsoDate(input?.createdAt) ?? sourceDateTime ?? new Date().toISOString()
  const postTime = normalizeString(input?.postTime) || formatPostTime(sourceDateTime ? new Date(sourceDateTime) : new Date())
  const syncedAt = normalizeIsoDate(input?.syncedAt) ?? new Date().toISOString()

  return normalizeProduct(
    {
      ...input,
      id: nextId,
      postViews: Number.isFinite(Number(input?.postViews)) ? Number(input.postViews) : 0,
      postTime,
      createdAt,
      syncedAt,
      sourceType: normalizeSourceType(input?.sourceType) ?? SOURCE_TYPE_TELEGRAM,
      status: normalizeStatus(input?.status),
    },
    nextId,
  )
}

function mergeSyncedProduct(existing, incoming) {
  const incomingName = normalizeString(incoming?.name)
  const incomingSize = normalizeString(incoming?.size)
  const incomingSubtitle = normalizeString(incoming?.subtitle)
  const incomingQuote = normalizeString(incoming?.quote)
  const incomingPrice = parsePrice(incoming?.price)
  const incomingOldPriceProvided = Object.prototype.hasOwnProperty.call(incoming ?? {}, 'oldPrice')
  const incomingOldPrice = parsePrice(incoming?.oldPrice)
  const incomingImages = sanitizeImageList(incoming?.images)
  const incomingSourceType = normalizeSourceType(incoming?.sourceType)
  const incomingSourceChannel = normalizeString(incoming?.sourceChannel)
  const incomingSourcePostId = normalizeSourcePostId(incoming?.sourcePostId)
  const incomingSourceUrl = normalizeString(incoming?.sourceUrl)
  const incomingSourceDateTime = normalizeIsoDate(incoming?.sourceDateTime)
  const incomingSourceTextProvided = typeof incoming?.sourceText === 'string'
  const incomingSyncedAt = normalizeIsoDate(incoming?.syncedAt) ?? new Date().toISOString()
  const incomingPostTime = normalizeString(incoming?.postTime)
  const incomingCategory = normalizeString(incoming?.category)
  const incomingStatus = normalizeStatus(incoming?.status)

  return normalizeProduct(
    {
      ...existing,
      name: incomingName || existing.name,
      size: incomingSize || existing.size,
      subtitle: incomingSubtitle || existing.subtitle,
      quote: incomingQuote || existing.quote,
      category: incomingCategory || existing.category,
      price: incomingPrice ?? existing.price,
      oldPrice: incomingOldPriceProvided ? incomingOldPrice : existing.oldPrice,
      images: incomingImages.length > 0 ? incomingImages : existing.images,
      postViews: Number.isFinite(Number(incoming?.postViews)) ? Number(incoming.postViews) : existing.postViews,
      postTime: incomingPostTime || existing.postTime,
      status: incomingStatus || existing.status || DEFAULT_STATUS,
      sourceType: incomingSourceType || existing.sourceType,
      sourceChannel: incomingSourceChannel || existing.sourceChannel,
      sourcePostId: incomingSourcePostId || existing.sourcePostId,
      sourceUrl: incomingSourceUrl || existing.sourceUrl,
      sourceDateTime: incomingSourceDateTime || existing.sourceDateTime,
      sourceText: incomingSourceTextProvided ? normalizeString(incoming.sourceText) : existing.sourceText,
      syncedAt: incomingSyncedAt,
      createdAt: existing.createdAt,
    },
    existing.id,
  )
}

function sortProducts(products) {
  return [...products].sort((left, right) => {
    const leftTs = Date.parse(left?.createdAt ?? '')
    const rightTs = Date.parse(right?.createdAt ?? '')

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
  const incomingName = normalizeString(incoming?.name)
  if (incomingName && incomingName !== existing.name) {
    return true
  }

  const incomingSize = normalizeString(incoming?.size)
  if (incomingSize && incomingSize !== existing.size) {
    return true
  }

  const incomingSubtitle = normalizeString(incoming?.subtitle)
  if (incomingSubtitle && incomingSubtitle !== existing.subtitle) {
    return true
  }

  const incomingQuote = normalizeString(incoming?.quote)
  if (incomingQuote && incomingQuote !== existing.quote) {
    return true
  }

  const incomingCategory = normalizeString(incoming?.category)
  if (incomingCategory && incomingCategory !== existing.category) {
    return true
  }

  const incomingPrice = parsePrice(incoming?.price)
  if (incomingPrice !== null && incomingPrice !== existing.price) {
    return true
  }

  const oldPriceProvided = Object.prototype.hasOwnProperty.call(incoming ?? {}, 'oldPrice')
  if (oldPriceProvided) {
    const incomingOldPrice = parsePrice(incoming?.oldPrice)
    if (incomingOldPrice !== existing.oldPrice) {
      return true
    }
  }

  const incomingImages = sanitizeImageList(incoming?.images)
  if (incomingImages.length > 0 && !arraysEqual(incomingImages, existing.images)) {
    return true
  }

  if (Number.isFinite(Number(incoming?.postViews)) && Number(incoming.postViews) !== existing.postViews) {
    return true
  }

  const incomingPostTime = normalizeString(incoming?.postTime)
  if (incomingPostTime && incomingPostTime !== existing.postTime) {
    return true
  }

  const incomingStatus = normalizeStatus(incoming?.status)
  if (incomingStatus !== existing.status) {
    return true
  }

  const incomingSourceType = normalizeSourceType(incoming?.sourceType)
  if (incomingSourceType && incomingSourceType !== existing.sourceType) {
    return true
  }

  const incomingSourceChannel = normalizeString(incoming?.sourceChannel)
  if (incomingSourceChannel && incomingSourceChannel !== existing.sourceChannel) {
    return true
  }

  const incomingSourcePostId = normalizeSourcePostId(incoming?.sourcePostId)
  if (incomingSourcePostId && incomingSourcePostId !== existing.sourcePostId) {
    return true
  }

  const incomingSourceUrl = normalizeString(incoming?.sourceUrl)
  if (incomingSourceUrl && incomingSourceUrl !== existing.sourceUrl) {
    return true
  }

  const incomingSourceDateTime = normalizeIsoDate(incoming?.sourceDateTime)
  if (incomingSourceDateTime && incomingSourceDateTime !== existing.sourceDateTime) {
    return true
  }

  const sourceTextProvided = typeof incoming?.sourceText === 'string'
  if (sourceTextProvided && normalizeString(incoming.sourceText) !== existing.sourceText) {
    return true
  }

  return false
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
