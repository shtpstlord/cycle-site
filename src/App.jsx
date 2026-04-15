import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArrowDown,
  ChevronDown,
  Ghost,
  House,
  Info,
  Minus,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Ruler,
  Send,
  Shirt,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import admLogo from './assets/adm.jpg'
import cycleLogoOriginal from './assets/logo.jpg'

const STORIES = [
  {
    id: 'story-1',
    title: 'НАША ОДЕЖДА',
    image:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=300',
    promo: null,
    subtitle: 'СЕЛЕКТИВНЫЙ АРХИВ',
    text: 'Подборки брендовой одежды в одном экземпляре. Новые позиции выкладываем каждый день.',
  },
  {
    id: 'story-2',
    title: 'АТМОСФЕРА',
    image:
      'https://images.unsplash.com/photo-1555529733-0e67056058e1?auto=format&fit=crop&q=80&w=300',
    promo: null,
    subtitle: 'ВИНТАЖНЫЙ ШОУРУМ',
    text: 'Фирменный интерьер, спокойный свет и плотный ассортимент. Можно собрать образ прямо на месте.',
  },
  {
    id: 'story-3',
    title: 'АКЦИИ',
    image: null,
    promo: '-10%',
    subtitle: 'НЕДЕЛЯ СКИДОК',
    text: 'Уцененные позиции и специальные офферы на избранные категории. Успей забронировать.',
  },
]

const SORT_OPTIONS = [
  { id: 'new', label: 'СОРТ: ПО НОВИЗНЕ' },
  { id: 'price-asc', label: 'СОРТ: ЦЕНА ↑' },
  { id: 'price-desc', label: 'СОРТ: ЦЕНА ↓' },
  { id: 'discount', label: 'СОРТ: СО СКИДКОЙ' },
]
const CATEGORY_LABELS = {
  tops: 'ФУТБОЛКИ / ПОЛО',
  pants: 'ШТАНЫ / ДЖИНСЫ',
  outerwear: 'ВЕРХНЯЯ ОДЕЖДА',
  shoes: 'ОБУВЬ',
  accessories: 'АКСЕССУАРЫ',
  knitwear: 'ТРИКОТАЖ',
  denim: 'ДЕНИМ',
}
const SIZE_PRIORITY = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE SIZE']
const ORDER_LINE_REGEX = /для\s+заказа\s+к\s*@cycle_order/i

const SEED_PRODUCTS = [
  {
    id: 1,
    name: 'Софтшелл C.P. Company',
    category: 'outerwear',
    size: 'XL',
    price: 25900,
    oldPrice: null,
    images: [
      'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=400',
    ],
    subtitle: 'Легкий софтшелл, водоотталкивающая ткань',
    quote:
      'Софтшелл защищает от ветра и легкого дождя, при этом остается дышащим и удобным для города.',
    postViews: 417,
    postTime: '14:11',
  },
  {
    id: 2,
    name: 'Брюки-чинос винтаж',
    category: 'pants',
    size: '54(XL)',
    price: 2900,
    oldPrice: 3900,
    images: [
      'https://images.unsplash.com/photo-1542272454315-4c01d711efa4?auto=format&fit=crop&q=80&w=400',
    ],
    subtitle: 'Плотный хлопок, мягкая посадка',
    quote:
      'Чиносы держат форму и легко собираются в повседневный образ под кеды, ботинки и рубашку.',
    postViews: 509,
    postTime: '13:58',
  },
  {
    id: 3,
    name: 'Свитер Ralph Lauren',
    category: 'tops',
    size: 'M',
    price: 5500,
    oldPrice: null,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=400',
    ],
    subtitle: 'Теплая вязка, приятная фактура',
    quote:
      'Классический свитер Ralph Lauren: аккуратный силуэт, универсальный цвет и комфорт на каждый день.',
    postViews: 362,
    postTime: '12:40',
  },
  {
    id: 4,
    name: 'Футболка Stussy',
    category: 'tops',
    size: 'L',
    price: 3200,
    oldPrice: null,
    images: [
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=400',
    ],
    subtitle: 'Мягкий хлопок, классический стрит-фит',
    quote:
      'Stussy из категории базовых вещей, которые легко комбинировать в многослойные комплекты.',
    postViews: 444,
    postTime: '13:22',
  },
]

const SCREEN_ORDER = ['home', 'cart', 'about']
const YANDEX_ORG_ID = '62631138735'
const YANDEX_ORG_URL = `https://yandex.ru/maps/org/tsikl/${YANDEX_ORG_ID}/`
const YANDEX_MAP_WIDGET_URL =
  'https://yandex.ru/map-widget/v1/?ll=39.199928%2C51.660396&mode=search&oid=62631138735&ol=biz&z=17.17'
const YANDEX_ORG_REVIEWS_URL = `https://yandex.ru/maps/org/tsikl/${YANDEX_ORG_ID}/reviews/`
const YANDEX_ORG_GALLERY_URL = `${YANDEX_ORG_URL}gallery/`
const YANDEX_ADD_REVIEW_URL = `${YANDEX_ORG_REVIEWS_URL}?add-review`
const YANDEX_INTERIOR_PHOTOS = [
  'https://avatars.mds.yandex.net/get-altay/14707892/2a00000194e561d642ed1f9f9ed33eff8f80/orig',
  'https://avatars.mds.yandex.net/get-altay/13668123/2a00000195d818a05f31788d9c79ea742d54/orig',
  'https://avatars.mds.yandex.net/get-altay/13286098/2a0000018fbfa97c142e9d1a4127a6285add/orig',
  'https://avatars.mds.yandex.net/get-altay/13477341/2a0000018fbfa97b33acb4a7a0ad95d59b4f/orig',
  'https://avatars.mds.yandex.net/get-altay/7730113/2a0000018fbfa96a74989e100d0ec2c13823/orig',
  'https://avatars.mds.yandex.net/get-altay/961502/2a0000018fbfa985590ccf811ce781885491/orig',
]
const FEATURED_REVIEWS = [
  {
    id: 'review-1',
    name: 'Лилия Масловиева',
    date: '13 февраля',
    rating: 5,
    text: 'Нравится ваш магазин: много интересных и качественных вещей. Всегда вежливо, подскажут и порекомендуют.',
  },
  {
    id: 'review-2',
    name: 'Максим Литвинов',
    date: '19 марта 2025',
    rating: 5,
    text: 'Отличный магазин. Хожу давно, доволен ассортиментом и ценами. Крутая атмосфера и приятный персонал.',
  },
  {
    id: 'review-3',
    name: 'Дмитрий Тарарыков',
    date: '27 марта 2025',
    rating: 5,
    text: 'Большой выбор, редкие позиции и аккуратная выкладка. Удобно, что можно быстро собрать готовый образ.',
  },
  {
    id: 'review-4',
    name: 'Екатерина Ж.',
    date: '5 апреля 2025',
    rating: 5,
    text: 'Точно попали в атмосферу винтажного шоурума: музыка, свет и подбор вещей очень в тему.',
  },
  {
    id: 'review-5',
    name: 'Игорь Н.',
    date: '11 апреля 2025',
    rating: 5,
    text: 'Удобно, что сразу видно размеры и актуальные цены. Ребята на месте помогают быстро найти нужное.',
  },
]
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const PRODUCT_STATUS_META = {
  available: {
    badge: 'В НАЛИЧИИ',
    cta: 'ЗАБРАТЬ',
    detail: 'ДОСТУПЕН',
  },
  reserved: {
    badge: 'БРОНЬ',
    cta: 'НА БРОНИ',
    detail: 'ЗАБРОНИРОВАН',
  },
  sold: {
    badge: 'ПРОДАНО',
    cta: 'ПРОДАНО',
    detail: 'ПРОДАН',
  },
}

