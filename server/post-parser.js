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

function hasKeyword(source, expression) {
  return expression.test(String(source ?? '').toLowerCase())
}

export function inferCategory(source) {
  const text = String(source ?? '').toLowerCase()

  if (hasKeyword(text, /(кроссов|кед|ботин|сапог|туфл|shoe|sneaker)/i)) {
    return 'shoes'
  }

  if (hasKeyword(text, /(брюк|джинс|карго|чинос|штаны|pants|jeans)/i)) {
    return 'pants'
  }

  if (hasKeyword(text, /(куртк|пухов|парка|пальт|ветровк|бомбер|софтшел|jacket|outerwear|coat)/i)) {
    return 'outerwear'
  }

  return 'tops'
}

function extractSize(lines) {
  const looksLikeSize = (value) => {
    const normalized = cleanLine(value).toUpperCase()
    if (!normalized) {
      return false
    }

    return /^(?:ONE SIZE|XXXL|XXL|XL|L|M|S|XS|W\d{2}|L\d{2}|\d{2,3}(?:\s*[-/]\s*\d{2,3})?|\d{2,3}\([A-Z]+\))$/i.test(
      normalized,
    )
  }

  for (const line of lines) {
    const normalized = cleanLine(line)
    const explicit = normalized.match(/\b(?:размер|size)\s*[:-–—]?\s*(.+)$/i)
    if (explicit?.[1]) {
      const value = cleanLine(explicit[1])
      if (looksLikeSize(value)) {
        return value
      }
    }

    const keyValue = normalized.match(/^[-•]?\s*[^:]{2,20}:\s*([A-Za-zА-Яа-я0-9()/ -]{1,16})$/u)
    if (keyValue?.[1] && looksLikeSize(keyValue[1])) {
      return cleanLine(keyValue[1])
    }
  }

  for (const line of lines) {
    const loose = line.match(/\b(XXXL|XXL|XL|L|M|S|XS|ONE SIZE|\d{2,3}(?:\s*[-/]\s*\d{2,3})?)\b/i)
    if (loose?.[1] && looksLikeSize(loose[1])) {
      return cleanLine(loose[1].toUpperCase())
    }
  }

  return 'ONE SIZE'
}

function extractPrice(rawText, lines) {
  for (const line of lines) {
    if (!/\b(?:цена|price)\b/i.test(line)) {
      continue
    }

    const values = line.match(/\d[\d\s.,]*/g) || []
    if (values.length >= 2) {
      return {
        oldPrice: toRubNumber(values[0]),
        price: toRubNumber(values[1]),
      }
    }
    if (values.length === 1) {
      return {
        oldPrice: null,
        price: toRubNumber(values[0]),
      }
    }
  }

  const ranged = rawText.match(/(\d[\d\s.,]*)\s*(?:->|=>|→)\s*(\d[\d\s.,]*)/i)
  if (ranged) {
    return {
      oldPrice: toRubNumber(ranged[1]),
      price: toRubNumber(ranged[2]),
    }
  }

  const allWithCurrency = [...rawText.matchAll(/(\d[\d\s.,]*)\s*(?:₽|р\b|руб)/gi)]
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

  const fallback = rawText.match(/(?:цена|price)[^\d]{0,16}(\d[\d\s.,]*)/i)
  return {
    oldPrice: null,
    price: fallback ? toRubNumber(fallback[1]) : null,
  }
}

function extractQuote(lines) {
  const candidate = lines.find((line) => {
    if (!line) {
      return false
    }

    if (/^(?:-|•)/.test(line)) {
      return false
    }

    if (/\b(?:размер|size|цена|price|для заказа|order|бронь|продано)\b/i.test(line)) {
      return false
    }

    return line.length >= 24
  })

  if (!candidate) {
    return ''
  }

  return candidate.replace(/^[«"“]/, '').replace(/[»"”]$/, '').trim()
}

function isMetaLine(line) {
  return /^(?:-|•)?\s*(?:размер|size|цена|price)\s*[:-]/i.test(line)
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

  const nonMetaLines = lines.filter((line) => !isMetaLine(line))

  const name = nonMetaLines[0] || 'Без названия'
  let subtitle = nonMetaLines[1] || ''
  if (/\b(?:для заказа|размер|size|цена|price|бронь|продано)\b/i.test(subtitle)) {
    subtitle = ''
  }

  const quote = extractQuote(lines.slice(2))
  const size = extractSize(lines)
  const { price, oldPrice } = extractPrice(source, lines)
  const category = inferCategory([name, subtitle, quote].join(' '))

  const warnings = []
  if (!price || price <= 0) {
    warnings.push('Не удалось уверенно распознать цену')
  }

  return {
    name: cleanLine(name),
    subtitle: cleanLine(subtitle),
    quote: cleanLine(quote),
    size: cleanLine(size) || 'ONE SIZE',
    price: price ?? 0,
    oldPrice: oldPrice ?? null,
    category,
    warnings,
  }
}
