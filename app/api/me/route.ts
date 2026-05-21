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

  // Fetch price list info if client has one
  let priceList = null
  let prices: { product_id: string; price_usd: number | null; price_ars: number | null; price_eur: number | null }[] = []

  if (client.price_list_id) {
    const { data: pl } = await admin
      .from('price_lists')
      .select('*')
      .eq('id', client.price_list_id)
      .single()

    priceList = pl

    if (pl) {
      const { data: items } = await admin
        .from('price_list_items')
        .select('product_id, price')
        .eq('price_list_id', pl.id)

      // Map price_list_items to the format the frontend expects
      const currency = pl.currency as 'USD' | 'ARS' | 'EUR'
      prices = (items ?? []).map((item: { product_id: string; price: number }) => ({
        product_id: item.product_id,
        price_usd: currency === 'USD' ? item.price : null,
        price_ars: currency === 'ARS' ? item.price : null,
        price_eur: currency === 'EUR' ? item.price : null,
      }))

      // Override client currency with price list currency
      client.currency = currency
    }
  } else {
    // Legacy: use client_prices table
    const { data } = await admin
      .from('client_prices')
      .select('product_id, price_usd, price_ars, price_eur')
      .eq('client_id', client.id)
    prices = data ?? []
  }

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

  return NextResponse.json({
    client,
    prices: prices ?? [],
    products: products ?? [],
    variantsByProductId,
    priceList,
  })
}