function buildApiUrl(path) {
  if (!API_BASE_URL) {
    return path
  }
  return `${API_BASE_URL}${path}`
}

function formatRub(price) {
  return `${new Intl.NumberFormat('ru-RU').format(price)} ₽`
}

function normalizeProductStatus(status) {
  const value = String(status ?? '')
    .trim()
    .toLowerCase()

  if (value === 'reserved' || value === 'sold') {
    return value
  }

  return 'available'
}

function normalizeCategoryId(category) {
  return String(category ?? '')
    .trim()
    .toLowerCase()
}

function formatCategoryLabel(categoryId) {
  if (!categoryId) {
    return 'БЕЗ КАТЕГОРИИ'
  }
  return (
    CATEGORY_LABELS[categoryId] ??
    categoryId
      .replace(/[_-]+/g, ' ')
      .trim()
      .toUpperCase()
  )
}

function getCategoryIcon(categoryId) {
  const normalized = normalizeCategoryId(categoryId)

  if (normalized === 'pants' || normalized === 'denim') {
    return Ruler
  }

  if (normalized === 'shoes' || normalized === 'accessories') {
    return ShoppingBag
  }

  if (normalized === 'outerwear') {
    return Archive
  }

  return Shirt
}

function sanitizeProductText(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !ORDER_LINE_REGEX.test(line))
    .join('\n')
    .trim()
}

function splitProductSizes(sizeValue) {
  const normalized = String(sizeValue ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')

  if (!normalized) {
    return []
  }

  const sizeParts = normalized
    .split(/\s*,\s*|\s*\|\s*/)
    .map((part) => part.trim())
    .filter(Boolean)

  const expanded = new Set(sizeParts.length > 0 ? sizeParts : [normalized])
  ;[...expanded].forEach((token) => {
    const parenthesisMatches = token.match(/\(([^)]+)\)/g) ?? []
    parenthesisMatches.forEach((group) => {
      const inside = group.slice(1, -1).trim()
      if (inside) {
        expanded.add(inside)
      }
    })
  })

  return [...expanded]
}

function compareSizeTokens(leftValue, rightValue) {
  const left = String(leftValue).trim().toUpperCase()
  const right = String(rightValue).trim().toUpperCase()

  const leftPriority = SIZE_PRIORITY.indexOf(left)
  const rightPriority = SIZE_PRIORITY.indexOf(right)

  if (leftPriority !== -1 || rightPriority !== -1) {
    if (leftPriority === -1) {
      return 1
    }
    if (rightPriority === -1) {
      return -1
    }
    return leftPriority - rightPriority
  }

  return left.localeCompare(right, 'ru-RU', { numeric: true })
}

function normalizeProduct(rawProduct) {
  const normalizedSize = String(rawProduct?.size ?? '')
    .trim()
    .toUpperCase()

  const normalizedImages = Array.isArray(rawProduct?.images)
    ? rawProduct.images.filter((image) => typeof image === 'string' && image.trim())
    : []

  return {
    ...rawProduct,
    category: normalizeCategoryId(rawProduct?.category),
    size: normalizedSize || 'ONE SIZE',
    subtitle: sanitizeProductText(rawProduct?.subtitle),
    quote: sanitizeProductText(rawProduct?.quote),
    sourceText: sanitizeProductText(rawProduct?.sourceText),
    images: normalizedImages.length > 0 ? normalizedImages : [cycleLogoOriginal],
    status: normalizeProductStatus(rawProduct?.status),
  }
}

