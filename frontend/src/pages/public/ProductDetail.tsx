import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ShoppingCart, ArrowLeft, ZoomIn, X, ChevronLeft, ChevronRight, Check, Minus, Plus } from 'lucide-react'

interface Product {
  id: string; name: string; slug: string; description?: string
  price: number; compare_price?: number; stock: number; status: string
  images?: string[]; variants?: { name: string; options: string[] }[]
  sku?: string; weight?: number; tags?: string[]
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [product,   setProduct]   = useState<Product | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [imgIdx,    setImgIdx]    = useState(0)
  const [zoomed,    setZoomed]    = useState(false)
  const [qty,       setQty]       = useState(1)
  const [adding,    setAdding]    = useState(false)
  const [added,     setAdded]     = useState(false)
  const [selected,  setSelected]  = useState<Record<string, string>>({})
  const [stock,     setStock]     = useState<number | null>(null)

  useEffect(() => {
    apiClient.get(`/shop/products/slug/${slug}`)
      .then((res: any) => { setProduct(res); setStock(res?.stock ?? null) })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [slug])

  // Poll stock en tiempo real cada 30s
  useEffect(() => {
    if (!product?.id) return
    const interval = setInterval(async () => {
      try {
        const res: any = await apiClient.get(`/shop/products/${product.id}/stock`)
        if (res?.stock !== undefined) setStock(res.stock)
      } catch(_) {}
    }, 30000)
    return () => clearInterval(interval)
  }, [product?.id])

  const addToCart = async () => {
    if (!product) return
    setAdding(true)
    try {
      await apiClient.post('/cart/items', { product_id: product.id, quantity: qty })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch(e) { console.error(e) }
    finally { setAdding(false) }
  }

  const prevImg = useCallback(() => setImgIdx(i => Math.max(0, i - 1)), [])
  const nextImg = useCallback(() => setImgIdx(i => Math.min((product?.images?.length ?? 1) - 1, i + 1)), [product])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
      if (e.key === 'ArrowLeft') prevImg()
      if (e.key === 'ArrowRight') nextImg()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevImg, nextImg])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!product) return null

  const images       = product.images?.length ? product.images : ['/placeholder.png']
  const hasDiscount  = product.compare_price && product.compare_price > product.price
  const discountPct  = hasDiscount ? Math.round((1 - product.price / product.compare_price!) * 100) : 0
  const currentStock = stock ?? product.stock
  const inStock      = currentStock > 0
  const lowStock     = inStock && currentStock <= 5

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/shop" className="flex items-center gap-2 text-sm text-[#888899] hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to shop
          </Link>
          <Link to="/cart" className="flex items-center gap-2 text-sm text-[#888899] hover:text-white">
            <ShoppingCart size={16} /> Cart
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* Gallery */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0e0e1a] border border-[#2a2a3a] aspect-square group cursor-zoom-in"
            onClick={() => setZoomed(true)}>
            <img src={images[imgIdx]} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={14} className="text-white" />
            </div>
            {images.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prevImg() }}
                  disabled={imgIdx === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center disabled:opacity-30 hover:bg-black/70 transition-all">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={e => { e.stopPropagation(); nextImg() }}
                  disabled={imgIdx === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center disabled:opacity-30 hover:bg-black/70 transition-all">
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            {hasDiscount && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-black">
                -{discountPct}%
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={"w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all " + (
                    i === imgIdx ? 'border-[#7c6aff]' : 'border-[#2a2a3a] opacity-60 hover:opacity-100'
                  )}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black mb-2">{product.name}</h1>
            {product.sku && <p className="text-xs text-[#555566] font-mono">SKU: {product.sku}</p>}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-lg text-[#555566] line-through">${product.compare_price!.toFixed(2)}</span>
            )}
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-2">
            <div className={"w-2 h-2 rounded-full " + (inStock ? (lowStock ? 'bg-yellow-400' : 'bg-green-400') : 'bg-red-400')} />
            <span className={"text-sm font-semibold " + (inStock ? (lowStock ? 'text-yellow-400' : 'text-green-400') : 'text-red-400')}>
              {inStock ? (lowStock ? `Only ${currentStock} left!` : 'In stock') : 'Out of stock'}
            </span>
          </div>

          {/* Variants */}
          {product.variants?.map(variant => (
            <div key={variant.name}>
              <p className="text-sm font-bold text-white mb-2">
                {variant.name}
                {selected[variant.name] && <span className="text-[#7c6aff] ml-2">{selected[variant.name]}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {variant.options.map(opt => (
                  <button key={opt} onClick={() => setSelected(s => ({...s, [variant.name]: opt}))}
                    className={"px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all " + (
                      selected[variant.name] === opt
                        ? 'bg-[#7c6aff] border-[#7c6aff] text-white'
                        : 'border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]/50 hover:text-white'
                    )}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div>
            <p className="text-sm font-bold text-white mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl border border-[#2a2a3a] flex items-center justify-center hover:border-[#7c6aff]/50 transition-all">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold text-lg">{qty}</span>
              <button onClick={() => setQty(q => Math.min(currentStock, q + 1))}
                disabled={qty >= currentStock}
                className="w-9 h-9 rounded-xl border border-[#2a2a3a] flex items-center justify-center hover:border-[#7c6aff]/50 transition-all disabled:opacity-30">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button onClick={addToCart} disabled={adding || !inStock || added}
            className={"w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all " + (
              added ? 'bg-green-500 text-white' :
              !inStock ? 'bg-[#1a1a2e] text-[#555566] cursor-not-allowed' :
              'bg-[#7c6aff] hover:bg-[#6b5be6] text-white'
            )}>
            {added ? <><Check size={18} /> Added to cart!</> :
             adding ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</> :
             <><ShoppingCart size={18} /> {inStock ? 'Add to cart' : 'Out of stock'}</>}
          </button>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t border-[#2a2a3a]">
              <h2 className="text-sm font-bold text-white mb-2">Description</h2>
              <p className="text-sm text-[#888899] leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg bg-[#1a1a2e] text-xs text-[#555566] border border-[#2a2a3a]">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Zoom modal */}
      {zoomed && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setZoomed(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prevImg() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                disabled={imgIdx === 0}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={e => { e.stopPropagation(); nextImg() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                disabled={imgIdx === images.length - 1}>
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <img src={images[imgIdx]} alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
