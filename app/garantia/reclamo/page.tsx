'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { t, Lang } from '../translations'

const COUNTRIES = [
  'Argentina', 'España', 'México', 'Uruguay', 'Chile', 'Colombia',
  'Perú', 'Bolivia', 'Paraguay', 'Brasil', 'Venezuela', 'Ecuador',
  'Australia', 'United Kingdom', 'United States', 'Canada',
  'Portugal', 'Italy', 'France', 'Germany', 'Otro / Other',
]

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex gap-1 bg-white/20 rounded-lg p-0.5">
      {(['es', 'en'] as Lang[]).map(l => (
        <button key={l} onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
            lang === l ? 'bg-white text-[#2D4535]' : 'text-white/70 hover:text-white'
          }`}>
          {l === 'es' ? 'ES' : 'EN'}
        </button>
      ))}
    </div>
  )
}

function ReclamoForm() {
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<Lang>('es')

  useEffect(() => {
    const paramLang = searchParams.get('lang')
    if (paramLang === 'en' || paramLang === 'es') {
      setLang(paramLang)
    } else {
      // Auto-detect from browser language
      const browserLang = navigator.language || ''
      if (browserLang.startsWith('en')) setLang('en')
      // else default stays 'es'
    }
  }, [searchParams])

  const tx = t[lang]

  const CHANNELS = [
    { value: 'local', label: tx.channel_local },
    { value: 'online', label: tx.channel_online },
    { value: 'otro', label: tx.channel_other },
  ]

  const ISSUE_TYPES = [
    { value: 'defecto_fabricacion', label: tx.issue_defecto, emoji: '🔧' },
    { value: 'rajadura', label: tx.issue_rajadura, emoji: '💔' },
    { value: 'filtrado', label: tx.issue_filtrado, emoji: '💧' },
    { value: 'bombilla', label: tx.issue_bombilla, emoji: '🥤' },
    { value: 'terminacion', label: tx.issue_terminacion, emoji: '✨' },
    { value: 'otro', label: tx.issue_otro, emoji: '❓' },
  ]

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    country: '',
    channel: '',
    store_name: '',
    product_description: '',
    issue_type: '',
    description: '',
  })
  const [photos, setPhotos] = useState<{ photo1: File | null; photo2: File | null; photo3: File | null }>({
    photo1: null, photo2: null, photo3: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setPhoto(key: 'photo1' | 'photo2' | 'photo3', file: File | null) {
    setPhotos(prev => ({ ...prev, [key]: file }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.issue_type) return
    if (!photos.photo1 || !photos.photo2 || !photos.photo3) {
      setError(tx.error_photos)
      return
    }
    setLoading(true)
    setError('')

    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => formData.append(k, v))
    formData.append('photo_1', photos.photo1)
    formData.append('photo_2', photos.photo2)
    formData.append('photo_3', photos.photo3)

    const res = await fetch('/api/warranty/claim', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? tx.error_generic)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F0E8D8] flex flex-col">
        <div className="bg-[#2D4535] px-6 py-4 flex justify-between items-center">
          <div className="w-10" />
          <Image src="/logo-tabare.png" alt="Tabaré Mates" width={110} height={34} className="brightness-0 invert" />
          <LangToggle lang={lang} setLang={setLang} />
        </div>
        <div className="flex-1 flex items-start justify-center px-4 py-10">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#2D4535]/10 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-[#2D4535] mb-2">{tx.claim_success_title}</h2>
              <p className="text-sm text-[#2D4535]/60 leading-relaxed">{tx.claim_success_text}</p>
              <div className="mt-6 p-4 bg-[#F0E8D8] rounded-xl text-sm text-[#2D4535]/70">
                <p>{tx.claim_success_contact}</p>
                <a href="mailto:hola@tabare.com.ar" className="text-[#B8935A] font-medium">hola@tabare.com.ar</a>
                <span className="mx-2">·</span>
                <a href="https://wa.me/5491166407189" className="text-[#25D366] font-medium">WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0E8D8] flex flex-col">
      <div className="bg-[#2D4535] px-6 py-4 flex justify-between items-center">
        <div className="w-10" />
        <Image src="/logo-tabare.png" alt="Tabaré Mates" width={110} height={34} className="brightness-0 invert" />
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2D4535]/10 mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#2D4535]">{tx.claim_title}</h1>
            <p className="text-sm text-[#2D4535]/60 mt-2">{tx.claim_subtitle}</p>

            {/* ADEEI hook */}
            <div className="mt-4 mx-auto max-w-sm bg-[#2D4535]/5 rounded-xl px-4 py-3 text-xs text-[#2D4535]/70 leading-relaxed">
              <p className="font-semibold text-[#2D4535] mb-1">{tx.reg_did_you_know}</p>
              <p>{tx.reg_adeei_text}</p>
              <div className="flex gap-3 mt-2 flex-wrap justify-center">
                <a href="https://www.adeei.org.ar/%C3%A1reas/%C3%A1rea-laboral" target="_blank" rel="noopener noreferrer" className="text-[#B8935A] hover:underline font-medium">{tx.reg_adeei_link1}</a>
                <a href="https://puntodeencuentro.org.ar/" target="_blank" rel="noopener noreferrer" className="text-[#B8935A] hover:underline font-medium">{tx.reg_adeei_link2}</a>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-[#2D4535]/10 space-y-4">
            <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide">{tx.claim_section_personal}</h2>

            <div>
              <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_name_label} *</label>
              <input required type="text" value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                placeholder={tx.reg_name_placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30" />
            </div>

            <div>
              <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_email_label} *</label>
              <input required type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)}
                placeholder={tx.reg_email_placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30" />
            </div>

            <div>
              <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_country_label} *</label>
              <select required value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] bg-white">
                <option value="">{tx.reg_country_placeholder}</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="border-t border-[#2D4535]/10 pt-4">
              <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide mb-4">{tx.claim_section_purchase}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_channel_label} *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CHANNELS.map(ch => (
                      <button key={ch.value} type="button" onClick={() => set('channel', ch.value)}
                        className={`px-3 py-2.5 rounded-xl text-sm border transition-colors text-center ${
                          form.channel === ch.value
                            ? 'bg-[#2D4535] text-[#F0E8D8] border-[#2D4535]'
                            : 'bg-white text-[#2D4535]/70 border-[#2D4535]/15 hover:border-[#2D4535]/30'
                        }`}>
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">
                    {tx.reg_store_label} <span className="text-[#2D4535]/40">{tx.reg_store_optional}</span>
                  </label>
                  <input type="text" value={form.store_name} onChange={e => set('store_name', e.target.value)}
                    placeholder={tx.reg_store_placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_product_label} *</label>
                  <textarea required rows={3} value={form.product_description} onChange={e => set('product_description', e.target.value)}
                    placeholder={tx.reg_product_placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30 resize-none" />
                </div>
              </div>
            </div>

            <div className="border-t border-[#2D4535]/10 pt-4">
              <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide mb-4">{tx.claim_section_problem}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-2">{tx.claim_issue_label} *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ISSUE_TYPES.map(it => (
                      <button key={it.value} type="button" onClick={() => set('issue_type', it.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-colors text-left ${
                          form.issue_type === it.value
                            ? 'bg-[#2D4535] text-[#F0E8D8] border-[#2D4535]'
                            : 'bg-white text-[#2D4535]/70 border-[#2D4535]/15 hover:border-[#2D4535]/30'
                        }`}>
                        <span>{it.emoji}</span>{it.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.claim_desc_label} *</label>
                  <textarea required rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder={tx.claim_desc_placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30 resize-none" />
                </div>
              </div>
            </div>

            <div className="border-t border-[#2D4535]/10 pt-4">
              <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide mb-1">{tx.claim_section_photos}</h2>
              <p className="text-xs text-[#2D4535]/50 mb-4">{tx.claim_photos_required}</p>
              <div className="space-y-3">
                {(['photo1', 'photo2', 'photo3'] as const).map((key, i) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.claim_photo_label} {i + 1} *</label>
                    <input required type="file" accept="image/*" onChange={e => setPhoto(key, e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-[#2D4535]/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2D4535]/10 file:text-[#2D4535] hover:file:bg-[#2D4535]/20 cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-100">{error}</div>
            )}

            <button type="submit" disabled={loading || !form.channel || !form.issue_type}
              className="w-full py-3 rounded-xl bg-[#2D4535] text-[#F0E8D8] font-medium hover:bg-[#3d5c47] disabled:opacity-50 transition-colors">
              {loading ? tx.claim_submitting : tx.claim_submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ReclamoPage() {
  return (
    <Suspense>
      <ReclamoForm />
    </Suspense>
  )
}
