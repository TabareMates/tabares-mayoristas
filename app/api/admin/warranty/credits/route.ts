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
  const clientId = searchParams.get('client_id')

  const admin = createAdminClient()
  let query = admin
    .from('warranty_credits')
    .select(`
      *,
      clients(id, name, email),
      warranty_claims(
        issue_type,
        description,
        warranty_registrations(customer_name, store_name, purchase_date, country)
      )
    `)
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)

  const { data } = await query
  return NextResponse.json({ credits: data ?? [] })
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('warranty_credits')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
