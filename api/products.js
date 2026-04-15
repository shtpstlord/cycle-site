import fs from 'node:fs/promises'
import path from 'node:path'

const PRODUCTS_PATH = path.resolve(process.cwd(), 'data', 'products.json')

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({
      ok: false,
      error: 'Method Not Allowed',
    })
  }

  try {
    const raw = await fs.readFile(PRODUCTS_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    const products = Array.isArray(parsed?.products) ? parsed.products : []

    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return response.status(200).json({
      ok: true,
      products,
      total: products.length,
    })
  } catch (error) {
    return response.status(500).json({
      ok: false,
      error: 'Failed to read products store',
      details: String(error?.message ?? error),
    })
  }
}
