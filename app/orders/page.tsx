'use client'

import { useEffect, useState, useCallback } from 'react'
import { Order, Client, STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'

function formatPrice(value: number | null, currency: 'USD' | 'ARS' | 'EUR'): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.status === 401) { window.location.href = '/'; return }
      if (!res.ok) { setLoading(false); return }
      const { client: clientData, orders: ordersData } = await res.json()
      setClient(clientData)
      setOrders(ordersData ?? [])
      setLoading(false)
    } catch (e) {
      console.error('Error loading orders:', e)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#2D4535]/50 text-sm">Cargando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <NavBar client={client} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#2D4535] mb-6">Mis Pedidos</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 text-[#2D4535]/40">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Todavía no hiciste pedidos</p>
            <a href="/catalog" className="text-sm text-[#B8935A] hover:underline mt-2 inline-block">
              Ir al catálogo →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const isExpanded = expandedId === order.id
              const currency = (client?.currency ?? 'USD') as 'USD' | 'ARS' | 'EUR'
              const total = currency === 'ARS' ? order.total_ars : currency === 'EUR' ? order.total_eur : order.total_usd

              return (
                <div key={order.id}
                     className="bg-white rounded-2xl border border-[#2D4535]/10 overflow-hidden">
                  {/* Order header */}
                  <button
                    className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#2D4535]/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-[#2D4535]/40">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        {order.payment_status === 'paid' && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            Pago
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#2D4535]/60 mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-[#B8935A]">
                        {formatPrice(total, currency)}
                      </p>
                      <p className="text-xs text-[#2D4535]/40">
                        {order.order_items?.length ?? 0} productos
                      </p>
                    </div>
                    <div className="text-[#2D4535]/40 shrink-0">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-[#2D4535]/10 px-5 py-4 bg-[#F0E8D8]/50">
                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {order.order_items?.map(item => {
                          const unitPrice = currency === 'ARS' ? item.unit_price_ars : currency === 'EUR' ? item.unit_price_eur : item.unit_price_usd
                          const lineTotal = (unitPrice ?? 0) * item.quantity
                          return (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-medium text-[#2D4535]">{item.product_name}</span>
                                <span className="text-[#2D4535]/40 ml-2 font-mono text-xs">{item.product_code}</span>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <span className="text-[#2D4535]/60">{item.quantity} × {formatPrice(unitPrice, currency)}</span>
                                <span className="font-medium text-[#2D4535] ml-2">{formatPrice(lineTotal, currency)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Shipping & total */}
                      {order.shipping_cost_estimate && (
                        <div className="flex justify-between text-sm text-[#2D4535]/60 border-t border-[#2D4535]/10 pt-2">
                          <span>Envío estimado</span>
                          <span>{formatPrice(order.shipping_cost_estimate, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold text-[#2D4535] pt-1">
                        <span>Total{currency === 'EUR' ? ' (IVA 21% incl.)' : ''}</span>
                        <span className="text-[#B8935A]">{formatPrice(total, currency)}</span>
                      </div>

                      {/* Comments */}
                      {order.comments && (
                        <div className="mt-3 p-3 bg-white rounded-xl text-sm text-[#2D4535]/70 border border-[#2D4535]/10">
                          <span className="font-medium text-[#2D4535]">Tu comentario: </span>
                          {order.comments}
                        </div>
                      )}

                      {/* Dispatch date */}
                      {order.dispatch_date && (
                        <div className="mt-2 p-3 bg-[#2D4535]/5 rounded-xl text-sm text-[#2D4535]/80 border border-[#2D4535]/10 flex items-center gap-2">
                          <span>📦</span>
                          <span><span className="font-medium text-[#2D4535]">Fecha de despacho estimada:</span> {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(order.dispatch_date + 'T12:00:00'))}</span>
                        </div>
                      )}

                      {/* Admin notes */}
                      {order.admin_notes && (
                        <div className="mt-2 p-3 bg-[#B8935A]/10 rounded-xl text-sm text-[#2D4535]/80 border border-[#B8935A]/20">
                          <span className="font-medium text-[#B8935A]">Nota de Tabaré: </span>
                          {order.admin_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
