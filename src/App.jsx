import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ChevronDown,
  Ghost,
  House,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Send,
  Shirt,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react'
import admLogo from './assets/adm-logo.svg'
import cycleLogoOriginal from './assets/cycle-logo-original.svg'

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

const CATEGORIES = [
  { id: 'all', label: 'ВСЕ КАТЕГОРИИ' },
  { id: 'tops', label: 'ФУТБОЛКИ / ПОЛО' },
  { id: 'pants', label: 'ШТАНЫ / ДЖИНСЫ' },
  { id: 'outerwear', label: 'ВЕРХНЯЯ ОДЕЖДА' },
  { id: 'shoes', label: 'ОБУВЬ' },
]

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'ONE SIZE']

const SORT_OPTIONS = [
  { id: 'new', label: 'СОРТ: ПО НОВИЗНЕ' },
  { id: 'price-asc', label: 'СОРТ: ЦЕНА ↑' },
  { id: 'price-desc', label: 'СОРТ: ЦЕНА ↓' },
  { id: 'discount', label: 'СОРТ: СО СКИДКОЙ' },
]

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
const YANDEX_REVIEWS_WIDGET_URL = `https://yandex.ru/maps-reviews-widget/${YANDEX_ORG_ID}?comments`
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
const ORDER_TG_LINK = 'https://t.me/cycle_order'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function buildApiUrl(path) {
  if (!API_BASE_URL) {
    return path
  }
  return `${API_BASE_URL}${path}`
}

