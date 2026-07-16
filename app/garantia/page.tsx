'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { t, Lang } from './translations'

const CURADO_DATA = {
  es: [
    {
      icon: '🧉',
      title: 'Mate de calabaza',
      intro: 'Si es la primera vez que usás este mate, el curado es obligatorio antes de cebar.',
      steps: [
        'Llenalo con yerba húmeda hasta ¾ del mate. Agregá agua tibia — nunca caliente todavía.',
        'Dejá reposar 24 horas boca abajo con la bombilla adentro.',
        'Repetí el proceso 5 veces en total (un ciclo por día).',
        'Al finalizar el último ciclo, secá completamente boca arriba antes del primer uso.',
      ],
      notes: [
        'Agua a 70–75 °C máximo en los primeros días, no hirviendo.',
        'Sin jabón, sin detergente, ni ningún producto de limpieza por dentro ni por fuera.',
        '¿Aparece moho los primeros días? Es normal. Vaciá y secá boca arriba después de cada uso.',
      ],
    },
    {
      icon: '🌿',
      title: 'Mate de algarrobo',
      intro: 'La madera requiere un proceso diferente al de la calabaza.',
      steps: [
        'Untá el interior con aceite de oliva, girasol o manteca. Cubrí toda la superficie.',
        'Dejalo reposar 24 horas. Si la madera se ve seca, aplicá una segunda mano antes de continuar.',
        'Al día siguiente, aplicá una segunda capa de aceite. Otras 24 horas.',
        'Agregá yerba húmeda hasta ¾ del mate con agua tibia. Dejá reposar 48 horas.',
        'Vaciá con cuchara, enjuagá con agua tibia y secá boca arriba al aire (mínimo 12 horas).',
        'Las primeras 2 cebadas a 70–75 °C. Desde el tercer día usá la temperatura que preferís.',
      ],
      notes: [
        'Cada 2–3 meses: una mano de aceite por dentro mantiene la madera nutrida.',
        'Sin jabón, lavavajillas ni sumergir en agua.',
      ],
    },
    {
      icon: '🤎',
      title: 'Cuidado del cuero',
      intro: 'Aplica si tu mate o matera tiene cuero.',
      steps: [
        'Hidratá el cuero una vez al mes, o cuando lo veas más opaco o áspero al tacto.',
        'Usá betún incoloro, crema para cuero o cera de abeja. Aplicá con un trapo en movimientos circulares.',
        'Sacá el excedente con un trapo limpio.',
        'Si el cuero se moja, dejalo secar al aire. Nunca con calor directo (secador, estufa, sol).',
        'Guardalo en tela natural, nunca en bolsa plástica.',
      ],
      notes: [
        'Nunca: alcohol, acetona ni productos de limpieza del hogar.',
        'El calor directo agrieta el cuero de forma permanente.',
      ],
    },
  ],
  en: [
    {
      icon: '🧉',
      title: 'Calabash gourd mate',
      intro: 'If this is your first time using this mate, curing is required before the first brew.',
      steps: [
        'Fill it ¾ full with damp (used) yerba. Add warm water — not hot yet.',
        'Let it rest 24 hours upside down with the bombilla inside.',
        'Repeat the process 5 times total (one cycle per day).',
        'After the last cycle, dry it completely mouth up before the first use.',
      ],
      notes: [
        'Water at 70–75 °C max for the first few days — not boiling.',
        'No soap, no detergent, no cleaning products inside or outside.',
        "See mold in the first days? That's normal. Just empty and dry mouth up after each use.",
      ],
    },
    {
      icon: '🌿',
      title: 'Algarrobo wood mate',
      intro: 'Wood requires a different curing process than calabash.',
      steps: [
        'Coat the interior with olive oil, sunflower oil, or butter. Cover the entire surface.',
        'Let it rest 24 hours. If the wood looks dry after a few hours, apply a second coat before continuing.',
        'Next day, apply a second coat of oil. Another 24 hours.',
        'Fill ¾ with damp yerba and warm water. Let it rest 48 hours.',
        'Empty with a spoon, rinse with warm water, dry mouth up in open air (at least 12 hours).',
        'First 2 brews at 70–75 °C. From day 3 on, use your preferred temperature.',
      ],
      notes: [
        'Every 2–3 months: a coat of oil inside keeps the wood nourished.',
        'No soap, dishwasher, or soaking in water — ever.',
      ],
    },
    {
      icon: '🤎',
      title: 'Leather care',
      intro: 'Applies if your mate or matera has leather.',
      steps: [
        'Hydrate the leather once a month — or whenever it looks dull or feels rough to the touch.',
        'Use colorless shoe polish, leather cream, or beeswax. Apply with a cloth in circular motions.',
        'Remove excess with a clean dry cloth.',
        'If the leather gets wet, let it air dry. Never use direct heat (hair dryer, heater, direct sun).',
        'Store in natural fabric, never in a plastic bag.',
      ],
      notes: [
        'Never: alcohol, acetone, or household cleaning products.',
        'Direct heat cracks leather permanently.',
      ],
    },
  ],
  fr: [
    {
      icon: '🧉',
      title: 'Maté en calebasse',
      intro: "Si c'est la première fois que vous utilisez ce maté, la cure est obligatoire avant la première infusion.",
      steps: [
        "Remplissez-le aux ¾ avec de la yerba humide. Ajoutez de l'eau tiède — pas encore chaude.",
        "Laissez reposer 24 heures à l'envers avec la bombilla à l'intérieur.",
        'Répétez le processus 5 fois au total (un cycle par jour).',
        "Après le dernier cycle, séchez complètement à l'endroit avant la première utilisation.",
      ],
      notes: [
        'Eau à 70–75 °C maximum les premiers jours, pas bouillante.',
        "Aucun produit de nettoyage, jamais. Ni savon ni détergent, ni à l'intérieur ni à l'extérieur.",
        "Des moisissures les premiers jours ? C'est normal. Videz et séchez à l'endroit après chaque utilisation.",
      ],
    },
    {
      icon: '🌿',
      title: "Maté en bois d'algarrobo",
      intro: 'Le bois nécessite un processus différent de la calebasse.',
      steps: [
        "Enduisez l'intérieur d'huile d'olive, de tournesol ou de beurre. Couvrez toute la surface.",
        'Laissez reposer 24 heures. Si le bois paraît sec, appliquez une deuxième couche avant de continuer.',
        "Le lendemain, appliquez une deuxième couche d'huile. Encore 24 heures.",
        "Ajoutez de la yerba humide aux ¾ avec de l'eau tiède. Laissez reposer 48 heures.",
        "Videz avec une cuillère, rincez à l'eau tiède, séchez à l'endroit à l'air libre (minimum 12 heures).",
        'Les 2 premières infusions à 70–75 °C. À partir du 3e jour, utilisez la température que vous préférez.',
      ],
      notes: [
        "Tous les 2–3 mois : une couche d'huile à l'intérieur nourrit le bois.",
        "Jamais de savon, lave-vaisselle ou trempage dans l'eau.",
      ],
    },
    {
      icon: '🤎',
      title: 'Entretien du cuir',
      intro: 'Applicable si votre maté ou matera est en cuir.',
      steps: [
        'Hydratez le cuir une fois par mois — ou quand il paraît terne ou rugueux au toucher.',
        "Utilisez du cirage incolore, de la crème pour cuir ou de la cire d'abeille. Appliquez avec un chiffon en mouvements circulaires.",
        "Retirez l'excédent avec un chiffon propre.",
        'Si le cuir se mouille, laissez sécher à l\'air. Jamais avec de la chaleur directe (sèche-cheveux, radiateur, soleil).',
        'Rangez dans un tissu naturel, jamais dans un sac plastique.',
      ],
      notes: [
        "Jamais : alcool, acétone ou produits ménagers.",
        'La chaleur directe fissure le cuir de façon permanente.',
      ],
    },
  ],
  it: [
    {
      icon: '🧉',
      title: 'Mate in zucca',
      intro: 'Se è la prima volta che usi questo mate, la stagionatura è obbligatoria prima della prima infusione.',
      steps: [
        "Riempilo per ¾ con yerba umida. Aggiungi acqua tiepida — non calda ancora.",
        "Lascia riposare 24 ore capovolto con la bombilla all'interno.",
        'Ripeti il processo 5 volte in totale (un ciclo al giorno).',
        'Dopo l\'ultimo ciclo, asciuga completamente a bocca in su prima del primo utilizzo.',
      ],
      notes: [
        'Acqua a 70–75 °C massimo nei primi giorni, non bollente.',
        'Nessun prodotto detergente, mai. Né sapone né detersivo, né dentro né fuori.',
        'Muffa nei primi giorni? È normale. Svuota e asciuga a bocca in su dopo ogni utilizzo.',
      ],
    },
    {
      icon: '🌿',
      title: 'Mate in legno di algarrobo',
      intro: 'Il legno richiede un processo diverso rispetto alla zucca.',
      steps: [
        "Spalma l'interno con olio d'oliva, di girasole o burro. Copri tutta la superficie.",
        'Lascia riposare 24 ore. Se il legno sembra asciutto, applica un secondo strato prima di continuare.',
        "Il giorno dopo, applica un secondo strato di olio. Altre 24 ore.",
        'Aggiungi yerba umida per ¾ con acqua tiepida. Lascia riposare 48 ore.',
        "Svuota con un cucchiaio, sciacqua con acqua tiepida, asciuga a bocca in su all'aria (minimo 12 ore).",
        'Le prime 2 infusioni a 70–75 °C. Dal terzo giorno usa la temperatura che preferisci.',
      ],
      notes: [
        "Ogni 2–3 mesi: uno strato di olio all'interno mantiene il legno nutrito.",
        "Mai sapone, lavastoviglie o immersione in acqua.",
      ],
    },
    {
      icon: '🤎',
      title: 'Cura del cuoio',
      intro: 'Si applica se il tuo mate o la tua matera ha il cuoio.',
      steps: [
        'Idrata il cuoio una volta al mese — o quando lo vedi più opaco o ruvido al tatto.',
        "Usa lucido incolore, crema per cuoio o cera d'api. Applica con un panno in movimenti circolari.",
        "Rimuovi l'eccesso con un panno pulito.",
        'Se il cuoio si bagna, lascialo asciugare all\'aria. Mai con calore diretto (asciugacapelli, stufa, sole).',
        'Conserva in tessuto naturale, mai in buste di plastica.',
      ],
      notes: [
        'Mai: alcol, acetone o prodotti per la pulizia domestica.',
        'Il calore diretto incrina il cuoio in modo permanente.',
      ],
    },
  ],
  de: [
    {
      icon: '🧉',
      title: 'Kürbis-Mate (Calabaza)',
      intro: 'Wenn Sie diesen Mate zum ersten Mal verwenden, ist das Einweihen vor dem ersten Aufguss obligatorisch.',
      steps: [
        'Füllen Sie ihn zu ¾ mit feuchter Yerba. Geben Sie lauwarmes Wasser hinzu — noch kein heißes.',
        'Lassen Sie ihn 24 Stunden auf dem Kopf stehen, Bombilla drin.',
        'Wiederholen Sie den Vorgang insgesamt 5 Mal (ein Zyklus pro Tag).',
        'Nach dem letzten Zyklus vollständig mit der Öffnung nach oben trocknen lassen.',
      ],
      notes: [
        'Wasser maximal 70–75 °C in den ersten Tagen, nicht kochend.',
        'Keinerlei Reinigungsmittel, niemals. Weder Seife noch Spülmittel, weder innen noch außen.',
        'Schimmel in den ersten Tagen? Das ist normal. Leeren und mit der Öffnung nach oben trocknen nach jedem Gebrauch.',
      ],
    },
    {
      icon: '🌿',
      title: 'Mate aus Algarrobo-Holz',
      intro: 'Holz erfordert einen anderen Prozess als Kürbis.',
      steps: [
        'Bestreichen Sie das Innere mit Olivenöl, Sonnenblumenöl oder Butter. Gesamte Oberfläche abdecken.',
        'Lassen Sie es 24 Stunden ruhen. Wenn das Holz trocken aussieht, tragen Sie eine zweite Schicht auf.',
        'Am nächsten Tag eine zweite Ölschicht auftragen. Weitere 24 Stunden.',
        'Feuchte Yerba bis ¾ mit lauwarmem Wasser auffüllen. 48 Stunden ruhen lassen.',
        'Mit einem Löffel leeren, mit lauwarmem Wasser ausspülen, mit Öffnung nach oben an der Luft trocknen (mindestens 12 Stunden).',
        'Die ersten 2 Aufgüsse bei 70–75 °C. Ab dem 3. Tag Ihre bevorzugte Temperatur verwenden.',
      ],
      notes: [
        'Alle 2–3 Monate: eine Ölschicht innen hält das Holz gepflegt.',
        'Nie Seife, Spülmaschine oder in Wasser einweichen.',
      ],
    },
    {
      icon: '🤎',
      title: 'Lederpflege',
      intro: 'Gilt, wenn Ihr Mate oder Ihre Matera Leder hat.',
      steps: [
        'Pflegen Sie das Leder einmal im Monat — oder wenn es stumpf oder rau wirkt.',
        'Verwenden Sie farblose Schuhcreme, Ledercreme oder Bienenwachs. Mit einem Tuch in Kreisbewegungen auftragen.',
        'Überschuss mit einem sauberen Tuch entfernen.',
        'Wenn das Leder nass wird, an der Luft trocknen lassen. Nie mit direkter Wärme (Föhn, Heizkörper, Sonne).',
        'In einem Naturtuch aufbewahren, nie in Plastiktüten.',
      ],
      notes: [
        'Niemals: Alkohol, Aceton oder Haushaltsreiniger.',
        'Direkte Wärme reißt das Leder dauerhaft ein.',
      ],
    },
  ],
}

