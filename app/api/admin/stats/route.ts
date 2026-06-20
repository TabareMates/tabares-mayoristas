import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: me } = await admin.from('clients').select('is_admin').eq('user_id', user.id).single()
  return me?.is_admin ? user : null
}

export async function GET() {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const [
    { data: orders },
    { data: clients },
    { data: goals },
  ] = await Promise.all([
    admin.from('orders').select('*, clients(id, name, currency)').in('status', ['approved', 'in_progress', 'shipped', 'delivered']),
    admin.from('clients').select('id, name, currency').eq('is_admin', false).eq('active', true).order('name'),
    admin.from('billing_goals').select('*'),
  ])

  // Fetch live exchange rates
  let arsPerUsd = 1200
  let eurToUsd = 1.18
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { next: { revalidate: 3600 } })
    const rates = await res.json()
    arsPerUsd = rates.rates.ARS
    eurToUsd = 1 / rates.rates.EUR
  } catch {}

  return NextResponse.json({
    orders: orders ?? [],
    clients: clients ?? [],
    goals: goals ?? [],
    rates: { arsPerUsd, eurToUsd, date: new Date().toLocaleDateString('es-AR') },
  })
}

export async function POST(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { client_id, target_usd, label } = await request.json()

  // Upsert goal
  const { data: existing } = await admin
    .from('billing_goals')
    .select('id')
    .eq('client_id', client_id ?? null)
    .maybeSingle()

  if (existing) {
    await admin.from('billing_goals').update({ target_usd, label }).eq('id', existing.id)
  } else {
    await admin.from('billing_goals').insert({ client_id: client_id ?? null, target_usd, label })
  }

  return NextResponse.json({ ok: true })
}
