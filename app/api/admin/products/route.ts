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
  const { data } = await admin.from('products').select('*').order('code')
  return NextResponse.json({ products: data ?? [] })
}

export async function POST(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const payload = await request.json()
  const { data, error } = await admin.from('products').insert(payload).select().single()
  if (error) return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  return NextResponse.json({ product: data })
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const body = await request.json()
  const { id } = body
  const ALLOWED_FIELDS = ['name', 'code', 'description', 'image_url', 'weight_kg', 'unit', 'active', 'base_price_usd', 'base_price_ars', 'base_price_eur', 'pvp_ars', 'pvp_eur', 'pvp_usd', 'category']
  const fields: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) fields[key] = body[key]
  }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await admin.from('products').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
