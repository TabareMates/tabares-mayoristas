import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data: me } = await admin.from('clients').select('id').eq('user_id', user.id).single()
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: credits } = await admin
    .from('warranty_credits')
    .select('*, warranty_claims(issue_type, description, warranty_registrations(customer_name, store_name, purchase_date))')
    .eq('client_id', me.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ credits: credits ?? [] })
}
