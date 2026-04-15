import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_PRODUCTS } from './seed-products.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../data')
const PRODUCTS_PATH = path.resolve(DATA_DIR, 'products.json')
const DEFAULT_IMAGE = 'https://placehold.co/640x840/f4f0eb/111?text=CYCLE'

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

function normalizeCategory(value) {
  const raw = String(value ?? '').toLowerCase()
  if (['tops', 'pants', 'outerwear', 'shoes'].includes(raw)) {
    return raw
  }

  return 'tops'
}

function normalizeImages(value) {
  if (!Array.isArray(value)) {
    return [DEFAULT_IMAGE]
  }

  const cleaned = value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return cleaned.length > 0 ? cleaned : [DEFAULT_IMAGE]
}

function formatPostTime(date = new Date()) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeProduct(input, fallbackId = 1) {
  const id = Number(input?.id)
  const price = parsePrice(input?.price)
  const oldPrice = parsePrice(input?.oldPrice)
  const createdAt =
    typeof input?.createdAt === 'string' && input.createdAt.trim() ? input.createdAt : new Date().toISOString()

  return {
    id: Number.isFinite(id) && id > 0 ? id : fallbackId,
    name: String(input?.name ?? 'Без названия').trim() || 'Без названия',
    category: normalizeCategory(input?.category),
    size: String(input?.size ?? 'ONE SIZE').trim() || 'ONE SIZE',
    price: price ?? 0,
    oldPrice,
    images: normalizeImages(input?.images),
    subtitle: String(input?.subtitle ?? '').trim(),
    quote: String(input?.quote ?? '').trim(),
    postViews: Number.isFinite(Number(input?.postViews)) ? Number(input.postViews) : 0,
    postTime: String(input?.postTime ?? formatPostTime()).trim() || formatPostTime(),
    createdAt,
  }
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

