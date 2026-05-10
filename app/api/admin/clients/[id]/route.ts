import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = getAdminClient()
  const { data: me } = await admin.from('clients').select('is_admin').eq('user_id', user.id).single()
  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, email, password, company, country, currency, notes } = await request.json()

  // Get target client's user_id
  const { data: target } = await admin.from('clients').select('user_id').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  // Update Supabase Auth (email and/or password)
  const authUpdate: Record<string, string> = {}
  if (email) authUpdate.email = email
  if (password) authUpdate.password = password
  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await admin.auth.admin.updateUserById(target.user_id, authUpdate)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Update clients table
  const clientUpdate: Record<string, unknown> = {}
  if (name !== undefined) clientUpdate.name = name
  if (email !== undefined) clientUpdate.email = email
  if (company !== undefined) clientUpdate.company = company || null
  if (country !== undefined) clientUpdate.country = country
  if (currency !== undefined) clientUpdate.currency = currency
  if (notes !== undefined) clientUpdate.notes = notes || null

  const { data: updated, error } = await admin.from('clients').update(clientUpdate).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ client: updated })
}
