const ORDER_MARKER_REGEX = /(для\s+заказа|@cycle_order|cycle[_\s-]?order|order\s*@)/iu
const STATUS_MARKER_REGEX = /(sold|sold\s*out|продан[аоы]?|бронь|reserved|reserve)/iu
const SIZE_LINE_REGEX = /^(?:[-*•]\s*)?(?:размер|size)\s*[:\-–—]?\s*(.+)$/iu
const PRICE_LINE_REGEX = /^(?:[-*•]\s*)?(?:цена|price)\s*[:\-–—]?\s*(.+)$/iu
const META_LINE_REGEX = /^(?:[-*•]\s*)?(?:размер|size|цена|price)\s*[:\-–—]/iu

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

  return STATUS_MARKER_REGEX.test(normalized) && /^(?:[-*•]|\()/u.test(normalized)
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

  if (/^(xxxl|xxl|xl|l|m|s|xs|one size|os)$/iu.test(compact)) {
    if (/^os$/iu.test(compact)) {
      return 'ONE SIZE'
    }
    return compact.toUpperCase()
  }

  return compact.replace(/\s*\/\s*/g, '/')
}

function looksLikeSize(value) {
  const normalized = normalizeSizeValue(value)
  if (!normalized) {
    return false
  }

  if (/^(?:ONE SIZE|XXXL|XXL|XL|L|M|S|XS)$/u.test(normalized)) {
    return true
  }

  if (/^\d{2,3}(?:[/-]\d{2,3})?$/u.test(normalized)) {
    return true
  }

  if (/^(?:W|L)\d{2}$/iu.test(normalized)) {
    return true
  }

  return /^(?:IT|EU|US)\s*\d{1,3}$/iu.test(normalized)
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

function extractSize(lines) {
  for (const line of lines) {
    const explicit = cleanLine(line).match(SIZE_LINE_REGEX)
    if (!explicit?.[1]) {
      continue
    }

    const candidate = normalizeSizeValue(explicit[1])
    if (looksLikeSize(candidate)) {
      return candidate
    }
  }

  for (const line of lines) {
    const loose = cleanLine(line).match(/\b(XXXL|XXL|XL|L|M|S|XS|ONE SIZE|OS|W\d{2}|L\d{2}|\d{2,3}\s*\/\s*\d{2,3})\b/iu)
    if (!loose?.[1]) {
      continue
    }

    const candidate = normalizeSizeValue(loose[1])
    if (looksLikeSize(candidate)) {
      return candidate
    }
  }

  return 'ONE SIZE'
}

function parsePriceFromLine(line) {
  const source = cleanLine(line)
  const values = source.match(/\d[\d\s.,]*/g) || []

  if (values.length >= 2) {
    return {
      oldPrice: toRubNumber(values[0]),
      price: toRubNumber(values[values.length - 1]),
    }
  }

  if (values.length === 1) {
    return {
      oldPrice: null,
      price: toRubNumber(values[0]),
    }
  }

  return {
    oldPrice: null,
    price: null,
  }
}

function extractPrice(rawText, lines) {
  for (const line of lines) {
    const normalized = cleanLine(line)
    if (!PRICE_LINE_REGEX.test(normalized)) {
      continue
    }

    const parsed = parsePriceFromLine(normalized)
    if (parsed.price) {
      return parsed
    }
  }

  const ranged = String(rawText ?? '').match(/(\d[\d\s.,]*)\s*(?:->|=>|→|-{1,2}>?)\s*(\d[\d\s.,]*)/iu)
  if (ranged) {
    return {
      oldPrice: toRubNumber(ranged[1]),
      price: toRubNumber(ranged[2]),
    }
  }

  const allWithCurrency = [...String(rawText ?? '').matchAll(/(\d[\d\s.,]*)\s*(?:₽|р\b|руб)/giu)]
    .map((match) => toRubNumber(match[1]))
    .filter((value) => Number.isFinite(value))

  if (allWithCurrency.length >= 2) {
    return {
      oldPrice: allWithCurrency[0],
      price: allWithCurrency[allWithCurrency.length - 1],
    }
  }

  if (allWithCurrency.length === 1) {
    return {
      oldPrice: null,
      price: allWithCurrency[0],
    }
  }

  const fallback = String(rawText ?? '').match(/(?:цена|price)[^\d]{0,16}(\d[\d\s.,]*)/iu)
  return {
    oldPrice: null,
    price: fallback ? toRubNumber(fallback[1]) : null,
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
  const nonMetaLines = sanitizedLines.filter((line) => !isMetaLine(line))

  const name = cleanLine(nonMetaLines[0] || 'Без названия')
  let subtitle = cleanLine(nonMetaLines[1] || '')

  if (isMetaLine(subtitle)) {
    subtitle = ''
  }

  const quote = extractQuote(nonMetaLines, subtitle)
  const size = extractSize(sanitizedLines)
  const sanitizedSourceText = sanitizedLines.join('\n')
  const { price, oldPrice } = extractPrice(sanitizedSourceText, sanitizedLines)
  const category = inferCategory([name, subtitle, quote].join(' '))

  const warnings = []
  if (!price || price <= 0) {
    warnings.push('Не удалось уверенно распознать цену')
  }

  return {
    name,
    subtitle,
    quote: cleanLine(quote),
    size: cleanLine(size) || 'ONE SIZE',
    price: price ?? 0,
    oldPrice: oldPrice ?? null,
    category,
    warnings,
    sourceText: sanitizedSourceText,
  }
}
