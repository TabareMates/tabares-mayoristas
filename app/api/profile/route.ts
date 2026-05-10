import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { password, email } = await request.json()

  const update: Record<string, string> = {}
  if (password) update.password = password
  if (email) update.email = email

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, update)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // If email changed, update clients table too
  if (email) {
    await admin.from('clients').update({ email }).eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
