import { fetchImageViaProxy, ImageProxyError } from '../lib/image-proxy.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({
      ok: false,
      error: 'Method Not Allowed',
    })
  }

  try {
    const payload = await fetchImageViaProxy(request.query.url)
    response.setHeader('Content-Type', payload.contentType)
    response.setHeader('Cache-Control', payload.cacheControl)
    return response.status(200).send(payload.body)
  } catch (error) {
    const statusCode = error instanceof ImageProxyError ? error.statusCode : 502
    return response.status(statusCode).json({
      ok: false,
      error: 'Failed to load image',
      details: String(error?.message ?? error),
    })
  }
}