function CuradoStep({ lang, onContinue }: { lang: Lang; onContinue: () => void }) {
  const tx = t[lang]
  const sections = CURADO_DATA[lang]
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-[#2D4535]">{tx.curado_pre_title}</h1>
        <p className="text-sm text-[#2D4535]/60 mt-2 leading-relaxed">{tx.curado_pre_subtitle}</p>
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-2xl p-5 shadow-sm border border-[#2D4535]/10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{section.icon}</span>
              <div>
                <h2 className="font-semibold text-[#2D4535] text-sm">{section.title}</h2>
                <p className="text-xs text-[#2D4535]/55 mt-0.5">{section.intro}</p>
              </div>
            </div>

            <ol className="space-y-2 mb-3">
              {section.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-[#2D4535]/80 leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#2D4535] text-[#F0E8D8] text-[10px] font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="bg-[#FFF8EC] border border-[#B8935A]/20 rounded-xl px-3 py-2.5 space-y-1">
              {section.notes.map((note, i) => (
                <p key={i} className="text-xs text-[#7A5C2E] leading-relaxed">⚠ {note}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-[#2D4535]/10">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#2D4535] shrink-0"
          />
          <span className="text-sm text-[#2D4535] leading-relaxed font-medium">{tx.curado_confirm_label}</span>
        </label>

        <button
          onClick={onContinue}
          disabled={!confirmed}
          className="mt-4 w-full py-3 rounded-xl bg-[#2D4535] text-[#F0E8D8] font-medium text-sm hover:bg-[#3d5c47] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {tx.curado_continue}
        </button>
      </div>
    </div>
  )
}

const COUNTRIES = [
  'Argentina', 'España', 'México', 'Uruguay', 'Chile', 'Colombia',
  'Perú', 'Bolivia', 'Paraguay', 'Brasil', 'Venezuela', 'Ecuador',
  'Australia', 'United Kingdom', 'United States', 'Canada',
  'Portugal', 'Italy', 'France', 'Germany', 'Otro / Other',
]

const LANG_LABELS: Record<Lang, string> = { es: 'ES', en: 'EN', fr: 'FR', it: 'IT', de: 'DE' }

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex gap-0.5 bg-white/20 rounded-lg p-0.5">
      {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
            lang === l ? 'bg-white text-[#2D4535]' : 'text-white/70 hover:text-white'
          }`}
        >
          {LANG_LABELS[l]}
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
    if (paramLang && paramLang in LANG_LABELS) {
      setLang(paramLang as Lang)
    } else {
      const browserLang = (navigator.language || '').toLowerCase()
      if (browserLang.startsWith('en')) setLang('en')
      else if (browserLang.startsWith('fr')) setLang('fr')
      else if (browserLang.startsWith('it')) setLang('it')
      else if (browserLang.startsWith('de')) setLang('de')
      // else default stays 'es'
    }
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
  const [step, setStep] = useState<'curado' | 'form' | 'success'>('curado')

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

    setStep('success')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F0E8D8] flex flex-col">
      <div className="bg-[#2D4535] px-6 py-4 flex justify-between items-center">
        <div className="w-10" />
        <Image src="/logo-tabare.png" alt="Tabaré Mates" width={160} height={50} className="brightness-0 invert" />
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {step === 'success' ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#2D4535]/10 text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/garantia-badge.png" alt="1 año de garantía" width={120} height={120} />
              </div>
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
          ) : step === 'curado' ? (
            <CuradoStep lang={lang} onContinue={() => setStep('form')} />
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="flex justify-center mb-4">
                  <Image src="/garantia-badge.png" alt="1 año de garantía" width={130} height={130} />
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
