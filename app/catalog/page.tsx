'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProductWithPrice, CartItem, Client } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import Cart from '@/components/Cart'
import NavBar from '@/components/NavBar'
import { ShoppingCart } from 'lucide-react'

const CATEGORIES = [
  { value: 'todos', label: 'Todos' },
  { value: 'disponibles', label: 'Disponibles' },
  { value: 'mates', label: 'Mates' },
  { value: 'materas', label: 'Materas' },
  { value: 'bombillas', label: 'Bombillas' },
  { value: 'yerbas', label: 'Yerbas' },
  { value: 'yerberos', label: 'Yerberos' },
  { value: 'termos', label: 'Termos' },
  { value: 'extras', label: 'Extras' },
]

export default function CatalogPage() {
  const [products, setProducts] = useState<ProductWithPrice[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [variantsByProductId, setVariantsByProductId] = useState<Record<string, Array<{id: string; label: string}>>>({})

  const fetchData = useCallback(async () => {
    try {
      // Use server-side API route — avoids RLS/JWT issues with browser Supabase client
      const res = await fetch('/api/me')

      if (res.status === 401) {
        // Not logged in — middleware should catch this, but just in case
        window.location.href = '/'
        return
      }

      if (res.status === 404) {
        setNoProfile(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setLoading(false)
        return
      }

      const { client: clientData, prices, products: productsData, variantsByProductId: vbp } = await res.json()
      setClient(clientData)
      setVariantsByProductId(vbp ?? {})

      const priceMap = new Map(prices.map((p: any) => [p.product_id, p]))
      const enriched: ProductWithPrice[] = productsData.map((p: any) => ({
        ...p,
        price_usd: (priceMap.get(p.id) as any)?.price_usd ?? null,
        price_ars: (priceMap.get(p.id) as any)?.price_ars ?? null,
        price_eur: (priceMap.get(p.id) as any)?.price_eur ?? null,
      }))

      setProducts(enriched)
      setLoading(false)
    } catch (e) {
      console.error('Error loading catalog:', e)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function addToCart(product: ProductWithPrice, qty: number, variantLabel?: string) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.variantLabel === variantLabel)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && i.variantLabel === variantLabel
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      }
      return [...prev, { product, quantity: qty, variantLabel }]
    })
  }

  function updateCartItem(productId: string, quantity: number, variantLabel?: string) {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => !(i.product.id === productId && i.variantLabel === variantLabel)))
    } else {
      setCart(prev => prev.map(i =>
        i.product.id === productId && i.variantLabel === variantLabel ? { ...i, quantity } : i
      ))
    }
  }

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#2D4535]/50 text-sm">Cargando catálogo...</div>
      </div>
    )
  }

  if (noProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🧉</div>
          <h2 className="text-lg font-semibold text-[#2D4535] mb-2">Tu cuenta está siendo configurada</h2>
          <p className="text-sm text-[#2D4535]/60">
            Aún no tenés un perfil asignado. Contactá a Tabaré Mates para activar tu acceso.
          </p>
          <p className="text-xs text-[#2D4535]/40 mt-4">manuel@tabare.com.ar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <NavBar client={client} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D4535]">Catálogo</h1>
            <p className="text-sm text-[#2D4535]/60 mt-1">
              {products.length} productos · Precios en {client?.currency ?? 'USD'}
            </p>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D4535] text-[#F0E8D8]
                       hover:bg-[#3d5c47] transition-colors"
          >
            <ShoppingCart size={18} />
            <span className="text-sm font-medium">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#B8935A]
                               text-white text-xs flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-[#2D4535] text-[#F0E8D8]'
                  : 'bg-white border border-[#2D4535]/20 text-[#2D4535]/60 hover:border-[#2D4535]/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {(() => {
          const filtered = products.filter(p => {
            if (selectedCategory === 'todos') return true
            if (selectedCategory === 'disponibles') {
              const price = client?.currency === 'USD' ? p.price_usd : client?.currency === 'ARS' ? p.price_ars : p.price_eur
              return price !== null && price !== undefined
            }
            return p.category === selectedCategory
          })
          return filtered.length === 0 ? (
            <div className="text-center py-20 text-[#2D4535]/40">
              <p className="text-lg">No hay productos disponibles</p>
              <p className="text-sm mt-1">Contactanos si creés que hay un error</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={client?.currency ?? 'USD'}
                  onAddToCart={addToCart}
                  variants={variantsByProductId[product.id] ?? []}
                />
              ))}
            </div>
          )
        })()}
      </main>

      {/* WhatsApp floating button */}
      {!client?.is_admin && (
        <a
          href="https://wa.me/5491166407189"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-[#25D366] text-white
                     px-4 py-3 rounded-full shadow-lg hover:bg-[#1ebe5d] transition-colors text-sm font-medium"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Consultar
        </a>
      )}

      {/* Cart drawer */}
      <Cart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        currency={client?.currency ?? 'USD'}
        client={client}
        onUpdateItem={(productId, quantity, variantLabel) => updateCartItem(productId, quantity, variantLabel)}
        onOrderPlaced={() => {
          setCart([])
          setCartOpen(false)
        }}
      />
    </div>
  )
}
