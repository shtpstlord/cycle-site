import { parseTelegramPost } from './post-parser.js'
import { upsertProductsBySource } from './products-store.js'

const DEFAULT_CHANNEL_USERNAME = 'cycle_showroom'
const DEFAULT_SYNC_ENABLED = true
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000
const DEFAULT_POST_LIMIT = 40
const DEFAULT_REQUEST_TIMEOUT_MS = 15000
const DEFAULT_MAX_PAGES = 6

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return fallback
}

function parseNumber(value, fallback, minimum) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(minimum, Math.floor(parsed))
}

function normalizeChannelUsername(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return DEFAULT_CHANNEL_USERNAME
  }

  const withoutProtocol = raw
    .replace(/^https?:\/\//i, '')
    .replace(/^t\.me\//i, '')
    .replace(/^s\//i, '')
    .replace(/^@/, '')

  return withoutProtocol.split(/[/?#]/)[0] || DEFAULT_CHANNEL_USERNAME
}

function resolveSyncConfig(overrides = {}) {
  const username = normalizeChannelUsername(overrides.username ?? process.env.TG_CHANNEL_USERNAME)
  const enabled = parseBoolean(overrides.enabled ?? process.env.TG_CHANNEL_SYNC_ENABLED, DEFAULT_SYNC_ENABLED)
  const intervalMs = parseNumber(overrides.intervalMs ?? process.env.TG_CHANNEL_SYNC_INTERVAL_MS, DEFAULT_INTERVAL_MS, 10000)
  const postsLimit = parseNumber(overrides.postsLimit ?? process.env.TG_CHANNEL_SYNC_LIMIT, DEFAULT_POST_LIMIT, 1)
  const maxPages = parseNumber(overrides.maxPages ?? process.env.TG_CHANNEL_SYNC_MAX_PAGES, DEFAULT_MAX_PAGES, 1)
  const requestTimeoutMs = parseNumber(
    overrides.requestTimeoutMs ?? process.env.TG_CHANNEL_SYNC_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
    1000,
  )

  return {
    enabled,
    username,
    intervalMs,
    postsLimit,
    maxPages,
    requestTimeoutMs,
  }
}

function decodeHtmlEntities(source) {
  const namedEntities = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  }

  return String(source ?? '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = String(entity).toLowerCase()

    if (normalized.startsWith('#x')) {
      const codePoint = Number.parseInt(normalized.slice(2), 16)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match
    }

    if (normalized.startsWith('#')) {
      const codePoint = Number.parseInt(normalized.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match
    }

    return namedEntities[normalized] ?? match
  })
}

function htmlToText(fragment) {
  const withLineBreaks = String(fragment ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')

  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, ' ')
  const decoded = decodeHtmlEntities(withoutTags)

  return decoded
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\t ]{2,}/g, ' ')
    .trim()
}

function parsePostId(rawValue) {
  if (!rawValue) {
    return null
  }

  const value = String(rawValue).trim()
  const trailingDigits = value.match(/(\d+)(?!.*\d)/)
  return trailingDigits?.[1] ?? value
}

function extractPhotoUrlsFromBlock(block) {
  const urls = new Set()
  const imageRegex =
    /class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\((?:'|")?([^'")]+)(?:'|")?\)[^"]*"/gi

  let match = imageRegex.exec(block)
  while (match) {
    const url = decodeHtmlEntities(match[1]).trim()
    if (url) {
      urls.add(url)
    }
    match = imageRegex.exec(block)
  }

  return [...urls]
}

function extractPostText(block) {
  const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i)
  if (!textMatch?.[1]) {
    return ''
  }

  return htmlToText(textMatch[1])
}

function extractPostViews(block) {
  const viewsMatch = block.match(/<span class="tgme_widget_message_views">([^<]+)<\/span>/i)
  if (!viewsMatch?.[1]) {
    return 0
  }

  const digits = viewsMatch[1].replace(/[^\d]/g, '')
  if (!digits) {
    return 0
  }

  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : 0
}

function parsePostBlock(block, fallbackUsername) {
  const dataPostMatch = block.match(/data-post="([^"]+)"/i)
  if (!dataPostMatch?.[1]) {
    return null
  }

  const dataPost = decodeHtmlEntities(dataPostMatch[1])
  const [rawChannel, rawPostId] = dataPost.split('/')
  const channel = normalizeChannelUsername(rawChannel || fallbackUsername)
  const postId = parsePostId(rawPostId || dataPost)

  if (!postId) {
    return null
  }

  const dateLinkMatch = block.match(/<a class="tgme_widget_message_date" href="([^"]+)"/i)
  const url = decodeHtmlEntities(dateLinkMatch?.[1] || `https://t.me/${channel}/${postId}`)

  const datetimeMatch = block.match(/<time[^>]*datetime="([^"]+)"/i)
  const parsedDate = datetimeMatch?.[1] ? new Date(datetimeMatch[1]) : null
  const datetime = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null

  return {
    channel,
    postId,
    url,
    datetime,
    text: extractPostText(block),
    images: extractPhotoUrlsFromBlock(block),
    views: extractPostViews(block),
  }
}

