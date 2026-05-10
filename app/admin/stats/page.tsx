'use client'

import { useEffect, useState, useCallback } from 'react'
import { Client } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'

interface ClientStat {
  client: { id: string; name: string; currency: string }
  orderCount: number
  totalNative: number
  totalUsd: number
  goal: { id?: string; target_usd: number; label?: string } | null
}

interface Rates {
  arsPerUsd: number
  eurToUsd: number
  date: string
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-[#B8935A]' : 'bg-[#2D4535]/40'
  return (
    <div className="w-full bg-[#2D4535]/10 rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function fmt(value: number, currency = 'USD') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value)
}

export default function StatsPage() {
  const [adminClient, setAdminClient] = useState<Client | null>(null)
  const [stats, setStats] = useState<ClientStat[]>([])
  const [globalGoal, setGlobalGoal] = useState<{ target_usd: number; label: string } | null>(null)
  const [totalUsd, setTotalUsd] = useState(0)
  const [rates, setRates] = useState<Rates | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null) // client id or 'global'
  const [editValue, setEditValue] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const adminCheck = await fetch('/api/admin/orders')
    if (adminCheck.status === 403 || adminCheck.status === 401) { router.push('/catalog'); return }
    const { admin } = await adminCheck.json()
    setAdminClient(admin)

    const res = await fetch('/api/admin/stats')
    if (!res.ok) { setLoading(false); return }
    const { orders, clients, goals, rates: ratesData } = await res.json()
    setRates(ratesData)

    // Build per-client stats
    const goalMap = new Map((goals as any[]).map((g: any) => [g.client_id ?? 'global', g]))
    const global = goalMap.get('global')
    setGlobalGoal(global ? { target_usd: global.target_usd, label: global.label ?? '' } : null)

    let grandTotal = 0
    const clientStats: ClientStat[] = clients
      .filter((c: any) => !c.is_admin)
      .map((c: any) => {
        const clientOrders = orders.filter((o: any) => o.clients?.id === c.id)
        let totalNative = 0
        let totalUsd = 0
        for (const o of clientOrders) {
          if (c.currency === 'ARS') {
            totalNative += o.total_ars ?? 0
            totalUsd += (o.total_ars ?? 0) / ratesData.arsPerUsd
          } else if (c.currency === 'EUR') {
            totalNative += o.total_eur ?? 0
            totalUsd += (o.total_eur ?? 0) * ratesData.eurToUsd
          } else {
            totalNative += o.total_usd ?? 0
            totalUsd += o.total_usd ?? 0
          }
        }
        grandTotal += totalUsd
        const goal = goalMap.get(c.id)
        return {
          client: c,
          orderCount: clientOrders.length,
          totalNative,
          totalUsd,
          goal: goal ? { id: goal.id, target_usd: goal.target_usd, label: goal.label ?? '' } : null,
        }
      })

    setStats(clientStats)
    setTotalUsd(grandTotal)
    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveGoal(clientId: string | null) {
    const target = parseFloat(editValue)
    if (isNaN(target) || target < 0) { setEditingId(null); return }
    await fetch('/api/admin/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, target_usd: target, label: editLabel }),
    })
    setEditingId(null)
    fetchData()
  }

