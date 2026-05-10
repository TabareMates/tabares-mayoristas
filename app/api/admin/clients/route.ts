import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = getAdminClient()
  const { data: me } = await admin.from('clients').select('is_admin').eq('user_id', user.id).single()
  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: clients } = await admin.from('clients').select('*').order('name')
  return NextResponse.json({ clients: clients ?? [] })
}

export async function POST(request: Request) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = getAdminClient()

  const { data: me } = await admin.from('clients').select('is_admin').eq('user_id', user.id).single()
  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password, company, country, currency, notes } = await request.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email y password son requeridos' }, { status: 400 })
  }

  // Create Supabase Auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    const msg = authError.message.includes('already') ? 'Ese email ya tiene cuenta.' : authError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Create clients row
  const { data: client, error: clientError } = await admin
    .from('clients')
    .insert({
      user_id: authUser.user.id,
      name,
      email,
      company: company || null,
      country: country || '',
      currency: currency || 'USD',
      notes: notes || null,
      active: true,
      is_admin: false,
    })
    .select()
    .single()

  if (clientError) {
    // Rollback: delete the auth user we just created
    await admin.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: 'Error creando el perfil del cliente.' }, { status: 500 })
  }

  return NextResponse.json({ client })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = getAdminClient()
  const { data: me } = await admin.from('clients').select('is_admin').eq('user_id', user.id).single()
  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Get user_id before deleting
  const { data: target } = await admin.from('clients').select('user_id').eq('id', id).single()

  // Delete client row (cascade deletes prices and orders)
  await admin.from('clients').delete().eq('id', id)

  // Delete auth user
  if (target?.user_id) {
    await admin.auth.admin.deleteUser(target.user_id)
  }

  return NextResponse.json({ ok: true })
}
