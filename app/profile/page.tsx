'use client'

import { useEffect, useState } from 'react'
import { Client } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import { Save, Check, ShieldCheck } from 'lucide-react'

const ISSUE_LABELS: Record<string, string> = {
  defecto_fabricacion: 'Defecto de fabricación',
  rajadura: 'Rajadura o rotura',
  filtrado: 'Filtrado',
  bombilla: 'Problema con bombilla',
  terminacion: 'Problema de terminación',
  otro: 'Otro',
}

const CREDIT_STATUS: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-green-100 text-green-700' },
  applied: { label: 'Aplicado', color: 'bg-[#2D4535]/10 text-[#2D4535]/60' },
}

interface WarrantyCredit {
  id: string
  created_at: string
  units: number
  status: string
  warranty_claims: {
    issue_type: string
    description: string
    warranty_registrations: {
      customer_name: string
      store_name: string | null
      purchase_date: string
    }
  } | null
}

export default function ProfilePage() {
  const [client, setClient] = useState<Client | null>(null)
  const [credits, setCredits] = useState<WarrantyCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/me')
      if (res.status === 401) { router.push('/'); return }
      const { client: me } = await res.json()
      if (me?.is_admin) { router.push('/admin'); return }
      setClient(me)

      const cRes = await fetch('/api/warranty/credits')
      if (cRes.ok) {
        const { credits: data } = await cRes.json()
        setCredits(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave() {
    setError('')
    setSuccess(false)
    if (!password) { setError('Ingresá una contraseña.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Error al guardar.'); setSaving(false); return }
    setSuccess(true)
    setPassword('')
    setConfirmPassword('')
    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-[#2D4535]/50 text-sm">Cargando...</div></div>
  }

  const availableCredits = credits.filter(c => c.status === 'available')

  return (
    <div className="min-h-screen">
      <NavBar client={client} />
      <main className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D4535] mb-1">Mi perfil</h1>
          <p className="text-sm text-[#2D4535]/60">Administrá tu cuenta y tus créditos de garantía.</p>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-[#2D4535]/10 p-5">
          <p className="text-xs text-[#2D4535]/50 mb-1">Nombre</p>
          <p className="text-sm font-medium text-[#2D4535]">{client?.name}</p>
          <p className="text-xs text-[#2D4535]/50 mt-3 mb-1">Email</p>
          <p className="text-sm text-[#2D4535]">{client?.email}</p>
        </div>

        {/* Warranty credits */}
        <div className="bg-white rounded-2xl border border-[#2D4535]/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-[#2D4535]" />
            <h2 className="text-sm font-medium text-[#2D4535]">Créditos de garantía</h2>
            {availableCredits.length > 0 && (
              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                {availableCredits.reduce((sum, c) => sum + c.units, 0)} disponible{availableCredits.reduce((sum, c) => sum + c.units, 0) !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {credits.length === 0 ? (
            <p className="text-sm text-[#2D4535]/40 text-center py-4">
              No tenés créditos de garantía registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {credits.map(credit => {
                const reg = credit.warranty_claims?.warranty_registrations
                const claim = credit.warranty_claims
                const statusInfo = CREDIT_STATUS[credit.status] ?? { label: credit.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={credit.id} className="rounded-xl border border-[#2D4535]/10 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs font-medium text-[#2D4535]">
                            {credit.units} unidad{credit.units !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        {claim && (
                          <p className="text-xs text-[#2D4535]/60 mt-1">
                            {ISSUE_LABELS[claim.issue_type] ?? claim.issue_type}
                            {reg?.store_name && ` · ${reg.store_name}`}
                          </p>
                        )}
                        {reg && (
                          <p className="text-xs text-[#2D4535]/40 mt-0.5">
                            Cliente: {reg.customer_name} · Compra: {new Date(reg.purchase_date).toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[#2D4535]/40 shrink-0">
                        {new Date(credit.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    {credit.status === 'available' && (
                      <p className="text-xs text-[#B8935A] mt-2">
                        💬 Mencionalo en tu próximo pedido para aplicar el crédito.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-[#2D4535]/10 p-5 space-y-4">
          <h2 className="text-sm font-medium text-[#2D4535]">Cambiar contraseña</h2>
          <div>
            <label className="text-xs text-[#2D4535]/60 block mb-1">Nueva contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
            />
          </div>
          <div>
            <label className="text-xs text-[#2D4535]/60 block mb-1">Confirmar contraseña</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repetí la contraseña"
              className="w-full px-3 py-2 rounded-lg border border-[#2D4535]/20 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check size={16} /> Contraseña actualizada correctamente.
            </div>
          )}
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D4535] text-[#F0E8D8] text-sm hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {saving ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </div>
      </main>
    </div>
  )
}
