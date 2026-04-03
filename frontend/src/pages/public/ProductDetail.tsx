import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import { apiClient } from '../../api/client'
import ProductReviews from '../../components/Reviews/ProductReviews'

export default function ProductDetail() {
  const { slug }            = useParams()
  const navigate            = useNavigate()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty]         = useState(1)
  const [adding, setAdding]   = useState(false)
  const [added, setAdded]     = useState(false)
  const [imgIdx, setImgIdx]   = useState(0)

  useEffect(() => {
    apiClient.get(`/shop/products/slug/${slug}`)
      .then((res: any) => setProduct(res))
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false))
  }, [slug])

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

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!product) return null

  const hasDiscount = product.compare_price && product.compare_price > product.price
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compare_price) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/shop" className="flex items-center gap-2 text-sm text-[#888899] hover:text-white transition-colors">
            <ArrowLeft size={16} />Tienda
          </Link>
          <Link to="/cart" className="p-2 border border-[#2a2a3a] rounded-lg hover:border-[#7c6aff] transition-all">
            <ShoppingCart size={18} />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Imágenes */}
          <div>
            <div className="aspect-square bg-[#111118] border border-[#2a2a3a] rounded-2xl overflow-hidden mb-3">
              {product.images?.[imgIdx]
                ? <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[#333344]"><Package size={64} /></div>
              }
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${imgIdx === i ? 'border-[#7c6aff]' : 'border-[#2a2a3a]'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.sku && <p className="text-xs font-mono text-[#555566] mb-2">SKU: {product.sku}</p>}
            <h1 className="text-3xl font-black mb-4 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-black text-[#7c6aff]">${product.price?.toFixed(2)}</span>
              {hasDiscount && <>
                <span className="text-lg text-[#555566] line-through">${product.compare_price?.toFixed(2)}</span>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discountPct}%</span>
              </>}
            </div>

            {product.description && (
              <p className="text-[#888899] leading-relaxed mb-6">{product.description}</p>
            )}

            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-[#888899]">
                {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center border border-[#2a2a3a] rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q-1))}
                    className="px-4 py-3 hover:bg-[#1a1a24] transition-all text-[#888899]">−</button>
                  <span className="px-4 py-3 font-bold min-w-[3rem] text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q+1))}
                    className="px-4 py-3 hover:bg-[#1a1a24] transition-all text-[#888899]">+</button>
                </div>
              </div>
            )}

            <button onClick={addToCart}
              disabled={adding || added || product.stock === 0}
              className="w-full py-4 bg-[#7c6aff] rounded-xl font-bold text-lg hover:bg-[#6b5be6] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              <ShoppingCart size={18} />
              {added ? '✓ Agregado al carrito' : adding ? 'Agregando...' : product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
            </button>

            {product.categories?.length > 0 && (
              <div className="flex gap-2 mt-6">
                {product.categories.map((c: any) => (
                  <span key={c.id} className="text-xs font-mono bg-[#1a1a24] border border-[#2a2a3a] px-3 py-1 rounded-full text-[#888899]">
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="border-t border-[#1a1a24] pt-12">
          <ProductReviews productId={product.id} />
        </div>
      </main>
    </div>
  )
}
