import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  // Verify auth
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use admin client for DB queries (bypasses RLS)
  const admin = createAdminClient()

  const { data: client, error } = await admin
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !client) {
    return NextResponse.json({ error: 'No client profile', userId: user.id }, { status: 404 })
  }

  const { data: prices } = await admin
    .from('client_prices')
    .select('product_id, price_usd, price_ars, price_eur')
    .eq('client_id', client.id)

  const { data: products } = await admin
    .from('products')
    .select('*')
    .eq('active', true)
    .order('code')

  return NextResponse.json({ client, prices: prices ?? [], products: products ?? [] })
}
