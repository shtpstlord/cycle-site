const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'

const ALLOWED_IMAGE_HOSTS = [
  'telesco.pe',
  'cdn1.telesco.pe',
  'cdn2.telesco.pe',
  'cdn3.telesco.pe',
  'cdn4.telesco.pe',
  'cdn5.telesco.pe',
]
const TELEGRAM_IMAGE_HOST_CANDIDATES = [
  'cdn1.telesco.pe',
  'cdn2.telesco.pe',
  'cdn3.telesco.pe',
  'cdn4.telesco.pe',
  'cdn5.telesco.pe',
  'telesco.pe',
]
const IMAGE_FETCH_TIMEOUT_MS = 12000

export class ImageProxyError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'ImageProxyError'
    this.statusCode = statusCode
  }
}

function isAllowedHost(hostname) {
  const host = String(hostname ?? '').trim().toLowerCase()
  if (!host) {
    return false
  }

  if (ALLOWED_IMAGE_HOSTS.includes(host)) {
    return true
  }

  return host.endsWith('.telesco.pe')
}

export function resolveImageProxyTarget(rawUrl) {
  const value = String(rawUrl ?? '').trim()
  if (!value) {
    throw new ImageProxyError('Missing image URL', 400)
  }

  let parsedUrl
  try {
    parsedUrl = new URL(value)
  } catch {
    throw new ImageProxyError('Invalid image URL', 400)
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ImageProxyError('Only HTTP(S) image URLs are allowed', 400)
  }

  if (!isAllowedHost(parsedUrl.hostname)) {
    throw new ImageProxyError('Image host is not allowed', 403)
  }

  return parsedUrl.toString()
}

function buildTelegramHostFallbackUrls(targetUrl) {
  let parsed
  try {
    parsed = new URL(targetUrl)
  } catch {
    return [targetUrl]
  }

  const host = parsed.hostname.toLowerCase()
  const isTelegramHost =
    host === 'telesco.pe' || /^cdn\d+\.telesco\.pe$/i.test(host) || host.endsWith('.telesco.pe')
  if (!isTelegramHost) {
    return [targetUrl]
  }

  const urls = [targetUrl]
  for (const candidateHost of TELEGRAM_IMAGE_HOST_CANDIDATES) {
    if (candidateHost === host) {
      continue
    }
    const next = new URL(parsed.toString())
    next.hostname = candidateHost
    urls.push(next.toString())
  }

  return [...new Set(urls)]
}

async function fetchImageCandidate(url) {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), IMAGE_FETCH_TIMEOUT_MS)

  try {
    return await fetch(url, {
      headers: {
        'user-agent': DEFAULT_USER_AGENT,
        accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        referer: 'https://t.me/',
        origin: 'https://t.me',
      },
      redirect: 'follow',
      signal: abortController.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchImageViaProxy(rawUrl) {
  const targetUrl = resolveImageProxyTarget(rawUrl)
  const candidateUrls = buildTelegramHostFallbackUrls(targetUrl)

  let response = null
  let lastError = null

  for (const candidateUrl of candidateUrls) {
    try {
      const candidateResponse = await fetchImageCandidate(candidateUrl)
      if (!candidateResponse.ok) {
        lastError = new ImageProxyError(`Image fetch failed (${candidateResponse.status})`, 502)
        continue
      }

      const candidateType = candidateResponse.headers.get('content-type') || ''
      if (!/^image\//i.test(candidateType)) {
        lastError = new ImageProxyError(`Unexpected content type: ${candidateType || 'unknown'}`, 502)
        continue
      }

      response = candidateResponse
      break
    } catch (error) {
      lastError = error
    }
  }

  if (!response) {
    const message = lastError instanceof Error ? lastError.message : 'Image fetch failed'
    throw new ImageProxyError(message, 502)
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const cacheControl =
    response.headers.get('cache-control') ||
    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
  const buffer = Buffer.from(await response.arrayBuffer())

  if (buffer.length === 0) {
    throw new ImageProxyError('Empty image response', 502)
  }

  return {
    contentType,
    cacheControl,
    body: buffer,
  }
}
