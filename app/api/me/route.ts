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
    .select('id, code, name, description, image_url, weight_kg, unit, active, base_price_usd, base_price_ars, base_price_eur, pvp_ars, pvp_eur, pvp_usd, category')
    .eq('active', true)
    .order('code')

  const { data: variants } = await admin
    .from('product_variants')
    .select('*')
    .eq('active', true)

  const variantsByProductId = (variants ?? []).reduce((acc: Record<string, Array<{id: string; label: string; color: string|null; size: string|null; product_id: string; active: boolean; created_at: string}>>, v) => {
    const variant = v as {id: string; label: string; color: string|null; size: string|null; product_id: string; active: boolean; created_at: string}
    if (!acc[variant.product_id]) acc[variant.product_id] = []
    acc[variant.product_id].push(variant)
    return acc
  }, {})

  return NextResponse.json({ client, prices: prices ?? [], products: products ?? [], variantsByProductId })
}