  function startEdit(id: string, current: number, label: string) {
    setEditingId(id)
    setEditValue(current > 0 ? current.toString() : '')
    setEditLabel(label)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-[#2D4535]/50 text-sm">Cargando...</div></div>
  }

  const globalTarget = globalGoal?.target_usd ?? 0
  const globalPct = globalTarget > 0 ? Math.min((totalUsd / globalTarget) * 100, 100) : 0

  return (
    <div className="min-h-screen">
      <NavBar client={adminClient} />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2D4535]">Facturación</h1>
          {rates && (
            <p className="text-xs text-[#2D4535]/40 mt-1">
              Tipo de cambio {rates.date} · 1 USD = ARS {rates.arsPerUsd.toFixed(0)} · 1 EUR = USD {rates.eurToUsd.toFixed(4)}
            </p>
          )}
        </div>

        {/* Global total card */}
        <div className="bg-[#2D4535] text-[#F0E8D8] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#F0E8D8]/60 text-sm mb-1">Total acumulado (todos los clientes)</p>
              <p className="text-4xl font-bold">{fmt(totalUsd)}</p>
              {globalGoal?.label && <p className="text-[#B8935A] text-sm mt-1">{globalGoal.label}</p>}
            </div>
            <DollarSign size={32} className="text-[#B8935A] opacity-60" />
          </div>

          {/* Global goal */}
          {globalTarget > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-[#F0E8D8]/70 mb-1">
                <span>Objetivo: {fmt(globalTarget)}</span>
                <span className={globalPct >= 100 ? 'text-green-400 font-semibold' : ''}>
                  {globalPct.toFixed(0)}% {globalPct >= 100 ? '🎉' : ''}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${globalPct >= 100 ? 'bg-green-400' : 'bg-[#B8935A]'}`}
                  style={{ width: `${globalPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Edit global goal */}
          <div className="mt-4">
            {editingId === 'global' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number" placeholder="Objetivo USD" value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm text-[#2D4535] bg-white w-36 focus:outline-none"
                />
                <input
                  type="text" placeholder="Etiqueta (ej: Meta Q2)" value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm text-[#2D4535] bg-white flex-1 min-w-0 focus:outline-none"
                />
                <button onClick={() => saveGoal(null)} className="p-1.5 rounded-lg bg-green-500 text-white"><Check size={14} /></button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-white/20 text-white"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => startEdit('global', globalTarget, globalGoal?.label ?? '')}
                className="flex items-center gap-1.5 text-xs text-[#F0E8D8]/60 hover:text-[#F0E8D8] transition-colors"
              >
                <Pencil size={12} />
                {globalTarget > 0 ? 'Editar objetivo global' : 'Fijar objetivo global'}
              </button>
            )}
          </div>
        </div>

        {/* Per-client cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map(s => {
            const pct = s.goal?.target_usd ? Math.min((s.totalUsd / s.goal.target_usd) * 100, 100) : 0
            const isEditing = editingId === s.client.id

            return (
              <div key={s.client.id} className="bg-white rounded-2xl border border-[#2D4535]/10 p-5">
                {/* Client header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#2D4535]">{s.client.name}</h3>
                    <p className="text-xs text-[#2D4535]/40">{s.client.currency}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[#2D4535]/40 text-xs">
                      <ShoppingBag size={12} />
                      {s.orderCount} {s.orderCount === 1 ? 'pedido' : 'pedidos'}
                    </div>
                  </div>
                </div>

                {/* Amounts */}
                <div className="mb-3">
                  <p className="text-2xl font-bold text-[#B8935A]">
                    {fmt(s.totalNative, s.client.currency)}
                  </p>
                  {s.client.currency !== 'USD' && (
                    <p className="text-xs text-[#2D4535]/50 mt-0.5">≈ {fmt(s.totalUsd)} USD</p>
                  )}
                </div>

                {/* Goal progress */}
                {s.goal?.target_usd ? (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-[#2D4535]/60 mb-1">
                      <span>Objetivo: {fmt(s.goal.target_usd)}</span>
                      <span className={pct >= 100 ? 'text-green-600 font-semibold' : ''}>
                        {pct.toFixed(0)}% {pct >= 100 ? '✓' : ''}
                      </span>
                    </div>
                    <ProgressBar value={s.totalUsd} max={s.goal.target_usd} />
                    {s.goal.label && <p className="text-xs text-[#2D4535]/40 mt-1">{s.goal.label}</p>}
                  </div>
                ) : (
                  <div className="mb-3 h-4" />
                )}

                {/* Edit goal */}
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <input
                      type="number" placeholder="Objetivo USD" value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-sm text-[#2D4535] border border-[#2D4535]/20 w-32 focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                    />
                    <input
                      type="text" placeholder="Etiqueta" value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-sm text-[#2D4535] border border-[#2D4535]/20 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                    />
                    <button onClick={() => saveGoal(s.client.id)} className="p-1.5 rounded-lg bg-green-500 text-white"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg border border-[#2D4535]/20 text-[#2D4535]"><X size={14} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(s.client.id, s.goal?.target_usd ?? 0, s.goal?.label ?? '')}
                    className="flex items-center gap-1 text-xs text-[#2D4535]/40 hover:text-[#2D4535] transition-colors mt-1"
                  >
                    <Pencil size={11} />
                    {s.goal?.target_usd ? 'Editar objetivo' : 'Fijar objetivo'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {stats.length === 0 && (
          <div className="text-center py-20 text-[#2D4535]/40 text-sm">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p>Todavía no hay pedidos confirmados</p>
          </div>
        )}
      </main>
    </div>
  )
}
