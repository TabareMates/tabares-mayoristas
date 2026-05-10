'use client'

import { useEffect, useState, useCallback } from 'react'
import { Client } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import { Save, Upload, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = ['mates', 'materas', 'bombillas', 'yerbas', 'yerberos', 'termos', 'extras']

export default function PreciosPage() {
  const [adminClient, setAdminClient] = useState<Client | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [discounts, setDiscounts] = useState<any[]>([])
  const [pendingPrices, setPendingPrices] = useState<Record<string, string>>({})
  const [pendingDiscounts, setPendingDiscounts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [recalcMsg, setRecalcMsg] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)
  const [savingRow, setSavingRow] = useState<string | null>(null)
  const [savingDiscount, setSavingDiscount] = useState<string | null>(null)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const adminCheck = await fetch('/api/admin/orders')
    if (adminCheck.status === 403 || adminCheck.status === 401) { router.push('/catalog'); return }
    const { admin } = await adminCheck.json()
    setAdminClient(admin)

    const [prRes, clRes, discRes] = await Promise.all([
      fetch('/api/admin/base-prices'),
      fetch('/api/admin/clients'),
      fetch('/api/admin/discounts'),
    ])
    const { products: prods } = await prRes.json()
    const { clients: cls } = await clRes.json()
    const { discounts: discs } = await discRes.json()
    setProducts(prods ?? [])
    setClients((cls ?? []).filter((c: Client) => !c.is_admin))
    setDiscounts(discs ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  function getDiscount(clientId: string, category: string) {
    const key = `${clientId}__${category}`
    if (key in pendingDiscounts) return pendingDiscounts[key]
    const d = discounts.find((x: any) => x.client_id === clientId && x.category === category)
    return d?.discount_pct?.toString() ?? ''
  }

  async function saveRow(product: any) {
    setSavingRow(product.id)
    const fields: Record<string, any> = { id: product.id }
    const numFields = ['base_price_usd','base_price_ars','base_price_eur','pvp_ars','pvp_eur','pvp_usd','category']
    for (const f of numFields) {
      const key = `${product.id}__${f}`
      if (key in pendingPrices) {
        fields[f] = f === 'category' ? pendingPrices[key] : (parseFloat(pendingPrices[key]) || null)
      }
    }
    await fetch('/api/admin/base-prices', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) })
    setPendingPrices(prev => {
      const next = { ...prev }
      for (const f of numFields) delete next[`${product.id}__${f}`]
      return next
    })
    setSavingRow(null)
  }

  async function handleRecalculate() {
    setRecalcMsg('Calculando...')
    const res = await fetch('/api/admin/base-prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'recalculate' }) })
    const { updated } = await res.json()
    setRecalcMsg(`✓ ${updated} precios actualizados`)
    setTimeout(() => setRecalcMsg(''), 4000)
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',')
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? '']))
    })
    await fetch('/api/admin/base-prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import_csv', rows }) })
    fetchData()
  }

  async function saveDiscounts(clientId: string) {
    setSavingDiscount(clientId)
    for (const cat of CATEGORIES) {
      const key = `${clientId}__${cat}`
      if (key in pendingDiscounts) {
        await fetch('/api/admin/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, category: cat, discount_pct: parseFloat(pendingDiscounts[key]) || 0 }),
        })
      }
    }
    setPendingDiscounts(prev => {
      const next = { ...prev }
      for (const cat of CATEGORIES) delete next[`${clientId}__${cat}`]
      return next
    })
    fetchData()
    setSavingDiscount(null)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-[#2D4535]/50 text-sm">Cargando...</div></div>

  return (
    <div className="min-h-screen">
      <NavBar client={adminClient} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#2D4535] mb-8">Precios y Descuentos</h1>

        {/* Section 1: Base prices */}
        <div className="bg-white rounded-2xl border border-[#2D4535]/10 p-6 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-medium text-[#2D4535]">Precios Base</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {recalcMsg && <span className="text-sm text-green-600">{recalcMsg}</span>}
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#2D4535]/20 text-sm text-[#2D4535] cursor-pointer hover:bg-[#2D4535]/5 transition-colors">
                <Upload size={14} /> Importar CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              </label>
              <button onClick={handleRecalculate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#B8935A] text-white text-sm hover:bg-[#a07a48] transition-colors">
                <RefreshCw size={14} /> Recalcular todos los precios
              </button>
            </div>
          </div>
          <p className="text-xs text-[#2D4535]/50 mb-4">CSV esperado: code, base_price_usd, base_price_ars, base_price_eur</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#2D4535]/50 border-b border-[#2D4535]/10">
                  <th className="text-left py-2 pr-3 font-medium">Producto</th>
                  <th className="text-left py-2 pr-3 font-medium w-20">Código</th>
                  <th className="text-right py-2 px-2 font-medium w-24">USD Base</th>
                  <th className="text-right py-2 px-2 font-medium w-24">ARS Base</th>
                  <th className="text-right py-2 px-2 font-medium w-24">EUR Base</th>
                  <th className="text-right py-2 px-2 font-medium w-24">PVP ARS</th>
                  <th className="text-right py-2 px-2 font-medium w-24">PVP EUR</th>
                  <th className="text-right py-2 px-2 font-medium w-24">PVP USD</th>
                  <th className="text-left py-2 px-2 font-medium w-28">Categoría</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const numFields = ['base_price_usd','base_price_ars','base_price_eur','pvp_ars','pvp_eur','pvp_usd']
                  return (
                    <tr key={p.id} className="border-b border-[#2D4535]/5 hover:bg-[#F0E8D8]/30">
                      <td className="py-2 pr-3 font-medium text-[#2D4535]">{p.name}</td>
                      <td className="py-2 pr-3 font-mono text-[#2D4535]/40 text-xs">{p.code}</td>
                      {numFields.map(f => (
                        <td key={f} className="py-1 px-2">
                          <input
                            type="number" step="0.01" placeholder="—"
                            value={`${p.id}__${f}` in pendingPrices ? pendingPrices[`${p.id}__${f}`] : (p[f] ?? '')}
                            onChange={e => setPendingPrices(prev => ({ ...prev, [`${p.id}__${f}`]: e.target.value }))}
                            className="w-full text-right px-2 py-1 rounded-lg border border-[#2D4535]/10 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                          />
                        </td>
                      ))}
                      <td className="py-1 px-2">
                        <select
                          value={`${p.id}__category` in pendingPrices ? pendingPrices[`${p.id}__category`] : (p.category ?? 'extras')}
                          onChange={e => setPendingPrices(prev => ({ ...prev, [`${p.id}__category`]: e.target.value }))}
                          className="w-full px-2 py-1 rounded-lg border border-[#2D4535]/10 text-sm text-[#2D4535] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="py-1 px-2">
                        <button onClick={() => saveRow(p)} disabled={savingRow === p.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2D4535] text-[#F0E8D8] text-xs hover:bg-[#3d5c47] disabled:opacity-50 transition-colors">
                          <Save size={11} /> {savingRow === p.id ? '...' : 'Guardar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Discounts per client */}
        <div className="bg-white rounded-2xl border border-[#2D4535]/10 p-6">
          <h2 className="text-lg font-medium text-[#2D4535] mb-4">Descuentos por Cliente</h2>
          <div className="space-y-3">
            {clients.map(client => {
              const isExpanded = expandedClient === client.id
              return (
                <div key={client.id} className="border border-[#2D4535]/10 rounded-xl overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F0E8D8]/30 transition-colors"
                    onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                  >
                    <div>
                      <span className="font-medium text-[#2D4535]">{client.name}</span>
                      <span className="text-xs text-[#2D4535]/40 ml-2">{client.currency}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-[#2D4535]/40" /> : <ChevronDown size={16} className="text-[#2D4535]/40" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#2D4535]/10 p-4 bg-[#F0E8D8]/20">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {CATEGORIES.map(cat => (
                          <div key={cat}>
                            <label className="text-xs text-[#2D4535]/60 block mb-1 capitalize">{cat}</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number" min="0" max="100" step="0.5" placeholder="0"
                                value={getDiscount(client.id, cat)}
                                onChange={e => setPendingDiscounts(prev => ({ ...prev, [`${client.id}__${cat}`]: e.target.value }))}
                                className="w-full px-2 py-1.5 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                              />
                              <span className="text-xs text-[#2D4535]/40">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => saveDiscounts(client.id)} disabled={savingDiscount === client.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D4535] text-[#F0E8D8] text-xs hover:bg-[#3d5c47] disabled:opacity-50 transition-colors">
                        <Save size={12} /> {savingDiscount === client.id ? 'Guardando...' : 'Guardar descuentos'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
