'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ProductWithPrice } from '@/lib/types'
import { Plus, Minus, ShoppingCart, X } from 'lucide-react'

interface Props {
  product: ProductWithPrice
  currency: 'USD' | 'ARS' | 'EUR'
  onAddToCart: (product: ProductWithPrice, qty: number) => void
}

function formatPrice(value: number | null, currency: 'USD' | 'ARS' | 'EUR'): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export default function ProductCard({ product, currency, onAddToCart }: Props) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const price = currency === 'USD' ? product.price_usd : currency === 'ARS' ? product.price_ars : product.price_eur
  const hasPrice = price !== null
  const IVA_RATE = 0.21
  const showIva = currency === 'EUR' && hasPrice
  const priceWithIva = showIva ? price! * (1 + IVA_RATE) : null

  function handleAdd() {
    onAddToCart(product, qty)
    setAdded(true)
    setQty(1)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden border border-[#2D4535]/10
                      hover:border-[#B8935A]/40 hover:shadow-md transition-all">
        {/* Product image — click to open detail */}
        <button
          onClick={() => setShowModal(true)}
          className="relative w-full h-64 bg-[#F0E8D8] block text-left focus:outline-none"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
              🧉
            </div>
          )}
        </button>

        {/* Content */}
        <div className="p-4">
          {/* Code badge */}
          <span className="inline-block bg-[#2D4535]/10 text-[#2D4535]/60 text-xs px-2 py-0.5 rounded-full font-mono mb-2">
            {product.code}
          </span>

          {/* Name — click to open detail */}
          <button
            onClick={() => setShowModal(true)}
            className="text-left w-full font-semibold text-[#2D4535] leading-snug hover:text-[#B8935A] transition-colors"
          >
            {product.name}
          </button>

          {product.description && (
            <p className="text-sm text-[#2D4535]/60 mt-1 line-clamp-2">{product.description}</p>
          )}
          {product.description && product.description.length > 80 && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-[#B8935A] hover:underline mt-0.5"
            >
              Ver más
            </button>
          )}
          {product.weight_kg && (
            <p className="text-xs text-[#2D4535]/40 mt-1">{product.weight_kg} kg · {product.unit}</p>
          )}

          {/* Price */}
          <div className="mt-3 mb-4">
            {hasPrice ? (
              <div>
                <span className="text-xl font-semibold text-[#B8935A]">
                  {formatPrice(showIva ? priceWithIva : price, currency)}
                </span>
                {showIva && (
                  <p className="text-xs text-[#2D4535]/50 mt-0.5">IVA 21% incluido</p>
                )}
              </div>
            ) : (
              <span className="text-sm text-[#2D4535]/40 italic">Precio a consultar</span>
            )}
          </div>

          {/* Qty + Add */}
          {hasPrice && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#F0E8D8] rounded-lg px-1">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="p-1.5 text-[#2D4535]/60 hover:text-[#2D4535] transition-colors"
                >
                  <Minus size={13} />
                </button>
                <span className="w-7 text-center text-sm font-medium text-[#2D4535]">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="p-1.5 text-[#2D4535]/60 hover:text-[#2D4535] transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium
                            transition-all
                            ${added
                              ? 'bg-green-100 text-green-700'
                              : 'bg-[#2D4535] text-[#F0E8D8] hover:bg-[#3d5c47]'
                            }`}
              >
                <ShoppingCart size={14} />
                {added ? '¡Agregado!' : 'Agregar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2D4535]/10">
                <span className="font-mono text-xs text-[#2D4535]/50">{product.code}</span>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#2D4535]/40 hover:text-[#2D4535] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal image */}
              {product.image_url && (
                <div className="relative h-64 bg-[#F0E8D8]">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    sizes="512px"
                  />
                </div>
              )}

              {/* Modal content */}
              <div className="p-5">
                <h2 className="text-xl font-semibold text-[#2D4535] mb-3">{product.name}</h2>
                {product.description && (
                  <p className="text-sm text-[#2D4535]/70 leading-relaxed">{product.description}</p>
                )}
                {product.weight_kg && (
                  <p className="text-xs text-[#2D4535]/40 mt-3">{product.weight_kg} kg · {product.unit}</p>
                )}

                {hasPrice && (
                  <div className="mt-4 pt-4 border-t border-[#2D4535]/10">
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-[#B8935A]">
                        {formatPrice(showIva ? priceWithIva : price, currency)}
                      </span>
                      {showIva && (
                        <p className="text-sm text-[#2D4535]/50 mt-0.5">IVA 21% incluido</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#F0E8D8] rounded-lg px-1">
                        <button
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          className="p-1.5 text-[#2D4535]/60 hover:text-[#2D4535] transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-7 text-center text-sm font-medium text-[#2D4535]">{qty}</span>
                        <button
                          onClick={() => setQty(q => q + 1)}
                          className="p-1.5 text-[#2D4535]/60 hover:text-[#2D4535] transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => { handleAdd(); setShowModal(false) }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-[#2D4535] text-[#F0E8D8] hover:bg-[#3d5c47] transition-all"
                      >
                        <ShoppingCart size={14} />
                        Agregar al pedido
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
