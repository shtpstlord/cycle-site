import fs from 'node:fs/promises'
import path from 'node:path'
import { Telegraf, Markup } from 'telegraf'
import { createProduct } from './products-store.js'
import { parseTelegramPost } from './post-parser.js'

const pendingCards = new Map()

function formatRub(price) {
  return `${new Intl.NumberFormat('ru-RU').format(Number(price) || 0)} ₽`
}

function shortId() {
  return Math.random().toString(36).slice(2, 10)
}

function parseAdminIds() {
  const raw = process.env.TG_ADMIN_IDS ?? ''
  const ids = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
  return new Set(ids)
}

function isAllowedUser(ctx, adminIds) {
  if (!adminIds.size) {
    return true
  }

  const userId = Number(ctx.from?.id)
  return adminIds.has(userId)
}

function withTrailingSlash(url) {
  if (!url) {
    return ''
  }
  return url.endsWith('/') ? url : `${url}/`
}

async function saveTelegramPhoto(ctx, photo, uploadsDir, publicBaseUrl) {
  if (!photo?.file_id) {
    return null
  }

  const fileLink = await ctx.telegram.getFileLink(photo.file_id)
  const response = await fetch(fileLink.toString())
  if (!response.ok) {
    throw new Error(`Photo download failed: ${response.status}`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  await fs.mkdir(uploadsDir, { recursive: true })

  const extension = '.jpg'
  const filename = `${Date.now()}-${photo.file_unique_id}${extension}`
  const absolutePath = path.resolve(uploadsDir, filename)
  await fs.writeFile(absolutePath, bytes)

  if (!publicBaseUrl) {
    return `/uploads/${filename}`
  }

  return `${withTrailingSlash(publicBaseUrl)}uploads/${filename}`
}

function buildMainKeyboard(webAppUrl) {
  if (!webAppUrl) {
    return undefined
  }

  return Markup.keyboard([[Markup.button.webApp('Открыть mini app', webAppUrl)]])
    .resize()
    .persistent()
}

function buildDecisionKeyboard(pendingId, webAppUrl) {
  const rows = [
    [
      Markup.button.callback('Залить на сайт', `publish:${pendingId}`),
      Markup.button.callback('Отменить', `cancel:${pendingId}`),
    ],
  ]

  if (webAppUrl) {
    rows.push([Markup.button.url('Открыть mini app', webAppUrl)])
  }

  return Markup.inlineKeyboard(rows)
}

function makePreviewText(parsed, imageCount) {
  const lines = [
    'Проверь карточку перед публикацией:',
    '',
    `Название: ${parsed.name || '—'}`,
    `Описание: ${parsed.subtitle || '—'}`,
    `Цитата: ${parsed.quote || '—'}`,
    `Размер: ${parsed.size || '—'}`,
    `Цена: ${parsed.price > 0 ? formatRub(parsed.price) : 'не распознана'}`,
    `Старая цена: ${parsed.oldPrice ? formatRub(parsed.oldPrice) : '—'}`,
    `Категория: ${parsed.category}`,
    `Фото: ${imageCount}`,
  ]

  if (parsed.warnings.length > 0) {
    lines.push('', `Внимание: ${parsed.warnings.join('; ')}`)
  }

  return lines.join('\n')
}

function getTextFromMessage(message) {
  const text = message?.caption || message?.text || ''
  return String(text).trim()
}

function isCommandMessage(message) {
  const text = String(message?.text || '').trim()
  return text.startsWith('/')
}

function isSupportedMessage(message) {
  return Boolean(message?.text || message?.caption || message?.photo || message?.document)
}

export async function startTelegramBot({ uploadsDir, publicBaseUrl, webAppUrl }) {
  const token = process.env.TG_BOT_TOKEN
  if (!token) {
    console.warn('[bot] TG_BOT_TOKEN not set. Bot is disabled.')
    return null
  }

  const adminIds = parseAdminIds()
  const appUrl = webAppUrl || process.env.WEB_APP_URL || publicBaseUrl || ''
  const bot = new Telegraf(token)

  bot.start(async (ctx) => {
    if (!isAllowedUser(ctx, adminIds)) {
      await ctx.reply('У тебя нет доступа к этому боту.')
      return
    }

    await ctx.reply(
      [
        'Пришли пересланный пост из канала или сообщение с фото/текстом.',
        'Я распознаю карточку, покажу превью и спрошу, заливать ли на сайт.',
      ].join('\n'),
      buildMainKeyboard(appUrl),
    )
  })

  bot.command('id', async (ctx) => {
    await ctx.reply(`Твой Telegram ID: ${ctx.from?.id ?? 'unknown'}`)
  })

  bot.on('message', async (ctx) => {
    const message = ctx.message
    if (!isSupportedMessage(message) || isCommandMessage(message)) {
      return
    }

    if (!isAllowedUser(ctx, adminIds)) {
      await ctx.reply('У тебя нет доступа к публикации.')
      return
    }

    const parsed = parseTelegramPost(getTextFromMessage(message))
    if (!parsed) {
      await ctx.reply('Не смог распознать пост. Перешли сообщение еще раз.')
      return
    }

    const imageUrls = []
    if (Array.isArray(message.photo) && message.photo.length > 0) {
      const bestPhoto = message.photo[message.photo.length - 1]
      try {
        const photoUrl = await saveTelegramPhoto(ctx, bestPhoto, uploadsDir, publicBaseUrl)
        if (photoUrl) {
          imageUrls.push(photoUrl)
        }
      } catch (error) {
        console.error('[bot] photo save error:', error)
      }
    }

    const pendingId = shortId()
    const draft = {
      ...parsed,
      images: imageUrls,
    }
    pendingCards.set(pendingId, draft)

    await ctx.reply(
      makePreviewText(draft, draft.images.length),
      buildDecisionKeyboard(pendingId, appUrl),
    )
  })

  bot.action(/^publish:(.+)$/i, async (ctx) => {
    const pendingId = ctx.match[1]
    const draft = pendingCards.get(pendingId)

    if (!draft) {
      await ctx.answerCbQuery('Черновик уже неактуален')
      return
    }

    if (!isAllowedUser(ctx, adminIds)) {
      await ctx.answerCbQuery('Нет доступа')
      return
    }

    try {
      const created = await createProduct(draft)
      pendingCards.delete(pendingId)

      await ctx.editMessageText(
        [
          `Карточка #${created.id} опубликована на сайте.`,
          `${created.name} • ${formatRub(created.price)} • ${created.size}`,
        ].join('\n'),
        appUrl ? Markup.inlineKeyboard([[Markup.button.url('Открыть mini app', appUrl)]]) : undefined,
      )
      await ctx.answerCbQuery('Залил')
    } catch (error) {
      console.error('[bot] publish error:', error)
      await ctx.answerCbQuery('Ошибка публикации')
      await ctx.reply('Не получилось залить карточку. Проверь формат цены и попробуй еще раз.')
    }
  })

  bot.action(/^cancel:(.+)$/i, async (ctx) => {
    const pendingId = ctx.match[1]
    pendingCards.delete(pendingId)
    await ctx.answerCbQuery('Отменено')
    await ctx.editMessageText('Публикацию отменили.')
  })

  try {
    await bot.launch()
    console.log('[bot] started')
  } catch (error) {
    console.error('[bot] failed to start:', error)
    throw error
  }

  if (appUrl) {
    try {
      await bot.telegram.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: 'Открыть mini app',
          web_app: { url: appUrl },
        },
      })
    } catch (error) {
      console.warn('[bot] setChatMenuButton failed:', error.message)
    }
  }

  const shutdown = () => bot.stop('shutdown')
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  return bot
}

