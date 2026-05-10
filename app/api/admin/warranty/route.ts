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

export async function GET(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const admin = createAdminClient()
  let query = admin.from('warranty_claims').select('*, warranty_registrations(*)')
  if (status && status !== 'todos') query = query.eq('status', status)
  const { data } = await query.order('created_at', { ascending: false })
  return NextResponse.json({ claims: data ?? [] })
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { id, status, internal_notes, client_id } = await request.json()
  const update: Record<string, unknown> = { reviewed_at: new Date().toISOString() }
  if (status !== undefined) update.status = status
  if (internal_notes !== undefined) update.internal_notes = internal_notes
  await admin.from('warranty_claims').update(update).eq('id', id)
  if (status === 'approved' && client_id) {
    await admin.from('warranty_credits').insert({ claim_id: id, client_id, units: 1, status: 'available' })
  }
  return NextResponse.json({ ok: true })
}