export function parseTelegramChannelHtml(html, fallbackUsername = DEFAULT_CHANNEL_USERNAME) {
  const chunks = String(html ?? '').split('<div class="tgme_widget_message_wrap js-widget_message_wrap">').slice(1)

  const posts = chunks
    .map((block) => parsePostBlock(block, fallbackUsername))
    .filter(Boolean)

  return posts.sort((left, right) => {
    const leftId = Number(left.postId)
    const rightId = Number(right.postId)

    if (Number.isFinite(leftId) && Number.isFinite(rightId) && leftId !== rightId) {
      return rightId - leftId
    }

    const leftTs = Date.parse(left.datetime ?? '')
    const rightTs = Date.parse(right.datetime ?? '')
    if (Number.isFinite(leftTs) && Number.isFinite(rightTs) && leftTs !== rightTs) {
      return rightTs - leftTs
    }

    return 0
  })
}

function detectStatus(text) {
  const normalized = String(text ?? '').toLowerCase()

  if (/(sold|продано|продан|продана|проданы|sold out)/i.test(normalized)) {
    return 'sold'
  }

  if (/(бронь|забронир|reserved|reserve)/i.test(normalized)) {
    return 'reserved'
  }

  return 'available'
}

function firstMeaningfulLine(text) {
  const line = String(text ?? '')
    .split('\n')
    .map((item) => item.trim())
    .find(Boolean)

  return line ? line.slice(0, 120) : ''
}