function formatRub(price) {
  return `${new Intl.NumberFormat('ru-RU').format(price)} ₽`
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
  const [activeProduct, setActiveProduct] = useState(null)
  const [activeStory, setActiveStory] = useState(null)
  const [storyOpeningGlitch, setStoryOpeningGlitch] = useState(false)
  const [isMapUnlocked, setIsMapUnlocked] = useState(false)
  const [products, setProducts] = useState(SEED_PRODUCTS)

  const [cartItems, setCartItems] = useState([])
  const [flashCartNav, setFlashCartNav] = useState(false)

  const [glitchStoryId, setGlitchStoryId] = useState(null)

  const splashStartYRef = useRef(0)
  const touchStartXRef = useRef(0)
  const lastScreenScrollRef = useRef({ home: 0, cart: 0, about: 0 })

  const splashIntroTimerRef = useRef(null)
  const splashRemoveTimerRef = useRef(null)
  const storyTimerRef = useRef(null)
  const storyAutoCloseTimerRef = useRef(null)
  const storyGlitchTimerRef = useRef(null)
  const cartFlashTimerRef = useRef(null)

  const homeScreenRef = useRef(null)
  const cartScreenRef = useRef(null)
  const aboutScreenRef = useRef(null)

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price, 0),
    [cartItems],
  )
  const cartProductIds = useMemo(() => new Set(cartItems.map((item) => item.id)), [cartItems])

  const filteredProducts = useMemo(() => {
    const next = products.filter((product) => {
      const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory
      const sizeValue = String(product.size ?? '').toUpperCase()
      const sizeMatch = selectedSize === 'all' || sizeValue.includes(selectedSize)
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
  }, [products, selectedCategory, selectedSize, sortOrder])

  const currentSort =
    SORT_OPTIONS.find((option) => option.id === sortOrder) ?? SORT_OPTIONS[0]

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

        setProducts(payload.products)
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

  const handleMainTouchStart = (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    if (target.closest('.product-gallery') || target.closest('[data-stories-track]')) {
      return
    }

    touchStartXRef.current = event.changedTouches[0].screenX
  }

  const handleMainTouchEnd = (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    if (target.closest('.product-gallery') || target.closest('[data-stories-track]')) {
      return
    }

    const endX = event.changedTouches[0].screenX
    const distance = endX - touchStartXRef.current

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

  const cycleSort = () => {
    const currentIndex = SORT_OPTIONS.findIndex((option) => option.id === sortOrder)
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length
    setSortOrder(SORT_OPTIONS[nextIndex].id)
  }

  const openProductPost = (product) => {
    setActiveProduct(product)
  }

  const renderHeader = () => (
    <header className="pointer-events-none flex justify-between gap-3">
      <div
        className="brutal-box pointer-events-auto flex h-16 flex-1 cursor-pointer items-center p-2"
        onClick={() => navigate('home')}
      >
        <img src={cycleLogoOriginal} alt="Логотип ЦИКЛ" className="mr-3 h-12 w-12 shrink-0 rounded-sm" />
        <div className="flex flex-col">
          <span className="heading-font text-2xl leading-none tracking-wider">ЦИКЛ</span>
          <span className="mt-1 flex items-center bg-black px-1 text-[8px] font-bold leading-tight text-white">
            <MapPin className="mr-1 h-3 w-3" /> ВОРОНЕЖ, Ф.ЭНГЕЛЬСА, 35
          </span>
        </div>
      </div>

      <div className="brutal-box pointer-events-auto grid h-16 w-[92px] shrink-0 grid-cols-3 grid-rows-2 bg-[#E0E0E0]">
        <a
          href="tel:+79081332760"
          className="col-span-3 flex items-center justify-center border-b-[3px] border-black active:bg-black active:text-white"
          aria-label="Phone"
        >
          <Phone className="h-5 w-5" />
        </a>
        <a
          href="https://t.me/cycle_showroom"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center border-r-[3px] border-black active:bg-black active:text-white"
          aria-label="Telegram"
        >
          <Send className="h-4 w-4" />
        </a>
        <a
          href="https://vk.com/cycle_showroom"
          target="_blank"
          rel="noreferrer"
          className="heading-font flex items-center justify-center border-r-[3px] border-black text-[12px] active:bg-black active:text-white"
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
                  <Shirt className="mr-2 h-4 w-4" /> КАТЕГОРИИ
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
                onClick={cycleSort}
              >
                <span>{currentSort.label}</span>
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
            {filteredProducts.map((product) => {
              const inCart = isProductInCart(product.id)

              return (
                <div
                  key={product.id}
                  className="brutal-box group relative flex cursor-pointer flex-col bg-white"
                  onClick={() => openProductPost(product)}
                >
                  <span className="absolute right-1 top-1 z-20 border-2 border-black bg-[#E0E0E0] px-1 py-[1px] text-[9px] font-bold uppercase tracking-wide">
                    пост
                  </span>
                  <div className="product-gallery">
                    {product.images.map((image) => (
                      <img key={image} src={image} alt={product.name} />
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col p-2">
                    <h3 className="heading-font mb-2 text-[16px] leading-none uppercase">{product.name}</h3>
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
                          toggleCartItem(product)
                        }}
                        className={`brutal-btn w-full py-2 text-xs font-bold transition-colors ${
                          inCart ? 'brutal-btn-muted' : 'brutal-btn-hot'
                        }`}
                      >
                        {inCart ? 'В КОРЗИНЕ' : 'ЗАБРАТЬ'}
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
        >
          <div className="mb-4">{renderHeader()}</div>

          <div className="brutal-box relative mb-6 bg-white p-4">
            <div className="heading-font absolute -left-3 -top-3 bg-black px-2 py-1 text-white">ДОСЬЕ</div>
            <h2 className="heading-font mt-2 mb-2 text-4xl uppercase">Манифест</h2>
            <div className="space-y-3 text-sm font-bold leading-relaxed">
              <p className="border-l-4 border-black bg-[#E0E0E0] p-2">
                {'>'} ЦИКЛ - магазин селективной и винтажной одежды.
              </p>
              <p>
                {'>'} Мы не просто продаем вещи, мы продлеваем их жизненный цикл. Каждая вещь
                отобрана вручную.
              </p>
              <p>
                {'>'} В наличии всегда интересные айтемы европейского и американского рынка с
                историей.
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
                <a
                  key={photo}
                  href={YANDEX_ORG_GALLERY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="relative h-72 w-[84%] shrink-0 snap-start overflow-hidden border-[3px] border-black"
                >
                  <img
                    src={photo}
                    alt={`Интерьер ЦИКЛ — фото ${index + 1} из Яндекс Карт`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>

          <div className="brutal-box mb-6 bg-white p-2">
            <h3 className="heading-font mb-2 inline-block bg-black px-2 text-2xl text-white">ГЕОПОЗИЦИЯ</h3>
            <div className="relative h-[320px] overflow-hidden border-[3px] border-black">
              <iframe
                src={YANDEX_MAP_WIDGET_URL}
                title="Яндекс Карта — ЦИКЛ"
                width="100%"
                height="100%"
                className={`h-full w-full transition-all duration-500 ${
                  isMapUnlocked ? 'pointer-events-auto' : 'pointer-events-none grayscale'
                }`}
                frameBorder="0"
                allowFullScreen
              />
              {!isMapUnlocked && (
                <button
                  type="button"
                  className="map-lock-overlay group"
                  onClick={() => setIsMapUnlocked(true)}
                  aria-label="Активировать карту"
                >
                  <span className="map-lock-badge">Нажми, чтобы активировать карту</span>
                  <span className="map-lock-hint">после нажатия можно двигать и масштабировать</span>
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

          <div className="brutal-box overflow-hidden bg-white p-1">
            <iframe
              src={YANDEX_REVIEWS_WIDGET_URL}
              title="Отзывы Яндекс Карт — ЦИКЛ"
              width="100%"
              height="760"
              frameBorder="0"
            />
          </div>
          <div className="mt-2 px-1 text-[10px] font-bold uppercase text-black/70">
            Реальные отзывы загружаются из Яндекс Карт. Кнопки выше ведут на страницу отзывов и форму добавления.
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
                className="aspect-[3/4] w-full object-cover"
              />
              <img
                src={activeProduct.images[1] ?? activeProduct.images[0]}
                alt={`${activeProduct.name} detail`}
                className="aspect-[3/4] w-full object-cover"
              />
            </div>

            <div className="bg-[var(--bg-paper)] p-4">
              <h4 className="heading-font text-[28px] leading-[0.95] uppercase text-black">{activeProduct.name}</h4>
              <p className="mt-2 border-l-[3px] border-black bg-[#e7e2db] p-2 text-[12px] font-bold uppercase leading-tight">
                {activeProduct.subtitle}
              </p>

              <blockquote className="product-focus-quote mt-3">{activeProduct.quote}</blockquote>

              <div className="mt-3 space-y-1 border-[3px] border-black bg-white p-2 text-[13px] font-bold leading-snug">
                <p>- Размер: {activeProduct.size}</p>
                <p>
                  - Цена: {formatRub(activeProduct.price)}
                  {activeProduct.oldPrice ? ' (УЦЕНКА)' : ''} (БРОНЬ)
                </p>
              </div>

              <a
                href={ORDER_TG_LINK}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center border-b-2 border-black text-[13px] font-bold uppercase text-black"
              >
                Для заказа к @cycle_order
              </a>

              <div className="mt-4 flex gap-2">
                <button
                  className={`brutal-btn flex-1 py-2 text-xs font-bold ${
                    isProductInCart(activeProduct.id) ? 'brutal-btn-muted' : 'brutal-btn-hot'
                  }`}
                  onClick={() => toggleCartItem(activeProduct)}
                >
                  {isProductInCart(activeProduct.id) ? 'УБРАТЬ ИЗ КОРЗИНЫ' : 'ЗАБРАТЬ'}
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
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`brutal-box brutal-input flex items-center bg-white p-3 text-left text-sm font-bold ${
                selectedCategory === category.id ? 'bg-black text-white' : ''
              }`}
              onClick={() => {
                setSelectedCategory(category.id)
                closeAllSheets()
              }}
            >
              <Shirt className="mr-3 h-6 w-6 border-r-2 border-black pr-2" />
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
        <div className="grid grid-cols-3 gap-3">
          <button
            className={`brutal-box brutal-input py-4 text-center text-sm font-bold ${
              selectedSize === 'all' ? 'bg-black text-white' : 'bg-[#E0E0E0]'
            }`}
            onClick={() => {
              setSelectedSize('all')
              closeAllSheets()
            }}
          >
            ВСЕ
          </button>
          {SIZES.map((size) => (
            <button
              key={size}
              className={`brutal-box brutal-input py-4 text-center font-bold ${
                selectedSize === size ? 'border-white bg-black text-lg text-white border-[3px]' : 'bg-white text-lg'
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
          ))}
        </div>
      </div>
    </div>
  )
}

