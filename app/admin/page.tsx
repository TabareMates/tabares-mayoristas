'use client'

import { useEffect, useState, useCallback } from 'react'
import { Order, Client, OrderStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Circle, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'

function formatPrice(value: number | null, currency?: string): string {
  if (!value) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency ?? 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function formatDispatchDate(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(iso + 'T12:00:00'))
}

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'approved', 'in_progress', 'shipped', 'delivered', 'cancelled']

export default function AdminPage() {
  const [orders, setOrders] = useState<(Order & { clients: Client })[]>([])
  const [adminClient, setAdminClient] = useState<Client | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [dispatchDates, setDispatchDates] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (res.status === 401) { window.location.href = '/'; return }
      if (res.status === 403) { router.push('/catalog'); return }
      if (!res.ok) { setLoading(false); return }
      const { orders: ordersData, admin } = await res.json()
      setAdminClient(admin)
      setOrders(ordersData ?? [])
      const notes: Record<string, string> = {}
      const dates: Record<string, string> = {}
      ordersData?.forEach((o: Order) => {
        if (o.admin_notes) notes[o.id] = o.admin_notes
        if (o.dispatch_date) dates[o.id] = o.dispatch_date
      })
      setAdminNotes(notes)
      setDispatchDates(dates)
      setLoading(false)
    } catch (e) {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function patchOrder(orderId: string, fields: Record<string, unknown>) {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, ...fields }),
    })
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setSaving(orderId)
    await patchOrder(orderId, { status })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    setSaving(null)
  }

  async function togglePayment(orderId: string, current: 'paid' | 'unpaid') {
    const next = current === 'paid' ? 'unpaid' : 'paid'
    await patchOrder(orderId, { payment_status: next })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: next } : o))
  }

  async function saveExtras(orderId: string) {
    setSaving(orderId + '_extra')
    await patchOrder(orderId, {
      admin_notes: adminNotes[orderId] || null,
      dispatch_date: dispatchDates[orderId] || null,
    })
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, admin_notes: adminNotes[orderId], dispatch_date: dispatchDates[orderId] || null }
        : o
    ))
    setSaving(null)
  }

  // Sort: pending first, then by dispatch_date asc, then created_at desc
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (b.status === 'pending' && a.status !== 'pending') return 1
    if (a.dispatch_date && b.dispatch_date) return a.dispatch_date.localeCompare(b.dispatch_date)
    if (a.dispatch_date) return -1
    if (b.dispatch_date) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const filtered = filterStatus === 'all' ? sortedOrders : sortedOrders.filter(o => o.status === filterStatus)
  const pendingCount = orders.filter(o => o.status === 'pending').length

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-[#2D4535]/50 text-sm">Cargando...</div></div>
  }

  return (
    <div className="min-h-screen">
      <NavBar client={adminClient} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D4535]">Pedidos</h1>
            <p className="text-sm text-[#2D4535]/60 mt-1">
              {orders.length} pedidos totales
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {pendingCount} nuevos
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg text-[#2D4535]/40 hover:text-[#2D4535] hover:bg-[#2D4535]/5 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium
              ${filterStatus === 'all' ? 'bg-[#2D4535] text-[#F0E8D8]' : 'bg-white text-[#2D4535]/60 hover:text-[#2D4535]'}`}
          >
            Todos ({orders.length})
          </button>
          {STATUS_OPTIONS.map(s => {
            const count = orders.filter(o => o.status === s).length
            if (count === 0) return null
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium
                  ${filterStatus === s ? 'bg-[#2D4535] text-[#F0E8D8]' : 'bg-white text-[#2D4535]/60 hover:text-[#2D4535]'}`}
              >
                {STATUS_LABELS[s]} ({count})
              </button>
            )
          })}
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {filtered.map(order => {
            const isExpanded = expandedId === order.id
            const currency = (order.clients?.currency ?? 'USD') as 'USD' | 'ARS' | 'EUR'
            const total = currency === 'ARS' ? order.total_ars : currency === 'EUR' ? order.total_eur : order.total_usd
            const isPaid = order.payment_status === 'paid'

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-[#2D4535]/10 overflow-hidden">
                <div className="px-5 py-4 flex items-start gap-3">
                  {/* Payment toggle */}
                  <button
                    onClick={() => togglePayment(order.id, order.payment_status ?? 'unpaid')}
                    className={`mt-0.5 shrink-0 transition-colors ${isPaid ? 'text-green-600' : 'text-[#2D4535]/20 hover:text-[#2D4535]/40'}`}
                    title={isPaid ? 'Cobrado — click para marcar no cobrado' : 'No cobrado — click para marcar cobrado'}
                  >
                    {isPaid ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>

                  <button
                    className="flex-1 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#2D4535]">{order.clients?.name}</span>
                      <span className="text-xs text-[#2D4535]/40">· {order.clients?.country}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {isPaid && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                          Cobrado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-[#2D4535]/50">
                        #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at)}
                      </p>
                      {order.dispatch_date && (
                        <p className="text-xs text-[#B8935A] flex items-center gap-1">
                          <CalendarDays size={11} />
                          Despacho: {formatDispatchDate(order.dispatch_date)}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[#B8935A]">{formatPrice(total, currency)}</p>
                    {currency === 'EUR' && <p className="text-xs text-[#2D4535]/40">IVA 21% incl.</p>}
                    {currency !== 'EUR' && <p className="text-xs text-[#2D4535]/40">{order.order_items?.length ?? 0} items</p>}
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="text-[#2D4535]/40 shrink-0 mt-1"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#2D4535]/10 px-5 py-4 bg-[#F0E8D8]/30 space-y-4">
                    {/* Items */}
                    <div className="space-y-1.5">
                      {order.order_items?.map(item => {
                        const unitPrice = currency === 'ARS' ? item.unit_price_ars : currency === 'EUR' ? item.unit_price_eur : item.unit_price_usd
                        const lineTotal = (unitPrice ?? 0) * item.quantity
                        return (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium text-[#2D4535]">{item.product_name}</span>
                              <span className="text-[#2D4535]/40 ml-1.5 font-mono text-xs">{item.product_code}</span>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <span className="text-[#2D4535]/60">{item.quantity} × {formatPrice(unitPrice, currency)}</span>
                              <span className="font-medium text-[#2D4535] ml-2">{formatPrice(lineTotal, currency)}</span>
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex justify-between text-sm font-semibold text-[#2D4535] pt-2 border-t border-[#2D4535]/10">
                        <span>Total{currency === 'EUR' ? ' (IVA 21% incl.)' : ''}</span>
                        <span className="text-[#B8935A]">{formatPrice(total, currency)}</span>
                      </div>
                    </div>

                    {/* Client comment */}
                    {order.comments && (
                      <div className="p-3 bg-white rounded-xl text-sm text-[#2D4535]/70 border border-[#2D4535]/10">
                        <span className="font-medium text-[#2D4535]">Comentario: </span>
                        {order.comments}
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-2">Estado</label>
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map(s => (
                          <button key={s} onClick={() => updateStatus(order.id, s)}
                            disabled={saving === order.id}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all
                              ${order.status === s
                                ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current'
                                : 'bg-white text-[#2D4535]/60 hover:text-[#2D4535] border border-[#2D4535]/10'}`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fecha despacho + notas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">
                          Fecha de despacho
                        </label>
                        <input
                          type="date"
                          value={dispatchDates[order.id] ?? ''}
                          onChange={e => setDispatchDates(prev => ({ ...prev, [order.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#2D4535]/10 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">
                          Nota para el cliente
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Sale el miércoles por DHL..."
                          value={adminNotes[order.id] ?? ''}
                          onChange={e => setAdminNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#2D4535]/10 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveExtras(order.id)}
                      disabled={saving === order.id + '_extra'}
                      className="px-4 py-2 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-sm hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
                    >
                      {saving === order.id + '_extra' ? 'Guardando...' : 'Guardar fecha y nota'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#2D4535]/40 text-sm">
              No hay pedidos en este estado
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
