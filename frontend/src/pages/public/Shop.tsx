import SEO from '../../components/SEO/SEO'
import NewsletterWidget from '../../components/Newsletter/NewsletterWidget'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Search, Filter } from 'lucide-react'
import { apiClient } from '../../api/client'

interface Product {
  id: string; name: string; slug: string; price: number
  compare_price: number | null; stock: number; images: string[]
  status: string
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [cart, setCart]         = useState<Record<string, number>>(() => { try { const s = localStorage.getItem('rustcms_cart'); return s ? JSON.parse(s) : {} } catch(_) { return {} } })

  useEffect(() => { load() }, [search])

  const load = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${search}&status=active` : '?status=active'
      const res: any = await apiClient.get(`/shop/products${params}`)
      setProducts(Array.isArray(res?.data) ? res.data : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const addToCart = (productId: string) => {
  const newCart = { ...cart, [productId]: (cart[productId] || 0) + 1 }
  setCart(newCart)
  try { localStorage.setItem('rustcms_cart', JSON.stringify(newCart)) } catch(_) {}
}
  setCart(newCart)
  try { localStorage.setItem('rustcms_cart', JSON.stringify(newCart)) } catch(_) {}
}