function toPostTime(datetime) {
  if (!datetime) {
    return ''
  }

  const date = new Date(datetime)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isLikelyProductPost(post, parsed, status) {
  if (!post?.text || !Array.isArray(post.images) || post.images.length === 0) {
    return false
  }

  if (Number(parsed?.price) > 0) {
    return true
  }

  if (status !== 'available') {
    return true
  }

  return /(размер|цена|для заказа|price|size)/i.test(post.text)
}

function postToProduct(post, defaultChannel) {
  const parsed = parseTelegramPost(post.text)
  const status = detectStatus(post.text)

  if (!isLikelyProductPost(post, parsed, status)) {
    return null
  }

  const now = new Date().toISOString()
  const product = {
    name: parsed?.name?.trim() || firstMeaningfulLine(post.text) || `Telegram post ${post.postId}`,
    subtitle: parsed?.subtitle?.trim() || '',
    quote: parsed?.quote?.trim() || '',
    size: parsed?.size?.trim() || 'ONE SIZE',
    category: parsed?.category || 'tops',
    images: post.images,
    status,
    sourceType: 'telegram',
    sourceChannel: post.channel || defaultChannel,
    sourcePostId: post.postId,
    sourceUrl: post.url,
    sourceDateTime: post.datetime,
    sourceText: post.text,
    syncedAt: now,
    postViews: post.views || 0,
    postTime: toPostTime(post.datetime),
    createdAt: post.datetime || now,
  }

  if (Number(parsed?.price) > 0) {
    product.price = Number(parsed.price)
    product.oldPrice = Number(parsed?.oldPrice) > 0 ? Number(parsed.oldPrice) : null
  }

  return product
}

function buildChannelPageUrl(username, beforeCursor) {
  const base = `https://t.me/s/${encodeURIComponent(username)}`
  if (!beforeCursor) {
    return base
  }

  return `${base}?before=${encodeURIComponent(beforeCursor)}`
}

async function fetchChannelHtmlPage(config, beforeCursor = null) {
  const url = buildChannelPageUrl(config.username, beforeCursor)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs)

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`telegram channel request failed: ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

function extractBeforeCursor(html) {
  const match = String(html ?? '').match(/class="tme_messages_more[^"]*"[^>]*data-before="([^"]+)"/i)
  if (!match?.[1]) {
    return null
  }

  const cursor = String(match[1]).trim()
  return cursor || null
}

async function fetchChannelPosts(config) {
  const collected = []
  const seenIds = new Set()
  let beforeCursor = null
  let pagesFetched = 0

  while (pagesFetched < config.maxPages && collected.length < config.postsLimit) {
    const html = await fetchChannelHtmlPage(config, beforeCursor)
    pagesFetched += 1

    const posts = parseTelegramChannelHtml(html, config.username)
    for (const post of posts) {
      const key = `${post.channel}:${post.postId}`
      if (seenIds.has(key)) {
        continue
      }
      seenIds.add(key)
      collected.push(post)
      if (collected.length >= config.postsLimit) {
        break
      }
    }

    const nextBefore = extractBeforeCursor(html)
    if (!nextBefore || nextBefore === beforeCursor) {
      break
    }
    beforeCursor = nextBefore
  }

  return {
    posts: collected.slice(0, config.postsLimit),
    pagesFetched,
  }
}

export async function syncChannelOnce(overrides = {}) {
  const config = resolveSyncConfig(overrides)

  if (!config.enabled) {
    return {
      ok: true,
      skipped: true,
      reason: 'disabled',
      pagesFetched: 0,
      fetchedPosts: 0,
      candidateCards: 0,
      created: 0,
      updated: 0,
      skippedItems: 0,
    }
  }

  const { posts, pagesFetched } = await fetchChannelPosts(config)
  const cards = posts
    .map((post) => postToProduct(post, config.username))
    .filter(Boolean)

  const upsertResult = await upsertProductsBySource(cards)

  return {
    ok: true,
    skipped: false,
    reason: null,
    pagesFetched,
    fetchedPosts: posts.length,
    candidateCards: cards.length,
    created: upsertResult.created,
    updated: upsertResult.updated,
    skippedItems: upsertResult.skipped,
  }
}

export async function startChannelSync(overrides = {}) {
  const config = resolveSyncConfig(overrides)

  if (!config.enabled) {
    console.log('[channel-sync] disabled by env')
    return {
      config,
      stop() {},
      runNow: async () => ({ ok: true, skipped: true, reason: 'disabled' }),
    }
  }

  let timer = null
  let running = false

  const run = async (trigger) => {
    if (running) {
      return
    }

    running = true

    try {
      const result = await syncChannelOnce(config)
      console.log(
        `[channel-sync] ${trigger}: pages=${result.pagesFetched}, fetched=${result.fetchedPosts}, cards=${result.candidateCards}, created=${result.created}, updated=${result.updated}`,
      )
    } catch (error) {
      console.error(`[channel-sync] ${trigger} failed:`, error)
    } finally {
      running = false
    }
  }

  await run('startup')

  timer = setInterval(() => {
    void run('polling')
  }, config.intervalMs)

  return {
    config,
    stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    },
    runNow: async () => run('manual'),
  }
}
