'use client'

import { useState } from 'react'
import { CartItem, Client } from '@/lib/types'
import { X, Minus, Plus, Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  items: CartItem[]
  currency: 'USD' | 'ARS' | 'EUR'
  client: Client | null
  onUpdateItem: (productId: string, quantity: number, variantLabel?: string) => void
  onOrderPlaced: () => void
  showIva?: boolean
  ivaRate?: number
}

function formatPrice(value: number, currency: 'USD' | 'ARS' | 'EUR'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function getPrice(item: CartItem, currency: 'USD' | 'ARS' | 'EUR'): number {
  if (currency === 'USD') return item.product.price_usd ?? 0
  if (currency === 'ARS') return item.product.price_ars ?? 0
  return item.product.price_eur ?? 0
}

export default function Cart({ open, onClose, items, currency, client, onUpdateItem, onOrderPlaced, showIva = false, ivaRate = 0.21 }: Props) {
  const [comments, setComments] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [error, setError] = useState('')

  const subtotal = items.reduce((sum, item) => sum + getPrice(item, currency) * item.quantity, 0)
  const shipping = parseFloat(shippingCost) || 0
  const total = subtotal + shipping

  async function handlePlaceOrder() {
    if (!client || items.length === 0) return
    setPlacing(true)
    setError('')

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipping_cost_estimate: shipping || null,
        comments: comments.trim() || null,
        total_usd: currency === 'USD' ? total : null,
        total_ars: currency === 'ARS' ? total : null,
        total_eur: currency === 'EUR' ? total : null,
        items: items.map(item => ({
          product_id: item.product.id,
          product_code: item.product.code,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price_usd: currency === 'USD' ? item.product.price_usd : null,
          unit_price_ars: currency === 'ARS' ? item.product.price_ars : null,
          unit_price_eur: currency === 'EUR' ? item.product.price_eur : null,
          variant_label: item.variantLabel || null,
        })),
      }),
    })

    if (!res.ok) {
      setError('Error al crear el pedido. Intentá de nuevo.')
      setPlacing(false)
      return
    }

    setPlaced(true)
    setPlacing(false)
    setComments('')
    setShippingCost('')
    setTimeout(() => {
      setPlaced(false)
      onOrderPlaced()
    }, 3000)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#F0E8D8] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D4535]/10">
          <h2 className="font-semibold text-[#2D4535]">Tu pedido</h2>
          <button onClick={onClose} className="text-[#2D4535]/50 hover:text-[#2D4535] transition-colors">
            <X size={20} />
          </button>
        </div>

        {placed ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-[#2D4535]">¡Pedido enviado!</h3>
              <p className="text-sm text-[#2D4535]/60 mt-2">
                Lo revisamos y te confirmamos a la brevedad.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-center text-[#2D4535]/40 py-10 text-sm">
                  El carrito está vacío
                </p>
              ) : (
                items.map(item => {
                  const price = getPrice(item, currency)
                  const lineTotal = price * item.quantity
                  return (
                    <div key={`${item.product.id}-${item.variantLabel ?? ''}`}
                         className="bg-white rounded-xl p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2D4535] truncate">{item.product.name}</p>
                        <p className="text-xs text-[#2D4535]/50 font-mono">{item.product.code}</p>
                        {item.variantLabel && <p className="text-xs text-[#2D4535]/40">{item.variantLabel}</p>}
                        <p className="text-sm font-semibold text-[#B8935A] mt-0.5">
                          {formatPrice(lineTotal, currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-[#F0E8D8] rounded-lg px-1">
                        <button
                          onClick={() => onUpdateItem(item.product.id, item.quantity - 1, item.variantLabel)}
                          className="p-1 text-[#2D4535]/60 hover:text-[#2D4535]"
                        >
                          {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-[#2D4535]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateItem(item.product.id, item.quantity + 1, item.variantLabel)}
                          className="p-1 text-[#2D4535]/60 hover:text-[#2D4535]"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer: totals + shipping + comments + confirm */}
            {items.length > 0 && (
              <div className="border-t border-[#2D4535]/10 px-5 py-4 space-y-4">
                {/* Shipping estimate */}
                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">
                    Costo de envío estimado (opcional)
                  </label>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#2D4535]/10">
                    <span className="text-sm text-[#2D4535]/40">
                      {currency === 'EUR' ? '€' : '$'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={shippingCost}
                      onChange={e => setShippingCost(e.target.value)}
                      className="flex-1 text-sm text-[#2D4535] bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-1 text-sm">
                  {showIva ? (
                    <>
                      <div className="flex justify-between text-[#2D4535]/60">
                        <span>Subtotal sin IVA</span>
                        <span>{formatPrice(Math.round(subtotal / (1 + ivaRate)), currency)}</span>
                      </div>
                      <div className="flex justify-between text-[#2D4535]/60">
                        <span>IVA ({Math.round(ivaRate * 100)}%)</span>
                        <span>{formatPrice(subtotal - Math.round(subtotal / (1 + ivaRate)), currency)}</span>
                      </div>
                      <div className="flex justify-between text-[#2D4535]/60">
                        <span>Subtotal con IVA</span>
                        <span>{formatPrice(subtotal, currency)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[#2D4535]/60">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal, currency)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="flex justify-between text-[#2D4535]/60">
                      <span>Envío estimado</span>
                      <span>{formatPrice(shipping, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-[#2D4535] text-base pt-1 border-t border-[#2D4535]/10">
                    <span>Total</span>
                    <span className="text-[#B8935A]">{formatPrice(total, currency)}</span>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">
                    Comentarios (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Necesito entrega urgente, consultar disponibilidad de..."
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="w-full text-sm text-[#2D4535] bg-white rounded-xl px-3 py-2
                               border border-[#2D4535]/10 focus:outline-none focus:ring-2 focus:ring-[#B8935A]
                               resize-none placeholder-[#2D4535]/30"
                  />
                </div>

                {error && <p className="text-red-600 text-xs">{error}</p>}

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full py-3 rounded-xl bg-[#2D4535] text-[#F0E8D8] font-medium
                             hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
                >
                  {placing ? 'Enviando...' : 'Confirmar pedido'}
                </button>
                <p className="text-xs text-center text-[#2D4535]/40">
                  No es un pago. Confirmamos el pedido por separado.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
