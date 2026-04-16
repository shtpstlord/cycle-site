import { getYandexLiveSnapshot } from '../lib/yandex-live.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({
      ok: false,
      error: 'Method Not Allowed',
    })
  }

  try {
    const snapshot = await getYandexLiveSnapshot()
    response.setHeader('Cache-Control', 's-maxage=45, stale-while-revalidate=120')
    return response.status(200).json(snapshot)
  } catch (error) {
    return response.status(502).json({
      ok: false,
      error: 'Failed to load Yandex live data',
      details: String(error?.message ?? error),
    })
  }
}

