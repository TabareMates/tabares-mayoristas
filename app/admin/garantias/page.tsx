'use client'

import { useEffect, useState, useCallback } from 'react'
import { Client } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ChevronDown, ChevronUp, Save } from 'lucide-react'

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
  leak: 'Filtra',
  puncture: 'Pinchado',
  aesthetic: 'Estético',
  other: 'Otro',
}

export default function GarantiasPage() {
  const [adminClient, setAdminClient] = useState<Client | null>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [statusFilter, setStatusFilter] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<Record<string, string>>({})
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editClient, setEditClient] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const router = useRouter()

  const fetchClaims = useCallback(async (status: string) => {
    const url = status === 'todos' ? '/api/admin/warranty' : `/api/admin/warranty?status=${status}`
    const res = await fetch(url)
    const { claims: data } = await res.json()
    setClaims(data ?? [])
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
      await fetchClaims('todos')
      setLoading(false)
    }
    init()
  }, [router, fetchClaims])

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
    await fetchClaims(statusFilter)
    setSaving(null)
    setExpandedId(null)
  }

  const thisMonth = claims.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length
  const issueCount: Record<string, number> = {}
  claims.forEach(c => { issueCount[c.issue_type] = (issueCount[c.issue_type] || 0) + 1 })
  const topIssue = Object.entries(issueCount).sort((a, b) => b[1] - a[1])[0]?.[0]

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

        {/* Filters */}
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

        {/* Claims list */}
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
                          <p><span className="font-medium">País:</span> {reg.country} · <span className="font-medium">Canal:</span> {reg.channel === 'wholesale' ? 'Mayorista' : 'Argentina'}</p>
                          {reg.store_name && <p><span className="font-medium">Local:</span> {reg.store_name}</p>}
                          <p><span className="font-medium">Compra:</span> {reg.purchase_date} · <span className="font-medium">Vence:</span> {reg.warranty_expires}</p>
                        </div>
                      )}
                      {claim.photos?.length > 0 && (
                        <div>
                          <p className="text-xs text-[#2D4535]/50 mb-1">Fotos</p>
                          <div className="flex gap-2 flex-wrap">
                            {claim.photos.map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#B8935A] underline">Foto {i+1}</a>
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
      </main>
    </div>
  )
}
