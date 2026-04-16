import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_ORG_ID = '62631138735'
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'

const ORG_PATH = `/maps/org/tsikl/${DEFAULT_ORG_ID}/`
const ORG_URL_CANDIDATES = [
  `https://yandex.ru${ORG_PATH}`,
  `https://yandex.com${ORG_PATH}`,
  `https://yandex.kz${ORG_PATH}`,
]
const MAX_REVIEW_PAGES = 20

const STATE_VIEW_REGEX = /<script[^>]*class="state-view"[^>]*>([\s\S]*?)<\/script>/i
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SNAPSHOT_PATH = path.resolve(__dirname, '../data/yandex-snapshot.json')

let cacheValue = null
let cacheExpiresAt = 0
let inflightPromise = null

function toCookieHeader(response) {
  if (!response?.headers) {
    return ''
  }

  if (typeof response.headers.getSetCookie !== 'function') {
    return ''
  }

  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .filter(Boolean)
    .join('; ')
}

function parseCookieHeader(cookieHeader) {
  const cookieMap = new Map()
  const source = String(cookieHeader ?? '').trim()
  if (!source) {
    return cookieMap
  }

  source.split(';').forEach((chunk) => {
    const token = chunk.trim()
    if (!token) {
      return
    }

    const separatorIndex = token.indexOf('=')
    if (separatorIndex <= 0) {
      return
    }

    const name = token.slice(0, separatorIndex).trim()
    const value = token.slice(separatorIndex + 1).trim()
    if (name) {
      cookieMap.set(name, value)
    }
  })

  return cookieMap
}

function mergeCookieHeader(currentCookieHeader, response) {
  const cookieMap = parseCookieHeader(currentCookieHeader)
  const fresh = toCookieHeader(response)

  if (!fresh) {
    return currentCookieHeader || ''
  }

  parseCookieHeader(fresh).forEach((value, name) => {
    cookieMap.set(name, value)
  })

  return [...cookieMap.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

function parseStateView(html) {
  const source = String(html ?? '')
  const match = source.match(STATE_VIEW_REGEX)
  if (!match?.[1]) {
    throw new Error('state-view block not found in Yandex page')
  }

  return JSON.parse(match[1])
}

function getOrgResult(state) {
  return state?.stack?.[0]?.results?.items?.[0] ?? null
}

function normalizeImageUrl(template) {
  if (typeof template !== 'string') {
    return ''
  }

  let value = template
    .trim()
    .replace(/\\u0026/g, '&')
    .replace(/\{size\}/g, 'orig')
    .replace(/%s/g, 'orig')

  if (value.endsWith('/%')) {
    value = `${value.slice(0, -1)}orig`
  }

  if (value.endsWith('/{')) {
    value = `${value.slice(0, -1)}orig`
  }

  if (value.startsWith('//')) {
    value = `https:${value}`
  }

  return /^https?:\/\//i.test(value) ? value : ''
}

function addPhoto(photoSet, template) {
  const normalized = normalizeImageUrl(template)
  if (normalized) {
    photoSet.add(normalized)
  }
}

function collectResultPhotos(result, photoSet) {
  if (!result) {
    return
  }

  for (const photo of result.photos?.items ?? []) {
    addPhoto(photoSet, photo?.urlTemplate)
  }

  for (const aspect of result.aspects ?? []) {
    for (const photo of aspect?.photos ?? []) {
      addPhoto(photoSet, photo?.link)
    }
  }

  for (const review of result.reviewResults?.reviews ?? []) {
    for (const photo of review?.photos ?? []) {
      addPhoto(photoSet, photo?.urlTemplate)
    }
  }
}

function formatReviewDate(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function mapReview(rawReview, fallbackIndex = 0) {
  const reviewId = String(rawReview?.reviewId ?? '').trim() || `review-${fallbackIndex}`
  const name = String(rawReview?.author?.name ?? '').trim() || 'Guest'
  const text = String(rawReview?.text ?? '').trim()
  const rating = Number(rawReview?.rating) > 0 ? Number(rawReview.rating) : 5
  const updatedTime = String(rawReview?.updatedTime ?? '').trim()
  const avatarUrl = normalizeImageUrl(rawReview?.author?.avatarUrl)
  const photos = []

  for (const photo of rawReview?.photos ?? []) {
    const normalized = normalizeImageUrl(photo?.urlTemplate)
    if (normalized) {
      photos.push(normalized)
    }
  }

  return {
    id: reviewId,
    name,
    text,
    rating,
    dateIso: updatedTime || null,
    dateLabel: formatReviewDate(updatedTime),
    avatarUrl: avatarUrl || null,
    photos,
  }
}

async function fetchHtml(url, options = {}) {
  const headers = {
    'user-agent': options.userAgent || DEFAULT_USER_AGENT,
  }

  if (options.cookie) {
    headers.cookie = options.cookie
  }

  if (options.referer) {
    headers.referer = options.referer
  }

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`Yandex request failed: ${response.status} (${url})`)
  }

  return {
    html: await response.text(),
    response,
    cookie: mergeCookieHeader(options.cookie, response),
  }
}

function dedupeReviews(reviews) {
  const seen = new Set()
  const unique = []

  for (const review of reviews) {
    if (!review?.id || seen.has(review.id)) {
      continue
    }
    seen.add(review.id)
    unique.push(review)
  }

  return unique
}

function normalizeStoredSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null
  }

  const photos = Array.isArray(snapshot.photos)
    ? snapshot.photos.filter((item) => typeof item === 'string' && item.trim())
    : []
  const reviews = Array.isArray(snapshot.reviews)
    ? snapshot.reviews.filter((item) => item && typeof item === 'object' && item.id)
    : []
  const summary = snapshot.summary && typeof snapshot.summary === 'object' ? snapshot.summary : null

  if (!summary || photos.length === 0 || reviews.length === 0) {
    return null
  }

  return {
    ok: true,
    source: {
      ...(snapshot.source && typeof snapshot.source === 'object' ? snapshot.source : {}),
      fallback: 'snapshot-file',
    },
    summary,
    photos,
    reviews,
    updatedAt: snapshot.updatedAt || null,
  }
}

