'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

const ISSUE_TYPES = [
  { value: 'defecto_fabricacion', label: 'Defecto de fabricación', emoji: '🔧' },
  { value: 'rajadura', label: 'Rajadura o rotura', emoji: '💔' },
  { value: 'filtrado', label: 'Filtrado / pérdida de agua', emoji: '💧' },
  { value: 'bombilla', label: 'Problema con la bombilla', emoji: '🥤' },
  { value: 'terminacion', label: 'Problema de terminación', emoji: '✨' },
  { value: 'otro', label: 'Otro', emoji: '❓' },
]

function ReclamoForm() {
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('reg')

  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  if (!registrationId) {
    return (
      <div className="text-center py-20">
        <p className="text-[#2D4535]/60 text-sm">Enlace inválido. <a href="/garantia" className="text-[#B8935A] underline">Empezar de nuevo</a></p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!issueType) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/warranty/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_id: registrationId,
        issue_type: issueType,
        description,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al enviar el reclamo. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#2D4535]/10 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-[#2D4535] mb-2">¡Reclamo enviado!</h2>
          <p className="text-sm text-[#2D4535]/60 leading-relaxed">
            Recibimos tu reclamo y lo revisamos en las próximas 48 horas hábiles.
            Te contactamos por email con la resolución.
          </p>
          <div className="mt-6 p-4 bg-[#F0E8D8] rounded-xl text-sm text-[#2D4535]/70">
            <p>¿Tenés dudas? Escribinos a</p>
            <a href="mailto:manuel@tabare.com.ar" className="text-[#B8935A] font-medium">manuel@tabare.com.ar</a>
            <span className="mx-2">·</span>
            <a href="https://wa.me/5491166407189" className="text-[#25D366] font-medium">WhatsApp</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2D4535]/10 mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#2D4535]">Detalle del reclamo</h1>
        <p className="text-sm text-[#2D4535]/60 mt-2">
          Contanos qué pasó con tu producto Tabaré Mates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-[#2D4535]/10 space-y-5">
        <div>
          <label className="text-xs font-medium text-[#2D4535]/60 block mb-2">¿Qué problema tiene el producto? *</label>
          <div className="grid grid-cols-2 gap-2">
            {ISSUE_TYPES.map(it => (
              <button
                key={it.value}
                type="button"
                onClick={() => setIssueType(it.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-colors text-left ${
                  issueType === it.value
                    ? 'bg-[#2D4535] text-[#F0E8D8] border-[#2D4535]'
                    : 'bg-white text-[#2D4535]/70 border-[#2D4535]/15 hover:border-[#2D4535]/30'
                }`}
              >
                <span>{it.emoji}</span>
                {it.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">
            Descripción del problema *
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describí con detalle qué pasó, cuándo empezó y cómo usás el producto..."
            className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30 resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <a
            href="/garantia"
            className="px-4 py-3 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535]/60 hover:text-[#2D4535] transition-colors"
          >
            ← Atrás
          </a>
          <button
            type="submit"
            disabled={loading || !issueType || !description}
            className="flex-1 py-3 rounded-xl bg-[#2D4535] text-[#F0E8D8] font-medium hover:bg-[#3d5c47] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar reclamo'}
          </button>
        </div>

        <p className="text-xs text-center text-[#2D4535]/40">
          Paso 2 de 2 · Detalle del problema
        </p>
      </form>
    </div>
  )
}

export default function ReclamoPage() {
  return (
    <div className="min-h-screen bg-[#F0E8D8] flex flex-col">
      <div className="bg-[#2D4535] px-6 py-4 flex justify-center">
        <Image src="/logo-tabare.png" alt="Tabaré Mates" width={110} height={34} className="brightness-0 invert" />
      </div>
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <Suspense fallback={<div className="text-[#2D4535]/40 text-sm">Cargando...</div>}>
          <ReclamoForm />
        </Suspense>
      </div>
    </div>
  )
}
