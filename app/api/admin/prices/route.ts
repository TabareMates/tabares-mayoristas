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
  const { data } = await admin.from('client_prices').select('*')
  return NextResponse.json({ prices: data ?? [] })
}

// Upsert a single price row
export async function POST(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { client_id, product_id, price_usd, price_ars, price_eur } = await request.json()

  const { data: existing } = await admin
    .from('client_prices')
    .select('id')
    .eq('client_id', client_id)
    .eq('product_id', product_id)
    .single()

  if (existing) {
    const { data } = await admin
      .from('client_prices')
      .update({ price_usd, price_ars, price_eur })
      .eq('id', existing.id)
      .select().single()
    return NextResponse.json({ price: data })
  } else {
    const { data } = await admin
      .from('client_prices')
      .insert({ client_id, product_id, price_usd, price_ars, price_eur })
      .select().single()
    return NextResponse.json({ price: data })
  }
}