async function readStoredSnapshot() {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return normalizeStoredSnapshot(parsed)
  } catch {
    return null
  }
}

export async function fetchYandexLiveSnapshot() {
  let orgState = null
  let orgResult = null
  let cookieHeader = ''
  let orgUrlUsed = ''
  let lastBootstrapError = null

  for (const candidateOrgUrl of ORG_URL_CANDIDATES) {
    try {
      const candidateOrigin = new URL(candidateOrgUrl).origin
      let bootstrapCookie = ''

      for (const warmupUrl of [`${candidateOrigin}/`, `${candidateOrigin}/maps/`]) {
        try {
          const warmup = await fetchHtml(warmupUrl, {
            cookie: bootstrapCookie,
            referer: `${candidateOrigin}/`,
          })
          bootstrapCookie = warmup.cookie || bootstrapCookie
        } catch {
          // ignore warmup errors and continue with the next warmup/candidate
        }
      }

      const { html: orgHtml, response: orgResponse, cookie: mergedCookie } = await fetchHtml(candidateOrgUrl, {
        cookie: bootstrapCookie,
        referer: `${candidateOrigin}/`,
      })
      const candidateState = parseStateView(orgHtml)
      const candidateResult = getOrgResult(candidateState)
      if (!candidateResult) {
        throw new Error('Yandex org result not found in candidate state')
      }

      orgState = candidateState
      orgResult = candidateResult
      cookieHeader = mergedCookie || toCookieHeader(orgResponse)
      orgUrlUsed = candidateOrgUrl
      break
    } catch (error) {
      lastBootstrapError = error
    }
  }

  if (!orgState || !orgResult || !orgUrlUsed) {
    throw new Error(
      `Failed to bootstrap Yandex org page: ${String(lastBootstrapError?.message ?? lastBootstrapError)}`,
    )
  }

  const reviewsUrl = `${orgUrlUsed}reviews/`
  const galleryUrl = `${orgUrlUsed}gallery/`
  const photoSet = new Set()
  const mappedReviews = []

  collectResultPhotos(orgResult, photoSet)

  try {
    const { html: galleryHtml } = await fetchHtml(galleryUrl, {
      cookie: cookieHeader,
      referer: orgUrlUsed,
    })
    const galleryState = parseStateView(galleryHtml)
    collectResultPhotos(getOrgResult(galleryState), photoSet)
  } catch {
    // Fallback: gallery page can fail due anti-bot checks. We still return org/reviews data.
  }

  const fetchReviewsPageForOrg = async (page) => {
    const pageUrl = page <= 1 ? reviewsUrl : `${reviewsUrl}?page=${page}`
    const { html } = await fetchHtml(pageUrl, {
      cookie: cookieHeader,
      referer: orgUrlUsed,
    })
    const state = parseStateView(html)
    return getOrgResult(state)
  }

  const firstReviewsPage = await fetchReviewsPageForOrg(1)
  const firstPageReviews = firstReviewsPage?.reviewResults?.reviews ?? []
  const totalPages = Math.min(
    Math.max(Number(firstReviewsPage?.reviewResults?.params?.totalPages) || 1, 1),
    MAX_REVIEW_PAGES,
  )

  firstPageReviews.forEach((rawReview, index) => {
    const mapped = mapReview(rawReview, index + 1)
    mappedReviews.push(mapped)
    mapped.photos.forEach((photoUrl) => photoSet.add(photoUrl))
  })

  for (let page = 2; page <= totalPages; page += 1) {
    const reviewsPage = await fetchReviewsPageForOrg(page)
    const pageReviews = reviewsPage?.reviewResults?.reviews ?? []

    pageReviews.forEach((rawReview, index) => {
      const mapped = mapReview(rawReview, page * 1000 + index)
      mappedReviews.push(mapped)
      mapped.photos.forEach((photoUrl) => photoSet.add(photoUrl))
    })
  }

  const summary = {
    title: String(orgResult.title ?? '').trim() || 'Цикл',
    ratingValue: Number(orgResult?.ratingData?.ratingValue) || 0,
    ratingCount: Number(orgResult?.ratingData?.ratingCount) || 0,
    reviewCount: Number(orgResult?.ratingData?.reviewCount) || 0,
    photosCount: Number(orgResult?.photos?.count) || photoSet.size,
  }

  return {
    ok: true,
    source: {
      orgId: DEFAULT_ORG_ID,
      orgUrl: orgUrlUsed,
      reviewsUrl,
      galleryUrl,
      reviewPagesFetched: totalPages,
    },
    summary,
    photos: [...photoSet],
    reviews: dedupeReviews(mappedReviews),
    updatedAt: new Date().toISOString(),
  }
}

export async function getYandexLiveSnapshot(options = {}) {
  const ttlMs = Number(options.ttlMs) > 0 ? Number(options.ttlMs) : 90_000
  const force = options.force === true

  if (!force && cacheValue && Date.now() < cacheExpiresAt) {
    return cacheValue
  }

  if (inflightPromise) {
    return inflightPromise
  }

  inflightPromise = fetchYandexLiveSnapshot()
    .then((snapshot) => {
      cacheValue = snapshot
      cacheExpiresAt = Date.now() + ttlMs
      return snapshot
    })
    .catch(async (error) => {
      if (cacheValue) {
        return {
          ...cacheValue,
          stale: true,
          staleReason: String(error?.message ?? error),
        }
      }

      const storedSnapshot = await readStoredSnapshot()
      if (storedSnapshot) {
        cacheValue = storedSnapshot
        cacheExpiresAt = Date.now() + ttlMs
        return {
          ...storedSnapshot,
          stale: true,
          staleReason: String(error?.message ?? error),
        }
      }

      throw error
    })
    .finally(() => {
      inflightPromise = null
    })

  return inflightPromise
}