function getStatusMeta(status) {
  return PRODUCT_STATUS_META[normalizeProductStatus(status)]
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [splashClosing, setSplashClosing] = useState(false)
  const [showSplashArrow, setShowSplashArrow] = useState(false)

  const [currentScreen, setCurrentScreen] = useState('home')
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true)
  const [activeSheet, setActiveSheet] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [sortOrder, setSortOrder] = useState('new')
  const [catalogMode, setCatalogMode] = useState('catalog')
  const [activeProduct, setActiveProduct] = useState(null)
  const [activeStory, setActiveStory] = useState(null)
  const [storyOpeningGlitch, setStoryOpeningGlitch] = useState(false)
  const [isMapUnlocked, setIsMapUnlocked] = useState(false)
  const [isMapUnlocking, setIsMapUnlocking] = useState(false)
  const [isMapRelocking, setIsMapRelocking] = useState(false)
  const [zoomViewer, setZoomViewer] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 })
  const [products, setProducts] = useState(() => SEED_PRODUCTS.map((product) => normalizeProduct(product)))

  const [cartItems, setCartItems] = useState([])
  const [flashCartNav, setFlashCartNav] = useState(false)

  const [glitchStoryId, setGlitchStoryId] = useState(null)

  const splashStartYRef = useRef(0)
  const touchStartXRef = useRef(null)
  const lastScreenScrollRef = useRef({ home: 0, cart: 0, about: 0 })

  const splashIntroTimerRef = useRef(null)
  const splashRemoveTimerRef = useRef(null)
  const storyTimerRef = useRef(null)
  const storyAutoCloseTimerRef = useRef(null)
  const storyGlitchTimerRef = useRef(null)
  const cartFlashTimerRef = useRef(null)
  const mapTransitionTimerRef = useRef(null)
  const zoomPointersRef = useRef(new Map())
  const zoomDragRef = useRef({ active: false, lastX: 0, lastY: 0 })
  const zoomPinchRef = useRef({ startDistance: 0, startScale: 1 })
  const galleryGestureRef = useRef({
    productId: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
  })
  const suppressProductOpenRef = useRef(new Set())

  const homeScreenRef = useRef(null)
  const cartScreenRef = useRef(null)
  const aboutScreenRef = useRef(null)

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price, 0),
    [cartItems],
  )
  const cartProductIds = useMemo(() => new Set(cartItems.map((item) => item.id)), [cartItems])
  const scopedProducts = useMemo(() => {
    if (catalogMode === 'archive') {
      return products.filter((product) => normalizeProductStatus(product.status) === 'sold')
    }
    return products.filter((product) => normalizeProductStatus(product.status) !== 'sold')
  }, [products, catalogMode])

  const categoryOptions = useMemo(() => {
    const seen = new Set()
    scopedProducts.forEach((product) => {
      const categoryId = normalizeCategoryId(product.category)
      if (categoryId) {
        seen.add(categoryId)
      }
    })

    return [
      { id: 'all', label: 'ВСЕ КАТЕГОРИИ', Icon: Shirt },
      ...[...seen].sort((left, right) => left.localeCompare(right, 'ru-RU')).map((categoryId) => ({
        id: categoryId,
        label: formatCategoryLabel(categoryId),
        Icon: getCategoryIcon(categoryId),
      })),
    ]
  }, [scopedProducts])

  const normalizedSelectedCategory =
    selectedCategory === 'all' || categoryOptions.some((category) => category.id === selectedCategory)
      ? selectedCategory
      : 'all'

  const sizeOptions = useMemo(() => {
    const seen = new Set()
    scopedProducts.forEach((product) => {
      if (normalizedSelectedCategory !== 'all' && product.category !== normalizedSelectedCategory) {
        return
      }
      splitProductSizes(product.size).forEach((sizeToken) => {
        if (sizeToken) {
          seen.add(sizeToken)
        }
      })
    })

    return [...seen].sort(compareSizeTokens)
  }, [scopedProducts, normalizedSelectedCategory])

  const normalizedSelectedSize =
    selectedSize === 'all' || sizeOptions.includes(selectedSize) ? selectedSize : 'all'
  const selectedCategoryOption =
    categoryOptions.find((category) => category.id === normalizedSelectedCategory) ?? categoryOptions[0]
  const SelectedCategoryIcon = selectedCategoryOption?.Icon ?? Shirt

  const filteredProducts = useMemo(() => {
    const next = scopedProducts.filter((product) => {
      const categoryMatch =
        normalizedSelectedCategory === 'all' || product.category === normalizedSelectedCategory
      const sizeMatch =
        normalizedSelectedSize === 'all' ||
        splitProductSizes(product.size).some((sizeToken) => sizeToken === normalizedSelectedSize)
      return categoryMatch && sizeMatch
    })

    if (sortOrder === 'price-asc') {
      next.sort((a, b) => a.price - b.price)
    } else if (sortOrder === 'price-desc') {
      next.sort((a, b) => b.price - a.price)
    } else if (sortOrder === 'discount') {
      next.sort((a, b) => Number(Boolean(b.oldPrice)) - Number(Boolean(a.oldPrice)))
    } else {
      next.sort((a, b) => {
        const left = Number(a.id) || Date.parse(a.createdAt ?? '') || 0
        const right = Number(b.id) || Date.parse(b.createdAt ?? '') || 0
        return right - left
      })
    }

    return next
  }, [scopedProducts, normalizedSelectedCategory, normalizedSelectedSize, sortOrder])

  const currentSort =
    SORT_OPTIONS.find((option) => option.id === sortOrder) ?? SORT_OPTIONS[0]
  const catalogModeLabel = catalogMode === 'archive' ? 'АРХИВ' : 'КАТАЛОГ'

  useEffect(() => {
    const abortController = new AbortController()

    const loadProducts = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/products'), {
          signal: abortController.signal,
        })
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        if (!Array.isArray(payload?.products)) {
          return
        }

        setProducts(payload.products.map((product) => normalizeProduct(product)))
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Failed to load products from API:', error)
        }
      }
    }

    loadProducts()

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    splashIntroTimerRef.current = setTimeout(() => {
      setShowSplashArrow(true)
    }, 1500)

    return () => {
      if (splashIntroTimerRef.current) {
        clearTimeout(splashIntroTimerRef.current)
      }
      if (splashRemoveTimerRef.current) {
        clearTimeout(splashRemoveTimerRef.current)
      }
      if (storyTimerRef.current) {
        clearTimeout(storyTimerRef.current)
      }
      if (storyAutoCloseTimerRef.current) {
        clearTimeout(storyAutoCloseTimerRef.current)
      }
      if (storyGlitchTimerRef.current) {
        clearTimeout(storyGlitchTimerRef.current)
      }
      if (cartFlashTimerRef.current) {
        clearTimeout(cartFlashTimerRef.current)
      }
      if (mapTransitionTimerRef.current) {
        clearTimeout(mapTransitionTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!activeProduct) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setActiveProduct(null)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [activeProduct])

  useEffect(() => {
    if (!activeStory) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setActiveStory(null)
        setStoryOpeningGlitch(false)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [activeStory])

  useEffect(() => {
    if (!zoomViewer) {
      return undefined
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setZoomViewer(null)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [zoomViewer])

  const hideSplash = () => {
    if (!showSplash || splashClosing) {
      return
    }

    setSplashClosing(true)
    if (splashRemoveTimerRef.current) {
      clearTimeout(splashRemoveTimerRef.current)
    }

    splashRemoveTimerRef.current = setTimeout(() => {
      setShowSplash(false)
    }, 500)
  }

  const handleSplashTouchStart = (event) => {
    splashStartYRef.current = event.changedTouches[0].screenY
  }

  const handleSplashTouchEnd = (event) => {
    const distance = splashStartYRef.current - event.changedTouches[0].screenY
    if (distance > 40) {
      hideSplash()
    }
  }

  const closeAllSheets = () => {
    setActiveSheet(null)
  }

  const toggleSheet = (sheetId) => {
    setActiveSheet((prev) => (prev === sheetId ? null : sheetId))
  }

  const navigate = (target) => {
    if (currentScreen === target) {
      return
    }

    closeAllSheets()
    setIsBottomNavVisible(true)
    setCurrentScreen(target)

    requestAnimationFrame(() => {
      if (target === 'home') {
        homeScreenRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (target === 'cart') {
        cartScreenRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (target === 'about') {
        aboutScreenRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  const isTouchFromScrollableZone = (target) =>
    Boolean(
      target.closest('.product-gallery') ||
        target.closest('[data-stories-track]') ||
        target.closest('[data-map-zone]'),
    )

  const handleMainTouchStart = (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      touchStartXRef.current = null
      return
    }

    if (isTouchFromScrollableZone(target)) {
      touchStartXRef.current = null
      return
    }

    touchStartXRef.current = event.changedTouches[0].screenX
  }

  const handleMainTouchEnd = (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      touchStartXRef.current = null
      return
    }

    if (isTouchFromScrollableZone(target) || touchStartXRef.current === null) {
      touchStartXRef.current = null
      return
    }

    const endX = event.changedTouches[0].screenX
    const distance = endX - touchStartXRef.current
    touchStartXRef.current = null

    if (distance < -60) {
      const nextIndex = Math.min(SCREEN_ORDER.indexOf(currentScreen) + 1, SCREEN_ORDER.length - 1)
      navigate(SCREEN_ORDER[nextIndex])
    }

    if (distance > 60) {
      const nextIndex = Math.max(SCREEN_ORDER.indexOf(currentScreen) - 1, 0)
      navigate(SCREEN_ORDER[nextIndex])
    }
  }

  const handleScreenScroll = (screen) => (event) => {
    const currentTop = event.currentTarget.scrollTop
    const prevTop = lastScreenScrollRef.current[screen] ?? 0
    const delta = currentTop - prevTop

    if (currentTop < 20) {
      setIsBottomNavVisible(true)
    } else if (delta > 12 && currentTop > 80) {
      setIsBottomNavVisible(false)
    } else if (delta < -12) {
      setIsBottomNavVisible(true)
    }

    lastScreenScrollRef.current[screen] = currentTop
  }

  const isProductInCart = (productId) => cartProductIds.has(productId)

  const toggleCartItem = (product) => {
    if (normalizeProductStatus(product?.status) !== 'available') {
      return
    }

    const exists = isProductInCart(product.id)
    setCartItems((prev) =>
      exists ? prev.filter((item) => item.id !== product.id) : [...prev, product],
    )

    if (!exists && currentScreen !== 'cart') {
      setFlashCartNav(true)
      if (cartFlashTimerRef.current) {
        clearTimeout(cartFlashTimerRef.current)
      }
      cartFlashTimerRef.current = setTimeout(() => {
        setFlashCartNav(false)
      }, 220)
    }
  }

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const closeStory = () => {
    setActiveStory(null)
    setStoryOpeningGlitch(false)
    setGlitchStoryId(null)
    if (storyAutoCloseTimerRef.current) {
      clearTimeout(storyAutoCloseTimerRef.current)
      storyAutoCloseTimerRef.current = null
    }
    if (storyGlitchTimerRef.current) {
      clearTimeout(storyGlitchTimerRef.current)
      storyGlitchTimerRef.current = null
    }
  }

  const playStory = (storyId) => {
    const story = STORIES.find((item) => item.id === storyId)
    if (!story) {
      return
    }

    setGlitchStoryId(storyId)
    setActiveStory(story)
    setStoryOpeningGlitch(true)

    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current)
    }
    storyTimerRef.current = setTimeout(() => {
      setGlitchStoryId(null)
    }, 300)

    if (storyGlitchTimerRef.current) {
      clearTimeout(storyGlitchTimerRef.current)
    }
    storyGlitchTimerRef.current = setTimeout(() => {
      setStoryOpeningGlitch(false)
    }, 320)

    if (storyAutoCloseTimerRef.current) {
      clearTimeout(storyAutoCloseTimerRef.current)
    }
    storyAutoCloseTimerRef.current = setTimeout(() => {
      closeStory()
    }, 5800)
  }

  const setSuppressProductOpen = (productId) => {
    suppressProductOpenRef.current.add(productId)
  }

  const consumeSuppressProductOpen = (productId) => {
    if (!suppressProductOpenRef.current.has(productId)) {
      return false
    }
    suppressProductOpenRef.current.delete(productId)
    return true
  }

  const handleGalleryPointerDown = (event, productId) => {
    galleryGestureRef.current = {
      productId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }
  }

  const handleGalleryPointerMove = (event, productId) => {
    const gesture = galleryGestureRef.current
    if (gesture.productId !== productId || gesture.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY
    if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
      gesture.moved = true
    }
  }

  const handleGalleryPointerEnd = (event, productId) => {
    const gesture = galleryGestureRef.current
    if (gesture.productId !== productId || gesture.pointerId !== event.pointerId) {
      return
    }

    if (gesture.moved) {
      setSuppressProductOpen(productId)
    }

    galleryGestureRef.current = {
      productId: null,
      pointerId: null,
      startX: 0,
      startY: 0,
      moved: false,
    }
  }

  const handleGalleryClick = (event, productId) => {
    if (!consumeSuppressProductOpen(productId)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
  }

  const openProductPost = (product) => {
    if (consumeSuppressProductOpen(product.id)) {
      return
    }
    setActiveProduct(product)
  }

  const clampZoomScale = (value) => Math.min(4, Math.max(1, value))

  const clampZoomOffset = (x, y, scale) => {
    if (typeof window === 'undefined') {
      return { x, y }
    }

    const maxX = ((scale - 1) * window.innerWidth) / 2
    const maxY = ((scale - 1) * window.innerHeight) / 2
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }

  const normalizeZoomAfterScale = (nextScale) => {
    if (nextScale === 1) {
      setZoomOffset({ x: 0, y: 0 })
      return
    }

    setZoomOffset((prev) => clampZoomOffset(prev.x, prev.y, nextScale))
  }

  const applyZoomScale = (nextScale) => {
    const clamped = clampZoomScale(nextScale)
    setZoomScale(clamped)
    normalizeZoomAfterScale(clamped)
  }

  const resetZoomRefs = () => {
    zoomPointersRef.current.clear()
    zoomDragRef.current = { active: false, lastX: 0, lastY: 0 }
    zoomPinchRef.current = { startDistance: 0, startScale: 1 }
  }

  const openImageZoom = (src, alt) => {
    setZoomViewer({ src, alt })
    setZoomScale(1)
    setZoomOffset({ x: 0, y: 0 })
    resetZoomRefs()
  }

  const closeImageZoom = () => {
    setZoomViewer(null)
    setZoomScale(1)
    setZoomOffset({ x: 0, y: 0 })
    resetZoomRefs()
  }

  const getCurrentPinchDistance = () => {
    const pointers = [...zoomPointersRef.current.values()]
    if (pointers.length < 2) {
      return 0
    }

    const [left, right] = pointers
    return Math.hypot(left.x - right.x, left.y - right.y)
  }

  const handleZoomWheel = (event) => {
    event.preventDefault()
    const delta = event.deltaY < 0 ? 0.2 : -0.2
    setZoomScale((prevScale) => {
      const nextScale = clampZoomScale(prevScale + delta)
      normalizeZoomAfterScale(nextScale)
      return nextScale
    })
  }

  const handleZoomPointerDown = (event) => {
    event.preventDefault()
    zoomPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)

    if (zoomPointersRef.current.size === 1 && zoomScale > 1) {
      zoomDragRef.current = { active: true, lastX: event.clientX, lastY: event.clientY }
      return
    }

    if (zoomPointersRef.current.size === 2) {
      zoomDragRef.current = { active: false, lastX: 0, lastY: 0 }
      zoomPinchRef.current = {
        startDistance: getCurrentPinchDistance(),
        startScale: zoomScale,
      }
    }
  }

  const handleZoomPointerMove = (event) => {
    if (!zoomPointersRef.current.has(event.pointerId)) {
      return
    }

    zoomPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (zoomPointersRef.current.size >= 2) {
      const distance = getCurrentPinchDistance()
      const { startDistance, startScale } = zoomPinchRef.current
      if (startDistance > 0) {
        const nextScale = clampZoomScale(startScale * (distance / startDistance))
        setZoomScale(nextScale)
        normalizeZoomAfterScale(nextScale)
      }
      return
    }

    if (!zoomDragRef.current.active || zoomScale <= 1) {
      return
    }

    const dx = event.clientX - zoomDragRef.current.lastX
    const dy = event.clientY - zoomDragRef.current.lastY
    zoomDragRef.current = { active: true, lastX: event.clientX, lastY: event.clientY }

    setZoomOffset((prev) => clampZoomOffset(prev.x + dx, prev.y + dy, zoomScale))
  }

  const handleZoomPointerUp = (event) => {
    if (!zoomPointersRef.current.has(event.pointerId)) {
      return
    }

    zoomPointersRef.current.delete(event.pointerId)

    if (zoomPointersRef.current.size < 2) {
      zoomPinchRef.current = { startDistance: 0, startScale: zoomScale }
    }

    if (zoomPointersRef.current.size === 0) {
      zoomDragRef.current = { active: false, lastX: 0, lastY: 0 }
      return
    }

    const [pointer] = zoomPointersRef.current.values()
    zoomDragRef.current = {
      active: zoomScale > 1,
      lastX: pointer.x,
      lastY: pointer.y,
    }
  }

  const unlockMap = () => {
    if (isMapUnlocked || isMapUnlocking || isMapRelocking) {
      return
    }

    setIsMapUnlocking(true)
    if (mapTransitionTimerRef.current) {
      clearTimeout(mapTransitionTimerRef.current)
    }
    mapTransitionTimerRef.current = setTimeout(() => {
      setIsMapUnlocked(true)
      setIsMapUnlocking(false)
      mapTransitionTimerRef.current = null
    }, 220)
  }

  const lockMap = () => {
    if (!isMapUnlocked || isMapUnlocking || isMapRelocking) {
      return
    }

    setIsMapUnlocked(false)
    setIsMapRelocking(true)
    if (mapTransitionTimerRef.current) {
      clearTimeout(mapTransitionTimerRef.current)
    }
    mapTransitionTimerRef.current = setTimeout(() => {
      setIsMapRelocking(false)
      mapTransitionTimerRef.current = null
    }, 220)
  }

  const handleAboutPointerDown = (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }
    if (target.closest('[data-map-zone]')) {
      return
    }
    lockMap()
  }

  const activeProductStatus = normalizeProductStatus(activeProduct?.status)
  const activeProductStatusMeta = getStatusMeta(activeProduct?.status)
  const canPurchaseActiveProduct = activeProductStatus === 'available'
  const activeProductSubtitle = activeProduct?.subtitle || activeProduct?.sourceText || ''
  const activeProductQuote = activeProduct?.quote || ''

  const renderHeader = () => (
    <header className="pointer-events-none flex items-stretch justify-between gap-2">
      <button
        type="button"
        className="brutal-box brutal-input pointer-events-auto flex h-24 flex-1 cursor-pointer items-center gap-3 p-3 text-left"
        onClick={() => navigate('home')}
      >
        <img
          src={cycleLogoOriginal}
          alt="Логотип ЦИКЛ"
          className="h-[66px] w-[66px] shrink-0 rounded-sm border-2 border-black object-cover"
        />
        <div className="flex min-w-0 flex-col justify-center">
          <span className="heading-font text-5xl leading-[0.82] tracking-[0.03em]">ЦИКЛ</span>
          <span className="mt-1 inline-flex w-max max-w-full items-center bg-black px-1 text-[12px] font-bold leading-tight text-white">
            <MapPin className="mr-1 h-3 w-3" /> ВОРОНЕЖ, Ф.ЭНГЕЛЬСА, 35
          </span>
        </div>
      </button>

      <div className="brutal-box pointer-events-auto grid h-24 w-24 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden bg-[#E0E0E0]">
        <a
          href="tel:+79081332760"
          className="flex items-center justify-center border-b-[3px] border-r-[3px] border-black active:bg-black active:text-white"
          aria-label="Phone"
        >
          <Phone className="h-5 w-5" />
        </a>
        <a
          href="https://t.me/cycle_showroom"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center border-b-[3px] border-black active:bg-black active:text-white"
          aria-label="Telegram"
        >
          <Send className="h-5 w-5" />
        </a>
        <a
          href="https://vk.com/cycle_showroom"
          target="_blank"
          rel="noreferrer"
          className="heading-font flex items-center justify-center border-r-[3px] border-black text-[18px] active:bg-black active:text-white"
          aria-label="VK"
        >
          vk
        </a>
        <a
          href="https://wa.me/+79081332760"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center active:bg-black active:text-white"
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </header>
  )

  return (
    <div className="bg-carpet relative h-full w-full overflow-hidden text-black">
      <div className="carpet-overlay" />

      {showSplash && (
        <div
          id="splash"
          className={`fixed inset-0 z-[10000] overflow-hidden bg-black transition-all duration-500 ${
            splashClosing ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}
          onClick={hideSplash}
          onTouchStart={handleSplashTouchStart}
          onTouchEnd={handleSplashTouchEnd}
        >
          <video
            src="/splash-intro.mp4"
            className="splash-video-fullscreen absolute inset-0"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="splash-gradient-bottom absolute inset-0 flex flex-col items-center justify-end pb-10">
            <div
              className={`flex flex-col items-center transition-opacity duration-500 ${
                showSplashArrow ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="mb-2 border border-white bg-black px-2 text-sm font-bold tracking-widest text-white">
                В МАГАЗИН
              </span>
              <ArrowDown className="animate-bounce-arrow h-12 w-12 text-white drop-shadow-[2px_2px_0px_#000]" />
            </div>
          </div>
        </div>
      )}

      <div
        id="main-wrapper"
        className="relative h-full w-full"
        onTouchStart={handleMainTouchStart}
        onTouchEnd={handleMainTouchEnd}
      >
        <div
          id="screen-home"
          ref={homeScreenRef}
          className="screen-container px-3"
          onScroll={handleScreenScroll('home')}
        >
          <div className="mb-4 space-y-3">
            {renderHeader()}

            <div className="brutal-box bg-[var(--bg-paper)] p-2">
              <div className="mb-2 flex gap-2">
                <button
                  className="brutal-box brutal-input flex flex-1 items-center justify-center py-2 text-[11px] font-bold"
                  onClick={() => toggleSheet('category')}
                >
                  <SelectedCategoryIcon className="mr-2 h-4 w-4" /> КАТЕГОРИИ
                </button>
                <button
                  className="brutal-box brutal-input flex flex-1 items-center justify-center py-2 text-[11px] font-bold"
                  onClick={() => toggleSheet('sizes')}
                >
                  <Ruler className="mr-2 h-4 w-4" /> РАЗМЕРЫ
                </button>
              </div>
              <button
                className="brutal-box brutal-input flex w-full items-center justify-between bg-[#E0E0E0] px-3 py-2 text-[11px] font-bold"
                onClick={() => toggleSheet('sort')}
              >
                <span>{`${catalogModeLabel} • ${currentSort.label}`}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mb-5 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory" data-stories-track>
            <div className="flex w-max gap-4 px-1">
              {STORIES.map((story) => (
                <div
                  key={story.id}
                  className={`story-card brutal-box brutal-input relative flex h-[180px] w-[130px] cursor-pointer snap-start flex-col ${
                    glitchStoryId === story.id ? 'glitch-active' : ''
                  }`}
                  onClick={() => playStory(story.id)}
                >
                  {story.image ? (
                    <img
                      src={story.image}
                      className="w-full flex-1 border-b-4 border-black object-cover grayscale"
                      alt={story.title}
                    />
                  ) : (
                    <div className="flex w-full flex-1 items-center justify-center border-b-4 border-black bg-[var(--soviet-red)]">
                      <span className="heading-font text-5xl text-white">{story.promo}</span>
                    </div>
                  )}
                  <div className="heading-font flex h-8 items-center justify-center bg-[#F4F0EB] text-sm">
                    {story.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-6">
            {filteredProducts.length === 0 && (
              <div className="brutal-box col-span-2 border-dashed bg-white p-5 text-center text-sm font-bold uppercase">
                {catalogMode === 'archive'
                  ? 'В архиве пока нет проданных вещей'
                  : 'По выбранным фильтрам ничего не найдено'}
              </div>
            )}

            {filteredProducts.map((product) => {
              const productStatus = normalizeProductStatus(product.status)
              const productStatusMeta = getStatusMeta(product.status)
              const canPurchaseProduct = productStatus === 'available'
              const inCart = isProductInCart(product.id)
              const productImages = product.images.length > 0 ? product.images : [cycleLogoOriginal]

              return (
                <div
                  key={product.id}
                  className="brutal-box group relative flex cursor-pointer flex-col bg-white"
                  onClick={() => openProductPost(product)}
                >
                  <div
                    className="product-gallery"
                    onPointerDown={(event) => handleGalleryPointerDown(event, product.id)}
                    onPointerMove={(event) => handleGalleryPointerMove(event, product.id)}
                    onPointerUp={(event) => handleGalleryPointerEnd(event, product.id)}
                    onPointerCancel={(event) => handleGalleryPointerEnd(event, product.id)}
                    onPointerLeave={(event) => handleGalleryPointerEnd(event, product.id)}
                    onClick={(event) => handleGalleryClick(event, product.id)}
                  >
                    {productImages.map((image, index) => (
                      <div key={`${product.id}-${index}-${image}`} className="product-gallery-item">
                        <img src={image} alt={`${product.name} • фото ${index + 1}`} loading="lazy" />
                        {productImages.length > 1 && (
                          <span className="product-gallery-counter">
                            {index + 1}/{productImages.length}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col p-2">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="heading-font min-w-0 flex-1 text-[16px] leading-none uppercase">
                        {product.name}
                      </h3>
                      <span className={`product-status-badge is-${productStatus}`}>
                        {productStatusMeta.badge}
                      </span>
                    </div>
                    <div className="mt-auto">
                      <div className="mb-1 inline-block border-[2px] border-black px-1 text-[10px] font-bold">
                        РАЗМЕР: {product.size}
                      </div>
                      {product.oldPrice ? (
                        <>
                          <div className="price-crossed text-[10px] font-bold">{formatRub(product.oldPrice)}</div>
                          <div className="mb-2 text-sm font-bold text-[var(--soviet-red)]">
                            {formatRub(product.price)}
                          </div>
                        </>
                      ) : (
                        <div className="mb-2 text-sm font-bold">{formatRub(product.price)}</div>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          if (!canPurchaseProduct) {
                            return
                          }
                          toggleCartItem(product)
                        }}
                        disabled={!canPurchaseProduct}
                        className={`w-full py-2 text-xs font-bold transition-colors ${
                          canPurchaseProduct
                            ? `brutal-btn ${inCart ? 'brutal-btn-muted' : 'brutal-btn-hot'}`
                            : 'brutal-btn brutal-btn-disabled'
                        }`}
                      >
                        {canPurchaseProduct ? (inCart ? 'В КОРЗИНЕ' : 'ЗАБРАТЬ') : productStatusMeta.cta}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div
          id="screen-cart"
          ref={cartScreenRef}
          className="screen-container screen-panel px-4"
          style={{ transform: currentScreen === 'cart' ? 'translateX(0)' : 'translateX(100%)' }}
          onScroll={handleScreenScroll('cart')}
        >
          <div className="mb-4">{renderHeader()}</div>

          <h2 className="heading-font mb-6 border-b-4 border-black bg-black py-2 text-center text-5xl uppercase text-white">
            Корзина
          </h2>

          {cartItems.length === 0 ? (
            <div id="cart-empty" className="brutal-box border-dashed p-8 text-center text-lg font-bold">
              <Ghost className="mx-auto mb-2 h-10 w-10" />
              ПУСТО. ВЫБЕРИТЕ ВЕЩЬ ИЗ АРХИВА.
            </div>
          ) : (
            <div id="cart-items" className="flex flex-col gap-3">
              {cartItems.map((item) => (
                <div key={item.id} className="brutal-box flex items-center justify-between bg-white p-3">
                  <div className="flex flex-1 flex-col pr-2">
                    <span className="heading-font mb-1 text-xl leading-none uppercase">{item.name}</span>
                    <span className="inline-block w-max border-2 border-black bg-[#E0E0E0] px-1 text-sm font-bold">
                      {formatRub(item.price)}
                    </span>
                  </div>
                  <button
                    className="flex h-10 w-10 items-center justify-center border-[3px] border-black bg-black text-white active:bg-gray-800"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Удалить из корзины"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t-[4px] border-black pt-4">
            <div className="mb-6 flex items-end justify-between">
              <span className="heading-font text-2xl">ИТОГО:</span>
              <span className="border-2 border-black bg-[var(--bg-concrete)] px-2 text-2xl font-bold">
                {formatRub(cartTotal)}
              </span>
            </div>
            <button className="brutal-btn heading-font w-full border-black bg-[var(--soviet-red)] py-4 text-2xl tracking-widest shadow-none active:transform-none">
              ОФОРМИТЬ ЗАКАЗ
            </button>
          </div>
        </div>

        <div
          id="screen-about"
          ref={aboutScreenRef}
          className="screen-container screen-panel px-4"
          style={{ transform: currentScreen === 'about' ? 'translateX(0)' : 'translateX(100%)' }}
          onScroll={handleScreenScroll('about')}
          onPointerDown={handleAboutPointerDown}
        >
          <div className="mb-4">{renderHeader()}</div>

          <div className="brutal-box relative mb-6 bg-white p-4">
            <div className="heading-font absolute -left-3 -top-3 bg-black px-2 py-1 text-white">О НАС</div>
            <h2 className="heading-font mt-2 mb-2 text-4xl uppercase">О нас</h2>
            <div className="space-y-3 text-sm font-bold leading-relaxed">
              <p className="border-l-4 border-black bg-[#E0E0E0] p-2">
                Ресейл магазин, продвигающий вторичное использование одежды. У нас вы можете найти как
                винтажные Американских джинсы Levi&apos;s, так и одежду Итальянского бренда Stone Island - в
                идеальном состоянии. А так же премиум бренды и современную актуальную базу.
              </p>
              <p>
                Цикл запустил программу по эко-потреблению! Мы принимаем для переработки батарейки,
                фломастеры, чеки, зубные щетки, винные пробки, крышки от бутылок (двойки), карты, ручки,
                тюбики. Помимо этого мы принимаем вещи от всех желающих! Модники, ценители лучших брендов
                и винтажа, теперь мы выкупаем самые интересные вещи, а так же принимаем одежду на
                реализацию или в дар. У вас будет возможность получить деньги или выбрать что-то интересное
                в магазине на сумму равную стоимости этой вещи. Мы отдаем не использованную одежду на
                благотворительность. Если вы хотите освободить свой гардероб - теперь вы знаете, как это
                можно сделать.
              </p>
            </div>
          </div>

          <div className="brutal-box mb-6 bg-white p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="heading-font inline-block bg-black px-2 text-2xl text-white">
                ИНТЕРЬЕР • ЯНДЕКС КАРТЫ
              </h3>
              <a
                href={YANDEX_ORG_GALLERY_URL}
                target="_blank"
                rel="noreferrer"
                className="brutal-box brutal-input inline-flex items-center bg-[#E0E0E0] px-2 py-1 text-[10px] font-bold uppercase"
              >
                все фото
              </a>
            </div>

            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2" data-stories-track>
              {YANDEX_INTERIOR_PHOTOS.map((photo, index) => (
                <button
                  type="button"
                  key={photo}
                  className="image-zoom-trigger relative h-72 w-[84%] shrink-0 snap-start overflow-hidden border-[3px] border-black"
                  onClick={() =>
                    openImageZoom(photo, `Интерьер ЦИКЛ — фото ${index + 1} из Яндекс Карт`)
                  }
                >
                  <img
                    src={photo}
                    alt={`Интерьер ЦИКЛ — фото ${index + 1} из Яндекс Карт`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="brutal-box mb-6 bg-white p-2">
            <h3 className="heading-font mb-2 inline-block bg-black px-2 text-2xl text-white">ГЕОПОЗИЦИЯ</h3>
            <div className="relative h-[320px] overflow-hidden border-[3px] border-black" data-map-zone>
              <iframe
                src={YANDEX_MAP_WIDGET_URL}
                title="Яндекс Карта — ЦИКЛ"
                width="100%"
                height="100%"
                className={`h-full w-full transition-all duration-500 ${
                  isMapUnlocked ? 'pointer-events-auto map-frame-active' : 'pointer-events-none map-frame-inactive'
                }`}
                frameBorder="0"
                allowFullScreen
              />
              {!isMapUnlocked && (
                <button
                  type="button"
                  className={`map-lock-overlay brutal-input group ${
                    isMapUnlocking || isMapRelocking ? 'glitch-active' : ''
                  }`}
                  onClick={unlockMap}
                  aria-label="Активировать карту"
                >
                  <span className="map-lock-badge">Нажмите для управления</span>
                </button>
              )}
            </div>
          </div>

          <div className="brutal-box mb-3 bg-white p-3">
            <div className="flex items-start justify-between gap-2 border-b-[3px] border-black pb-2">
              <div>
                <p className="heading-font text-4xl leading-none">4.9</p>
                <p className="text-[10px] font-bold uppercase text-black/70">
                  Яндекс Карты • 59 отзывов • 111 оценок
                </p>
              </div>
              <a
                href={YANDEX_ORG_URL}
                target="_blank"
                rel="noreferrer"
                className="brutal-box brutal-input inline-flex items-center bg-[#E0E0E0] px-2 py-1 text-[10px] font-bold uppercase"
              >
                карточка места
              </a>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={YANDEX_ADD_REVIEW_URL}
                target="_blank"
                rel="noreferrer"
                className="brutal-btn brutal-btn-hot inline-flex items-center justify-center py-2 text-[11px] font-bold"
              >
                Оставить отзыв
              </a>
              <a
                href={YANDEX_ORG_REVIEWS_URL}
                target="_blank"
                rel="noreferrer"
                className="brutal-box brutal-input inline-flex items-center justify-center bg-[#E0E0E0] py-2 text-[11px] font-bold uppercase"
              >
                Все отзывы
              </a>
            </div>
          </div>

          <div className="brutal-box mb-4 bg-white p-2">
            <div className="mb-2 flex items-center justify-between border-b-[3px] border-black pb-2">
              <h3 className="heading-font inline-block bg-black px-2 text-2xl text-white">ОТЗЫВЫ</h3>
              <a
                href={YANDEX_ORG_REVIEWS_URL}
                target="_blank"
                rel="noreferrer"
                className="brutal-box brutal-input inline-flex items-center bg-[#E0E0E0] px-2 py-1 text-[10px] font-bold uppercase"
              >
                Яндекс Карты
              </a>
            </div>

            <div className="reviews-feed max-h-[520px] overflow-y-auto pr-1">
              {FEATURED_REVIEWS.map((review) => (
                <article key={review.id} className="brutal-box mb-3 bg-[var(--bg-paper)] p-3 last:mb-0">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-black bg-black text-lg font-bold text-white">
                      {review.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                        <p className="heading-font text-xl leading-none uppercase">{review.name}</p>
                        <p className="text-[10px] font-bold uppercase text-black/70">{review.date}</p>
                      </div>
                      <p className="mt-1 text-[14px] leading-none tracking-[0.15em] text-[var(--soviet-red)]">
                        {'★'.repeat(review.rating)}
                      </p>
                      <p className="mt-2 border-l-[3px] border-black bg-[#e7e2db] p-2 text-[12px] font-bold uppercase leading-snug">
                        {review.text}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <footer className="brutal-box adm-footer mt-6 mb-16 bg-white p-4">
            <div className="flex items-center justify-center">
              <img src={admLogo} alt="ADM logo" className="h-auto w-full max-w-[320px]" />
            </div>
          </footer>
        </div>
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-[185] bg-black/90" onClick={closeStory}>
          <div className="absolute left-0 right-0 top-0 z-[6] h-1.5 bg-zinc-900">
            <div className="h-full w-full origin-left bg-[var(--soviet-red)] animate-story-progress" />
          </div>

          <button
            className="absolute right-4 top-4 z-[7] flex h-9 w-9 items-center justify-center border-2 border-white bg-black text-white"
            onClick={closeStory}
            aria-label="Закрыть историю"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className={`relative z-[5] flex h-full items-center justify-center p-4 ${
              storyOpeningGlitch ? 'glitch-active' : ''
            }`}
          >
            <article
              className="brutal-box w-full max-w-sm overflow-hidden bg-black text-white"
              onClick={(event) => event.stopPropagation()}
            >
              {activeStory.image ? (
                <img
                  src={activeStory.image}
                  alt={activeStory.title}
                  className="h-[60vh] w-full object-cover"
                />
              ) : (
                <div className="flex h-[60vh] w-full items-center justify-center bg-[var(--soviet-red)]">
                  <span className="heading-font text-7xl text-white">{activeStory.promo}</span>
                </div>
              )}

              <div className="border-t-[3px] border-black bg-[var(--bg-paper)] p-3 text-black">
                <h3 className="heading-font text-4xl leading-none">{activeStory.title}</h3>
                <p className="mt-2 inline-block border-2 border-black bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {activeStory.subtitle}
                </p>
                <p className="mt-3 bg-[#e7e2db] p-2 text-[12px] font-bold uppercase leading-snug">
                  {activeStory.text}
                </p>
              </div>
            </article>
          </div>

          {storyOpeningGlitch && (
            <div className="vhs-noise pointer-events-none absolute inset-0 z-[6] opacity-100 mix-blend-screen" />
          )}
        </div>
      )}

      {activeProduct && (
        <div
          className="fixed inset-0 z-[190] bg-black/70 p-3 backdrop-blur-[2px]"
          onClick={() => setActiveProduct(null)}
        >
          <article
            className="product-focus-shell brutal-box mx-auto mt-12 max-w-md overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-[3px] border-black bg-black px-3 py-2 text-white">
              <div className="min-w-0">
                <p className="heading-font text-[18px] leading-none tracking-wide">КАРТОЧКА ТОВАРА</p>
                <p className="truncate text-[10px] font-bold tracking-wide text-white/80">ЦИКЛ / АРХИВ ШОУРУМА</p>
              </div>
              <span className={`product-status-badge is-${activeProductStatus}`}>
                {activeProductStatusMeta.badge}
              </span>
              <button
                className="flex h-8 w-8 items-center justify-center border-2 border-white bg-black text-white"
                onClick={() => setActiveProduct(null)}
                aria-label="Закрыть описание товара"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-[2px] border-b-[3px] border-black bg-black p-[2px]">
              <img
                src={activeProduct.images[0]}
                alt={activeProduct.name}
                className="image-zoom-trigger aspect-[3/4] w-full object-cover"
                onClick={() => openImageZoom(activeProduct.images[0], activeProduct.name)}
              />
              <img
                src={activeProduct.images[1] ?? activeProduct.images[0]}
                alt={`${activeProduct.name} detail`}
                className="image-zoom-trigger aspect-[3/4] w-full object-cover"
                onClick={() =>
                  openImageZoom(
                    activeProduct.images[1] ?? activeProduct.images[0],
                    `${activeProduct.name} detail`,
                  )
                }
              />
            </div>

            <div className="bg-[var(--bg-paper)] p-4">
              <h4 className="heading-font text-[28px] leading-[0.95] uppercase text-black">{activeProduct.name}</h4>
              {activeProductSubtitle && (
                <p className="mt-2 border-l-[3px] border-black bg-[#e7e2db] p-2 text-[12px] font-bold uppercase leading-tight">
                  {activeProductSubtitle}
                </p>
              )}

              {activeProductQuote && <blockquote className="product-focus-quote mt-3">{activeProductQuote}</blockquote>}

              <div className="mt-3 space-y-1 border-[3px] border-black bg-white p-2 text-[13px] font-bold leading-snug">
                <p>- Размер: {activeProduct.size}</p>
                <p>
                  - Цена: {formatRub(activeProduct.price)}
                  {activeProduct.oldPrice ? ' (УЦЕНКА)' : ''}
                </p>
                <p>- Статус: {activeProductStatusMeta.detail}</p>
              </div>

              {!canPurchaseActiveProduct && (
                <p className="product-status-note mt-4">
                  СТАТУС: {activeProductStatusMeta.detail}. ПОКУПКА НЕДОСТУПНА.
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  className={`flex-1 py-2 text-xs font-bold ${
                    canPurchaseActiveProduct
                      ? `brutal-btn ${isProductInCart(activeProduct.id) ? 'brutal-btn-muted' : 'brutal-btn-hot'}`
                      : 'brutal-btn brutal-btn-disabled'
                  }`}
                  disabled={!canPurchaseActiveProduct}
                  onClick={() => {
                    if (!canPurchaseActiveProduct) {
                      return
                    }
                    toggleCartItem(activeProduct)
                  }}
                >
                  {canPurchaseActiveProduct
                    ? isProductInCart(activeProduct.id)
                      ? 'УБРАТЬ ИЗ КОРЗИНЫ'
                      : 'ЗАБРАТЬ'
                    : activeProductStatusMeta.cta}
                </button>
                <button
                  className="brutal-box brutal-input w-[92px] bg-[#E0E0E0] px-2 py-2 text-[11px] font-bold"
                  onClick={() => setActiveProduct(null)}
                >
                  ЗАКРЫТЬ
                </button>
              </div>

              <div className="mt-3 text-right text-[10px] font-bold uppercase text-black/60">
                обновлено {activeProduct.postTime} • {activeProduct.postViews} просмотров
              </div>
            </div>
          </article>
        </div>
      )}

      {zoomViewer && (
        <div className="image-zoom-overlay" onClick={closeImageZoom}>
          <button
            type="button"
            className="image-zoom-close brutal-btn"
            aria-label="Закрыть зум"
            onClick={closeImageZoom}
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="image-zoom-toolbar brutal-box bg-white p-1"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="brutal-box brutal-input flex h-10 w-10 items-center justify-center bg-[#E0E0E0]"
              onClick={() => applyZoomScale(zoomScale - 0.3)}
              aria-label="Уменьшить"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="brutal-box brutal-input min-w-[74px] bg-black px-2 text-xs font-bold text-white"
              onClick={() => applyZoomScale(1)}
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              type="button"
              className="brutal-box brutal-input flex h-10 w-10 items-center justify-center bg-[#E0E0E0]"
              onClick={() => applyZoomScale(zoomScale + 0.3)}
              aria-label="Увеличить"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div
            className="image-zoom-stage"
            onClick={(event) => event.stopPropagation()}
            onWheel={handleZoomWheel}
            onPointerDown={handleZoomPointerDown}
            onPointerMove={handleZoomPointerMove}
            onPointerUp={handleZoomPointerUp}
            onPointerCancel={handleZoomPointerUp}
            onPointerLeave={handleZoomPointerUp}
          >
            <img
              src={zoomViewer.src}
              alt={zoomViewer.alt}
              className="image-zoom-image"
              draggable="false"
              style={{
                transform: `translate3d(${zoomOffset.x}px, ${zoomOffset.y}px, 0) scale(${zoomScale})`,
              }}
            />
          </div>
        </div>
      )}

      <nav
        className={`fixed bottom-5 left-4 right-4 z-[100] flex justify-center transition-all duration-300 ${
          isBottomNavVisible
            ? 'pointer-events-none translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-20 opacity-0'
        }`}
      >
        <div
          id="bottom-nav"
          className="brutal-box pointer-events-auto flex items-center gap-2 bg-[var(--bg-paper)] p-1 shadow-[6px_6px_0px_#000]"
        >
          <button
            className={`nav-btn flex h-12 w-14 items-center justify-center border-2 font-bold ${
              currentScreen === 'home' ? 'active-nav' : 'border-transparent'
            }`}
            onClick={() => navigate('home')}
          >
            <House className="h-7 w-7" />
          </button>

          <button
            className={`nav-btn flex h-12 items-center justify-center border-2 px-4 font-bold transition-all duration-300 ${
              currentScreen === 'cart' || flashCartNav ? 'active-nav' : 'border-transparent'
            }`}
            onClick={() => navigate('cart')}
          >
            <ShoppingBag className="h-7 w-7" />
            {cartTotal > 0 && (
              <span className="ml-2 whitespace-nowrap border-2 border-black bg-[var(--soviet-red)] px-2 py-1 text-[10px] font-bold text-white shadow-[2px_2px_0px_#000]">
                {formatRub(cartTotal)}
              </span>
            )}
          </button>

          <button
            className={`nav-btn flex h-12 w-14 items-center justify-center border-2 font-bold ${
              currentScreen === 'about' ? 'active-nav' : 'border-transparent'
            }`}
            onClick={() => navigate('about')}
          >
            <Info className="h-7 w-7" />
          </button>
        </div>
      </nav>

      <div
        id="overlay"
        className={`overlay ${activeSheet ? 'open' : ''}`}
        onClick={closeAllSheets}
        aria-hidden="true"
      />

      <div id="sheet-sort" className={`bottom-sheet p-5 pt-6 pb-10 ${activeSheet === 'sort' ? 'open' : ''}`}>
        <div className="mb-5 flex items-center justify-between border-b-[4px] border-black pb-2">
          <h3 className="heading-font text-3xl">СОРТИРОВКА</h3>
          <button
            onClick={closeAllSheets}
            className="flex h-8 w-8 items-center justify-center border-2 border-black bg-black text-white"
            aria-label="Закрыть сортировку"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            className={`brutal-box brutal-input flex items-center justify-center gap-2 py-3 text-sm font-bold ${
              catalogMode === 'catalog' ? 'filter-option-selected' : 'bg-white'
            }`}
            onClick={() => {
              setCatalogMode('catalog')
              closeAllSheets()
            }}
          >
            <Shirt className="h-4 w-4" />
            КАТАЛОГ
          </button>
          <button
            className={`brutal-box brutal-input flex items-center justify-center gap-2 py-3 text-sm font-bold ${
              catalogMode === 'archive' ? 'filter-option-selected' : 'bg-white'
            }`}
            onClick={() => {
              setCatalogMode('archive')
              closeAllSheets()
            }}
          >
            <Archive className="h-4 w-4" />
            АРХИВ
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`brutal-box brutal-input flex items-center justify-between bg-white p-3 text-left text-sm font-bold ${
                sortOrder === option.id ? 'filter-option-selected' : ''
              }`}
              onClick={() => {
                setSortOrder(option.id)
                closeAllSheets()
              }}
            >
              <span>{option.label}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div id="sheet-category" className={`bottom-sheet p-5 pt-6 pb-10 ${activeSheet === 'category' ? 'open' : ''}`}>
        <div className="mb-5 flex items-center justify-between border-b-[4px] border-black pb-2">
          <h3 className="heading-font text-3xl">КАТЕГОРИИ</h3>
          <button
            onClick={closeAllSheets}
            className="flex h-8 w-8 items-center justify-center border-2 border-black bg-black text-white"
            aria-label="Закрыть категории"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {categoryOptions.map((category) => (
            <button
              key={category.id}
              className={`brutal-box brutal-input flex items-center bg-white p-3 text-left text-sm font-bold ${
                normalizedSelectedCategory === category.id ? 'filter-option-selected' : ''
              }`}
              onClick={() => {
                setSelectedCategory(category.id)
                closeAllSheets()
              }}
            >
              <category.Icon className="mr-3 h-6 w-6 border-r-2 border-black pr-2" />
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div id="sheet-sizes" className={`bottom-sheet p-5 pt-6 pb-10 ${activeSheet === 'sizes' ? 'open' : ''}`}>
        <div className="mb-5 flex items-center justify-between border-b-[4px] border-black pb-2">
          <h3 className="heading-font text-3xl">РАЗМЕРЫ</h3>
          <button
            onClick={closeAllSheets}
            className="flex h-8 w-8 items-center justify-center border-2 border-black bg-black text-white"
            aria-label="Закрыть размеры"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            className={`brutal-box brutal-input py-4 text-center text-sm font-bold ${
              normalizedSelectedSize === 'all' ? 'filter-option-selected' : 'bg-[#E0E0E0]'
            }`}
            onClick={() => {
              setSelectedSize('all')
              closeAllSheets()
            }}
          >
            ВСЕ
          </button>
          {sizeOptions.length === 0 ? (
            <div className="brutal-box col-span-2 flex items-center justify-center bg-white px-2 py-4 text-center text-xs font-bold uppercase">
              В текущей выборке нет размеров
            </div>
          ) : (
            sizeOptions.map((size) => (
              <button
                key={size}
                className={`brutal-box brutal-input py-4 text-center font-bold ${
                  normalizedSelectedSize === size ? 'filter-option-selected text-lg' : 'bg-white text-lg'
                }`}
                onClick={() => {
                  setSelectedSize(size)
                  closeAllSheets()
                }}
              >
                {size === 'ONE SIZE' ? (
                  <span className="flex items-center justify-center text-sm leading-tight">
                    ONE
                    <br />
                    SIZE
                  </span>
                ) : (
                  size
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

