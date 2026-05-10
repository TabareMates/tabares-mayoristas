'use client'

import { useEffect, useState } from 'react'
import { Client } from '@/lib/types'
import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'
import { Save, Check } from 'lucide-react'

export default function ProfilePage() {
  const [client, setClient] = useState<Client | null>(null)
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

  return (
    <div className="min-h-screen">
      <NavBar client={client} />
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-[#2D4535] mb-2">Mi perfil</h1>
        <p className="text-sm text-[#2D4535]/60 mb-8">Cambiá tu contraseña de acceso al portal.</p>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-[#2D4535]/10 p-5 mb-6">
          <p className="text-xs text-[#2D4535]/50 mb-1">Nombre</p>
          <p className="text-sm font-medium text-[#2D4535]">{client?.name}</p>
          <p className="text-xs text-[#2D4535]/50 mt-3 mb-1">Email</p>
          <p className="text-sm text-[#2D4535]">{client?.email}</p>
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
