'use client'

import { useState } from 'react'
import Image from 'next/image'

const COUNTRIES = [
  'Argentina', 'España', 'México', 'Uruguay', 'Chile', 'Colombia',
  'Perú', 'Bolivia', 'Paraguay', 'Brasil', 'Venezuela', 'Ecuador',
  'Estados Unidos', 'Canadá', 'Otro',
]

const CHANNELS = [
  { value: 'local', label: 'Local físico' },
  { value: 'online', label: 'Tienda online' },
  { value: 'otro', label: 'Otro' },
]

export default function GarantiaPage() {
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    country: '',
    channel: '',
    store_name: '',
    purchase_date: '',
    product_description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/warranty/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al registrar. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F0E8D8] flex flex-col">
      {/* Header */}
      <div className="bg-[#2D4535] px-6 py-4 flex justify-center">
        <Image src="/logo-tabare.png" alt="Tabaré Mates" width={110} height={34} className="brightness-0 invert" />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {success ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#2D4535]/10 text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <h2 className="text-xl font-semibold text-[#2D4535] mb-2">¡Garantía activada!</h2>
              <p className="text-sm text-[#2D4535]/70 leading-relaxed">
                Tu garantía queda registrada por 1 año desde la fecha de compra. Si en el futuro necesitás hacer un reclamo, ingresá a <strong>tabares-mayoristas.vercel.app/garantia/reclamo</strong>.
              </p>
              <div className="mt-6 p-4 bg-[#F0E8D8] rounded-xl text-sm text-[#2D4535]/70">
                <p>¿Tenés dudas? Escribinos a</p>
                <a href="mailto:manuel@tabare.com.ar" className="text-[#B8935A] font-medium">manuel@tabare.com.ar</a>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2D4535]/10 mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h1 className="text-2xl font-semibold text-[#2D4535]">Garantía Tabaré Mates</h1>
                <p className="text-sm text-[#2D4535]/60 mt-2">
                  Registrá tu compra para activar tu garantía. <br />
                  La garantía cubre 1 año desde la fecha de compra.
                </p>

                {/* ADEEI hook */}
                <div className="mt-4 mx-auto max-w-sm bg-[#2D4535]/5 rounded-xl px-4 py-3 text-xs text-[#2D4535]/70 leading-relaxed">
                  <p className="font-semibold text-[#2D4535] mb-1">¿Sabías que?</p>
                  <p>Nuestra producción se realiza junto a las ONGs <strong>ADEEI</strong> y <strong>Punto de Encuentro</strong>, impulsando la inclusión laboral a través del trabajo.</p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <a href="https://www.adeei.org.ar/%C3%A1reas/%C3%A1rea-laboral" target="_blank" rel="noopener noreferrer" className="text-[#B8935A] hover:underline font-medium">Conocer ADEEI →</a>
                    <a href="https://puntodeencuentro.org.ar/" target="_blank" rel="noopener noreferrer" className="text-[#B8935A] hover:underline font-medium">Conocer Punto de Encuentro →</a>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-[#2D4535]/10 space-y-4">
                <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide">Tus datos</h2>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">Nombre completo *</label>
                  <input
                    required
                    type="text"
                    value={form.customer_name}
                    onChange={e => set('customer_name', e.target.value)}
                    placeholder="Ej: Ana García"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.customer_email}
                    onChange={e => set('customer_email', e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">País *</label>
                  <select
                    required
                    value={form.country}
                    onChange={e => set('country', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] bg-white"
                  >
                    <option value="">Seleccioná tu país</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="border-t border-[#2D4535]/10 pt-4">
                  <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide mb-4">Datos de compra</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">¿Dónde compraste? *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CHANNELS.map(ch => (
                          <button
                            key={ch.value}
                            type="button"
                            onClick={() => set('channel', ch.value)}
                            className={`px-3 py-2.5 rounded-xl text-sm border transition-colors text-left ${
                              form.channel === ch.value
                                ? 'bg-[#2D4535] text-[#F0E8D8] border-[#2D4535]'
                                : 'bg-white text-[#2D4535]/70 border-[#2D4535]/15 hover:border-[#2D4535]/30'
                            }`}
                          >
                            {ch.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">
                        Nombre del local o tienda <span className="text-[#2D4535]/40">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.store_name}
                        onChange={e => set('store_name', e.target.value)}
                        placeholder="Ej: Mate & Cía, Valencia"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">Fecha de compra *</label>
                      <input
                        required
                        type="date"
                        value={form.purchase_date}
                        onChange={e => set('purchase_date', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">¿Qué producto compraste? *</label>
                      <textarea
                        required
                        rows={3}
                        value={form.product_description}
                        onChange={e => set('product_description', e.target.value)}
                        placeholder="Ej: Mate de calabaza natural con virola de alpaca, talla M"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !form.channel}
                  className="w-full py-3 rounded-xl bg-[#2D4535] text-[#F0E8D8] font-medium hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Registrando...' : 'Activar garantía'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
