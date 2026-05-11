'use client'

import { useEffect, useState, useCallback } from 'react'
import { Client } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ChevronDown, ChevronUp, Save, CheckCircle } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  en_revision: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  en_revision: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const ISSUE_LABELS: Record<string, string> = {
  defecto_fabricacion: 'Defecto de fabricación',
  rajadura: 'Rajadura o rotura',
  filtrado: 'Filtrado',
  bombilla: 'Bombilla',
  terminacion: 'Terminación',
  otro: 'Otro',
}

const CREDIT_STATUS: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-green-100 text-green-700' },
  applied: { label: 'Aplicado', color: 'bg-[#2D4535]/10 text-[#2D4535]/50' },
}

export default function GarantiasPage() {
  const [adminClient, setAdminClient] = useState<Client | null>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [credits, setCredits] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [tab, setTab] = useState<'reclamos' | 'creditos'>('reclamos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [clientFilter, setClientFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<Record<string, string>>({})
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editClient, setEditClient] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [applyingCredit, setApplyingCredit] = useState<string | null>(null)
  const router = useRouter()

  const fetchClaims = useCallback(async (status: string) => {
    const url = status === 'todos' ? '/api/admin/warranty' : `/api/admin/warranty?status=${status}`
    const res = await fetch(url)
    const { claims: data } = await res.json()
    setClaims(data ?? [])
  }, [])

  const fetchCredits = useCallback(async (clientId: string) => {
    const url = clientId ? `/api/admin/warranty/credits?client_id=${clientId}` : '/api/admin/warranty/credits'
    const res = await fetch(url)
    const { credits: data } = await res.json()
    setCredits(data ?? [])
  }, [])

  useEffect(() => {
    async function init() {
      const adminCheck = await fetch('/api/admin/orders')
      if (adminCheck.status === 403 || adminCheck.status === 401) { router.push('/catalog'); return }
      const { admin } = await adminCheck.json()
      setAdminClient(admin)
      const clRes = await fetch('/api/admin/clients')
      const { clients: cls } = await clRes.json()
      setClients((cls ?? []).filter((c: Client) => !c.is_admin))
      await Promise.all([fetchClaims('todos'), fetchCredits('')])
      setLoading(false)
    }
    init()
  }, [router, fetchClaims, fetchCredits])

  async function saveClaim(claimId: string) {
    setSaving(claimId)
    await fetch('/api/admin/warranty', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: claimId,
        status: editStatus[claimId],
        internal_notes: editNotes[claimId],
        client_id: editClient[claimId] || null,
      }),
    })
    await Promise.all([fetchClaims(statusFilter), fetchCredits(clientFilter)])
    setSaving(null)
    setExpandedId(null)
  }

  async function markCreditApplied(creditId: string) {
    setApplyingCredit(creditId)
    await fetch('/api/admin/warranty/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: creditId, status: 'applied' }),
    })
    await fetchCredits(clientFilter)
    setApplyingCredit(null)
  }

  // Derived
  const thisMonth = claims.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length
  const issueCount: Record<string, number> = {}
  claims.forEach(c => { issueCount[c.issue_type] = (issueCount[c.issue_type] || 0) + 1 })
  const topIssue = Object.entries(issueCount).sort((a, b) => b[1] - a[1])[0]?.[0]

  const availableCredits = credits.filter(c => c.status === 'available')
  const totalUnitsAvailable = availableCredits.reduce((sum, c) => sum + c.units, 0)

  // Credits grouped by client for summary
  const creditsByClient: Record<string, { name: string; units: number }> = {}
  availableCredits.forEach(c => {
    const clientName = c.clients?.name ?? 'Sin asignar'
    const clientId = c.client_id ?? 'none'
    if (!creditsByClient[clientId]) creditsByClient[clientId] = { name: clientName, units: 0 }
    creditsByClient[clientId].units += c.units
  })

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-[#2D4535]/50 text-sm">Cargando...</div></div>

  return (
    <div className="min-h-screen">
      <NavBar client={adminClient} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck size={28} className="text-[#2D4535]" />
          <h1 className="text-2xl font-semibold text-[#2D4535]">Garantías</h1>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total reclamos', value: claims.length },
            { label: 'Este mes', value: thisMonth },
            { label: 'Tipo más frecuente', value: topIssue ? (ISSUE_LABELS[topIssue] ?? topIssue) : '—' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-2xl border border-[#2D4535]/10 p-4 text-center">
              <p className="text-2xl font-bold text-[#2D4535]">{m.value}</p>
              <p className="text-xs text-[#2D4535]/50 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#2D4535]/5 rounded-xl p-1 mb-5 w-fit">
          {(['reclamos', 'creditos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-[#2D4535] shadow-sm' : 'text-[#2D4535]/50 hover:text-[#2D4535]'}`}
            >
              {t === 'reclamos' ? 'Reclamos' : `Créditos${totalUnitsAvailable > 0 ? ` (${totalUnitsAvailable})` : ''}`}
            </button>
          ))}
        </div>

        {/* ── RECLAMOS TAB ── */}
        {tab === 'reclamos' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); fetchClaims(e.target.value) }}
                className="px-3 py-2 rounded-xl border border-[#2D4535]/20 text-sm text-[#2D4535] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
              >
                <option value="todos">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="en_revision">En revisión</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>

            {claims.length === 0 ? (
              <div className="text-center py-20 text-[#2D4535]/40">
                <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Todavía no hay reclamos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.map(claim => {
                  const reg = claim.warranty_registrations
                  const isExpanded = expandedId === claim.id
                  const photos = [claim.photo_1, claim.photo_2, claim.photo_3].filter(Boolean)
                  return (
                    <div key={claim.id} className="bg-white rounded-2xl border border-[#2D4535]/10 overflow-hidden">
                      <button
                        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#2D4535]/5 transition-colors"
                        onClick={() => {
                          setExpandedId(isExpanded ? null : claim.id)
                          if (!isExpanded) {
                            setEditStatus(p => ({ ...p, [claim.id]: claim.status }))
                            setEditNotes(p => ({ ...p, [claim.id]: claim.internal_notes ?? '' }))
                            setEditClient(p => ({ ...p, [claim.id]: '' }))
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[claim.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABELS[claim.status] ?? claim.status}
                            </span>
                            <span className="text-xs text-[#2D4535]/50">{ISSUE_LABELS[claim.issue_type] ?? claim.issue_type}</span>
                            <span className="text-xs text-[#2D4535]/40">{reg?.country}</span>
                            {reg?.store_name && <span className="text-xs text-[#2D4535]/40">· {reg.store_name}</span>}
                          </div>
                          <p className="text-xs text-[#2D4535]/40 mt-1">
                            {reg?.customer_name} · {new Date(claim.created_at).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-[#2D4535]/40 shrink-0" /> : <ChevronDown size={16} className="text-[#2D4535]/40 shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#2D4535]/10 px-5 py-4 bg-[#F0E8D8]/30 space-y-4">
                          <div>
                            <p className="text-xs text-[#2D4535]/50 mb-1">Descripción</p>
                            <p className="text-sm text-[#2D4535]">{claim.description}</p>
                          </div>
                          {reg && (
                            <div className="text-xs text-[#2D4535]/60 space-y-0.5">
                              <p><span className="font-medium">Cliente:</span> {reg.customer_name} ({reg.customer_email})</p>
                              <p><span className="font-medium">País:</span> {reg.country} · <span className="font-medium">Canal:</span> {reg.channel}</p>
                              {reg.store_name && <p><span className="font-medium">Local:</span> {reg.store_name}</p>}
                              <p><span className="font-medium">Compra:</span> {reg.purchase_date} · <span className="font-medium">Vence:</span> {reg.warranty_expires}</p>
                            </div>
                          )}
                          {photos.length > 0 && (
                            <div>
                              <p className="text-xs text-[#2D4535]/50 mb-2">Fotos</p>
                              <div className="flex gap-2 flex-wrap">
                                {photos.map((url: string, i: number) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt={`Foto ${i+1}`} className="w-20 h-20 object-cover rounded-lg border border-[#2D4535]/10 hover:opacity-80 transition-opacity" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-[#2D4535]/60 block mb-1">Estado</label>
                              <select
                                value={editStatus[claim.id] ?? claim.status}
                                onChange={e => setEditStatus(p => ({ ...p, [claim.id]: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl border border-[#2D4535]/20 text-sm text-[#2D4535] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                              >
                                <option value="pending">Pendiente</option>
                                <option value="en_revision">En revisión</option>
                                <option value="approved">Aprobado</option>
                                <option value="rejected">Rechazado</option>
                              </select>
                            </div>
                            {editStatus[claim.id] === 'approved' && (
                              <div>
                                <label className="text-xs text-[#2D4535]/60 block mb-1">Asignar crédito a mayorista</label>
                                <select
                                  value={editClient[claim.id] ?? ''}
                                  onChange={e => setEditClient(p => ({ ...p, [claim.id]: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-xl border border-[#2D4535]/20 text-sm text-[#2D4535] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                                >
                                  <option value="">Sin asignar</option>
                                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-[#2D4535]/60 block mb-1">Notas internas</label>
                            <textarea
                              rows={2}
                              value={editNotes[claim.id] ?? ''}
                              onChange={e => setEditNotes(p => ({ ...p, [claim.id]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] resize-none"
                              placeholder="Notas internas..."
                            />
                          </div>
                          <button
                            onClick={() => saveClaim(claim.id)}
                            disabled={saving === claim.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-sm hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
                          >
                            <Save size={14} /> {saving === claim.id ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── CRÉDITOS TAB ── */}
        {tab === 'creditos' && (
          <>
            {/* Summary by client */}
            {Object.keys(creditsByClient).length > 0 && (
              <div className="bg-[#2D4535]/5 rounded-2xl p-4 mb-4">
                <p className="text-xs font-semibold text-[#2D4535] mb-2 uppercase tracking-wide">Créditos disponibles por mayorista</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(creditsByClient).map(([id, { name, units }]) => (
                    <button
                      key={id}
                      onClick={() => {
                        const newFilter = clientFilter === id ? '' : id
                        setClientFilter(newFilter)
                        fetchCredits(newFilter)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        clientFilter === id
                          ? 'bg-[#2D4535] text-[#F0E8D8] border-[#2D4535]'
                          : 'bg-white text-[#2D4535] border-[#2D4535]/20 hover:border-[#2D4535]/40'
                      }`}
                    >
                      {name} · {units} unidad{units !== 1 ? 'es' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter row */}
            <div className="flex items-center gap-3 mb-4">
              <select
                value={clientFilter}
                onChange={e => { setClientFilter(e.target.value); fetchCredits(e.target.value) }}
                className="px-3 py-2 rounded-xl border border-[#2D4535]/20 text-sm text-[#2D4535] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
              >
                <option value="">Todos los clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {clientFilter && (
                <button onClick={() => { setClientFilter(''); fetchCredits('') }} className="text-xs text-[#2D4535]/50 hover:text-[#2D4535]">
                  Limpiar filtro ×
                </button>
              )}
            </div>

            {credits.length === 0 ? (
              <div className="text-center py-20 text-[#2D4535]/40">
                <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay créditos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {credits.map(credit => {
                  const reg = credit.warranty_claims?.warranty_registrations
                  const claim = credit.warranty_claims
                  const statusInfo = CREDIT_STATUS[credit.status] ?? { label: credit.status, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={credit.id} className="bg-white rounded-2xl border border-[#2D4535]/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs font-medium text-[#2D4535]">
                              {credit.units} unidad{credit.units !== 1 ? 'es' : ''}
                            </span>
                            {credit.clients && (
                              <span className="text-xs text-[#2D4535]/60 bg-[#2D4535]/5 px-2 py-0.5 rounded-full">
                                {credit.clients.name}
                              </span>
                            )}
                          </div>
                          {claim && (
                            <p className="text-xs text-[#2D4535]/60">
                              {ISSUE_LABELS[claim.issue_type] ?? claim.issue_type}
                              {reg?.store_name && ` · ${reg.store_name}`}
                              {reg?.country && ` · ${reg.country}`}
                            </p>
                          )}
                          {reg && (
                            <p className="text-xs text-[#2D4535]/40 mt-0.5">
                              Cliente final: {reg.customer_name} · Compra: {new Date(reg.purchase_date + 'T12:00:00').toLocaleDateString('es-AR')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-xs text-[#2D4535]/40">
                            {new Date(credit.created_at).toLocaleDateString('es-AR')}
                          </p>
                          {credit.status === 'available' && (
                            <button
                              onClick={() => markCreditApplied(credit.id)}
                              disabled={applyingCredit === credit.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-xs font-medium hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle size={12} />
                              {applyingCredit === credit.id ? 'Aplicando...' : 'Marcar aplicado'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
