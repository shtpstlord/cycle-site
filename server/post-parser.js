const ORDER_MARKER_REGEX = /(для\s+заказа|@cycle_order|cycle[_\s-]?order|order\s*@)/iu
const STATUS_MARKER_REGEX = /(sold|sold\s*out|продан[аоы]?|бронь|reserved|reserve)/iu
const SIZE_LINE_REGEX = /^(?:[-*•⁃–—]\s*)?(?:размер|size)\s*:\s*(.+)$/iu
const PRICE_LINE_REGEX = /^(?:[-*•⁃–—]\s*)?(?:цена|price)\s*:\s*(.+)$/iu
const META_LINE_REGEX = /^(?:[-*•⁃–—]\s*)?(?:размер|size|цена|price)\s*:/iu

function toRubNumber(rawValue) {
  if (!rawValue) {
    return null
  }

  const digits = String(rawValue).replace(/[^\d]/g, '')
  if (!digits) {
    return null
  }

  const number = Number(digits)
  return Number.isFinite(number) ? number : null
}

function cleanLine(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isOrderLine(line) {
  return ORDER_MARKER_REGEX.test(String(line ?? ''))
}

function isMetaLine(line) {
  const normalized = cleanLine(line)
  if (!normalized) {
    return false
  }

  if (isOrderLine(normalized)) {
    return true
  }

  if (META_LINE_REGEX.test(normalized)) {
    return true
  }

  return STATUS_MARKER_REGEX.test(normalized) && /^(?:[-*•⁃–—]|\()/u.test(normalized)
}

function normalizeSizeValue(value) {
  const cleaned = cleanLine(value)
    .replace(/\((?:бронь|продан[аоы]?|reserved|sold)[^)]*\)/giu, '')
    .replace(/[.,;]+$/, '')
    .trim()

  if (!cleaned) {
    return ''
  }

  const compact = cleaned.replace(/\s+/g, ' ')

  if (/^os$/iu.test(compact)) {
    return 'ONE SIZE'
  }

  if (/^(xxxl|xxl|xl|l|m|s|xs|one size)$/iu.test(compact)) {
    return compact.toUpperCase()
  }

  return compact.replace(/\s*\/\s*/g, '/')
}

function hasKeyword(source, expression) {
  return expression.test(String(source ?? '').toLowerCase())
}

export function inferCategory(source) {
  const text = String(source ?? '').toLowerCase()

  if (hasKeyword(text, /(кроссовк|кед|ботин|сапог|туфл|shoe|sneaker|loafer|boots?)/i)) {
    return 'shoes'
  }

  if (hasKeyword(text, /(брюк|джинс|карго|чинос|штаны|slacks?|pants|jeans|trouser|chino)/i)) {
    return 'pants'
  }

  if (hasKeyword(text, /(куртк|пухов|парк|пальт|ветровк|бомбер|софтшел|jacket|outerwear|coat)/i)) {
    return 'outerwear'
  }

  return 'tops'
}

function extractExplicitSize(lines) {
  for (const line of lines) {
    const explicit = cleanLine(line).match(SIZE_LINE_REGEX)
    if (!explicit?.[1]) {
      continue
    }

    const candidate = normalizeSizeValue(explicit[1])
    if (candidate) {
      return candidate
    }
  }

  return null
}

function parsePriceFromValue(value) {
  const source = cleanLine(value)
  const currencyValues = [...source.matchAll(/(\d[\d\s.,]*)\s*(?:₽|р\b|руб)/giu)]
    .map((match) => toRubNumber(match[1]))
    .filter((number) => Number.isFinite(number) && number > 0)

  const percentValues = new Set(
    [...source.matchAll(/(\d[\d\s.,]*)\s*%/giu)]
      .map((match) => toRubNumber(match[1]))
      .filter((number) => Number.isFinite(number) && number > 0),
  )

  const dateValues = new Set(
    [...source.matchAll(/\b(\d{1,2}\.\d{1,2})\b/gu)]
      .map((match) => toRubNumber(match[1]))
      .filter((number) => Number.isFinite(number) && number > 0),
  )

  const allNumbers = [...source.matchAll(/\d[\d\s.,]*/g)]
    .map((match) => toRubNumber(match[0]))
    .filter((number) => Number.isFinite(number) && number > 0)
    .filter((number) => !percentValues.has(number) && !dateValues.has(number))

  if (currencyValues.length >= 2) {
    return {
      oldPrice: currencyValues[0],
      price: currencyValues[currencyValues.length - 1],
    }
  }

  if (currencyValues.length === 1) {
    const price = currencyValues[0]
    const oldPrice = allNumbers.find((number) => number > price && number !== price) ?? null
    return {
      oldPrice,
      price,
    }
  }

  if (allNumbers.length >= 2) {
    return {
      oldPrice: allNumbers[0],
      price: allNumbers[allNumbers.length - 1],
    }
  }

  if (allNumbers.length === 1) {
    return {
      oldPrice: null,
      price: allNumbers[0],
    }
  }

  return {
    oldPrice: null,
    price: null,
  }
}

function extractExplicitPrice(lines) {
  for (const line of lines) {
    const explicit = cleanLine(line).match(PRICE_LINE_REGEX)
    if (!explicit?.[1]) {
      continue
    }

    const parsed = parsePriceFromValue(explicit[1])
    if (parsed.price && parsed.price > 0) {
      return parsed
    }
  }

  return {
    oldPrice: null,
    price: null,
  }
}

function extractQuote(nonMetaLines, subtitle) {
  const startIndex = subtitle ? 2 : 1
  const candidates = nonMetaLines.slice(startIndex)

  const candidate = candidates.find((line) => {
    const normalized = cleanLine(line)
    if (!normalized || isMetaLine(normalized) || isOrderLine(normalized)) {
      return false
    }

    return normalized.length >= 16
  })

  if (!candidate) {
    return ''
  }

  return cleanLine(candidate).replace(/^[«"“]/u, '').replace(/[»"”]$/u, '').trim()
}

function sanitizeSourceLines(lines) {
  return lines.filter((line) => {
    const normalized = cleanLine(line)
    return Boolean(normalized) && !isOrderLine(normalized)
  })
}

export function parseTelegramPost(rawText) {
  const source = String(rawText ?? '').replace(/\r/g, '\n')
  const lines = source
    .split('\n')
    .map((line) => cleanLine(line))
    .filter(Boolean)

  if (!lines.length) {
    return null
  }

  const sanitizedLines = sanitizeSourceLines(lines)
  if (!sanitizedLines.length) {
    return null
  }

  const size = extractExplicitSize(sanitizedLines)
  const { price, oldPrice } = extractExplicitPrice(sanitizedLines)

  // Strict mode: create cards only if explicit size and price fields are present.
  if (!size || !price || price <= 0) {
    return null
  }

  const nonMetaLines = sanitizedLines.filter((line) => !isMetaLine(line))
  const name = cleanLine(nonMetaLines[0] || 'Без названия')
  let subtitle = cleanLine(nonMetaLines[1] || '')

  if (isMetaLine(subtitle)) {
    subtitle = ''
  }

  const quote = extractQuote(nonMetaLines, subtitle)
  const sanitizedSourceText = sanitizedLines.join('\n')
  const category = inferCategory([name, subtitle, quote].join(' '))

  return {
    name,
    subtitle,
    quote: cleanLine(quote),
    size,
    price,
    oldPrice: oldPrice ?? null,
    category,
    warnings: [],
    sourceText: sanitizedSourceText,
  }
}
