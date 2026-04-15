import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readProducts, writeProducts } from './products-store.js'

dotenv.config()

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeSourcePostId(value) {
  const raw = normalizeString(value)
  if (!raw) {
    return ''
  }

  const trailingDigits = raw.match(/(\d+)(?!.*\d)/)
  return trailingDigits?.[1] ?? raw
}

function isTelegramProduct(product) {
  const sourceType = normalizeString(product?.sourceType).toLowerCase()
  if (sourceType === 'telegram') {
    return true
  }

  return Boolean(normalizeString(product?.sourceChannel) && normalizeSourcePostId(product?.sourcePostId))
}

function buildSourceKey(product) {
  const channel = normalizeString(product?.sourceChannel).toLowerCase()
  const postId = normalizeSourcePostId(product?.sourcePostId)
  if (!channel || !postId) {
    return ''
  }

  return `${channel}:${postId}`
}

function toPriceNumber(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0
  }

  return Math.round(parsed)
}

function firstImage(product) {
  if (!Array.isArray(product?.images) || product.images.length === 0) {
    return ''
  }

  return normalizeString(product.images[0])
}

function normalizeKeyPart(value) {
  return normalizeString(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function buildFallbackKey(product) {
  const name = normalizeKeyPart(product?.name)
  const size = normalizeKeyPart(product?.size)
  const price = toPriceNumber(product?.price)
  const image = normalizeKeyPart(firstImage(product))

  if (!name || !size || !price || !image) {
    return ''
  }

  return `${name}|${size}|${price}|${image}`
}

function getTimestamp(product) {
  const candidates = [product?.sourceDateTime, product?.createdAt, product?.syncedAt]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    const timestamp = Date.parse(String(candidate))
    if (Number.isFinite(timestamp)) {
      return timestamp
    }
  }

  return 0
}

function scoreProduct(product) {
  let score = 0

  if (normalizeString(product?.sourceType).toLowerCase() === 'telegram') {
    score += 100
  }

  if (buildSourceKey(product)) {
    score += 60
  }

  if (toPriceNumber(product?.price) > 0) {
    score += 25
  }

  if (normalizeString(product?.name)) {
    score += 15
  }

  if (normalizeString(product?.size)) {
    score += 10
  }

  if (Array.isArray(product?.images)) {
    score += Math.min(product.images.length, 5)
  }

  if (normalizeString(product?.sourceText)) {
    score += 5
  }

  return score
}

function pickPreferred(left, right) {
  const leftScore = scoreProduct(left)
  const rightScore = scoreProduct(right)

  if (leftScore !== rightScore) {
    return rightScore > leftScore ? right : left
  }

  return getTimestamp(right) > getTimestamp(left) ? right : left
}

function sortByRecency(products) {
  return [...products].sort((left, right) => {
    const rightTs = getTimestamp(right)
    const leftTs = getTimestamp(left)
    if (rightTs !== leftTs) {
      return rightTs - leftTs
    }

    return (Number(right?.id) || 0) - (Number(left?.id) || 0)
  })
}

export async function cleanAndDedupeProducts() {
  const products = await readProducts()
  const totalBefore = products.length

  const telegramOnly = products.filter((product) => isTelegramProduct(product))
  const removedNonTelegram = totalBefore - telegramOnly.length

  const sourceMap = new Map()
  const withoutSource = []
  let removedBySource = 0

  for (const product of telegramOnly) {
    const key = buildSourceKey(product)
    if (!key) {
      withoutSource.push(product)
      continue
    }

    const existing = sourceMap.get(key)
    if (!existing) {
      sourceMap.set(key, product)
      continue
    }

    removedBySource += 1
    sourceMap.set(key, pickPreferred(existing, product))
  }

  const sourceUnique = [...sourceMap.values(), ...withoutSource]

  const fallbackMap = new Map()
  const fallbackWithoutKey = []
  let removedByFallback = 0

  for (const product of sourceUnique) {
    const key = buildFallbackKey(product)
    if (!key) {
      fallbackWithoutKey.push(product)
      continue
    }

    const existing = fallbackMap.get(key)
    if (!existing) {
      fallbackMap.set(key, product)
      continue
    }

    removedByFallback += 1
    fallbackMap.set(key, pickPreferred(existing, product))
  }

  const finalProducts = sortByRecency([...fallbackMap.values(), ...fallbackWithoutKey])
  await writeProducts(finalProducts)

  return {
    totalBefore,
    totalAfter: finalProducts.length,
    removedTotal: totalBefore - finalProducts.length,
    removedNonTelegram,
    removedBySource,
    removedByFallback,
  }
}

async function main() {
  try {
    const result = await cleanAndDedupeProducts()
    console.log('[products-clean] completed')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('[products-clean] failed:', error)
    process.exitCode = 1
  }
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectRun) {
  await main()
}
