'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { t, Lang } from './translations'

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
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
            lang === l ? 'bg-white text-[#2D4535]' : 'text-white/70 hover:text-white'
          }`}
        >
          {l === 'es' ? 'ES' : 'EN'}
        </button>
      ))}
    </div>
  )
}

function GarantiaForm() {
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<Lang>('es')

  useEffect(() => {
    const paramLang = searchParams.get('lang')
    if (paramLang === 'en') setLang('en')
  }, [searchParams])

  const tx = t[lang]

  const CHANNELS = [
    { value: 'local', label: tx.channel_local },
    { value: 'online', label: tx.channel_online },
    { value: 'otro', label: tx.channel_other },
  ]

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
      setError(data.error ?? tx.error_generic)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
          {success ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#2D4535]/10 text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <h2 className="text-xl font-semibold text-[#2D4535] mb-2">{tx.reg_success_title}</h2>
              <p className="text-sm text-[#2D4535]/70 leading-relaxed">{tx.reg_success_text}</p>
              <div className="mt-4 p-4 bg-[#2D4535]/5 rounded-xl text-sm text-[#2D4535]/80 flex items-start gap-3 text-left">
                <span className="text-xl shrink-0">📬</span>
                <p>{tx.reg_success_email}</p>
              </div>
              <div className="mt-4 p-4 bg-[#F0E8D8] rounded-xl text-sm text-[#2D4535]/70">
                <p>{tx.reg_success_contact}</p>
                <a href="mailto:hola@tabare.com.ar" className="text-[#B8935A] font-medium">hola@tabare.com.ar</a>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2D4535]/10 mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h1 className="text-2xl font-semibold text-[#2D4535]">{tx.reg_title}</h1>
                <p className="text-sm text-[#2D4535]/60 mt-2">
                  {tx.reg_subtitle}<br />{tx.reg_subtitle2}
                </p>

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
                <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide">{tx.reg_section_personal}</h2>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_name_label} {tx.reg_required}</label>
                  <input required type="text" value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                    placeholder={tx.reg_name_placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_email_label} {tx.reg_required}</label>
                  <input required type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)}
                    placeholder={tx.reg_email_placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_country_label} {tx.reg_required}</label>
                  <select required value={form.country} onChange={e => set('country', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] bg-white">
                    <option value="">{tx.reg_country_placeholder}</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="border-t border-[#2D4535]/10 pt-4">
                  <h2 className="font-medium text-[#2D4535] text-sm uppercase tracking-wide mb-4">{tx.reg_section_purchase}</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_channel_label} {tx.reg_required}</label>
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
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_date_label} {tx.reg_required}</label>
                      <input required type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A]" />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#2D4535]/60 block mb-1">{tx.reg_product_label} {tx.reg_required}</label>
                      <textarea required rows={3} value={form.product_description} onChange={e => set('product_description', e.target.value)}
                        placeholder={tx.reg_product_placeholder}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#2D4535]/15 text-sm text-[#2D4535] focus:outline-none focus:ring-2 focus:ring-[#B8935A] placeholder-[#2D4535]/30 resize-none" />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600 border border-red-100">{error}</div>
                )}

                <button type="submit" disabled={loading || !form.channel}
                  className="w-full py-3 rounded-xl bg-[#2D4535] text-[#F0E8D8] font-medium hover:bg-[#3d5c47] disabled:opacity-50 transition-colors">
                  {loading ? tx.reg_submitting : tx.reg_submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GarantiaPage() {
  return (
    <Suspense>
      <GarantiaForm />
    </Suspense>
  )
}
