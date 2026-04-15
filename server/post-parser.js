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

export function inferCategory(source) {
  const text = String(source ?? '').toLowerCase()

  if (/кроссов|кед|ботин|сапог|туфл|sneaker|shoe/.test(text)) {
    return 'shoes'
  }

  if (/брюк|джинс|карго|чинос|штаны|pants|jeans/.test(text)) {
    return 'pants'
  }

  if (/куртк|пухов|парка|пальто|ветровк|бомбер|софтшелл|outerwear|coat/.test(text)) {
    return 'outerwear'
  }

  return 'tops'
}

function extractSize(lines) {
  for (const line of lines) {
    const match = line.match(/размер\s*[:-]\s*(.+)$/i)
    if (match?.[1]) {
      return cleanLine(match[1])
    }
  }

  return 'ONE SIZE'
}

function extractPrice(rawText, lines) {
  const joined = [rawText, ...lines].join('\n')

  const ranged = joined.match(/(\d[\d\s.,]*)\s*(?:->|=>|→|\/)\s*(\d[\d\s.,]*)/i)
  if (ranged) {
    const oldPrice = toRubNumber(ranged[1])
    const price = toRubNumber(ranged[2])
    return { price, oldPrice }
  }

  for (const line of lines) {
    if (!/цена/i.test(line)) {
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

  const fallback = joined.match(/(\d[\d\s.,]*)\s*(?:₽|руб|р\b)/i)
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

    if (/размер|цена|для заказа/i.test(line)) {
      return false
    }

    return line.length >= 24
  })

  if (!candidate) {
    return ''
  }

  return candidate.replace(/^[«"“]/, '').replace(/[»"”]$/, '').trim()
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

  const nonMetaLines = lines.filter((line) => !/^(?:-|•)?\s*(размер|цена)\s*[:-]/i.test(line))

  const name = nonMetaLines[0] || 'Без названия'
  let subtitle = nonMetaLines[1] || ''
  if (/для заказа|размер|цена/i.test(subtitle)) {
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
