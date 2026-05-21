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

// GET: list all price lists with item counts
export async function GET() {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()

  const { data: lists } = await admin
    .from('price_lists')
    .select('*')
    .order('sort_order')

  // Count items per list
  const { data: counts } = await admin
    .from('price_list_items')
    .select('price_list_id')

  const countMap: Record<string, number> = {}
  for (const c of counts ?? []) {
    countMap[c.price_list_id] = (countMap[c.price_list_id] || 0) + 1
  }

  // Count clients per list
  const { data: clientCounts } = await admin
    .from('clients')
    .select('price_list_id')
    .not('price_list_id', 'is', null)

  const clientCountMap: Record<string, number> = {}
  for (const c of clientCounts ?? []) {
    if (c.price_list_id) clientCountMap[c.price_list_id] = (clientCountMap[c.price_list_id] || 0) + 1
  }

  const enriched = (lists ?? []).map(l => ({
    ...l,
    product_count: countMap[l.id] || 0,
    client_count: clientCountMap[l.id] || 0,
  }))

  return NextResponse.json({ priceLists: enriched })
}

// POST: bulk upload prices for a list
export async function POST(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const body = await request.json()

  if (body.action === 'upload_prices') {
    const { price_list_id, items } = body
    // items: [{ code: 'MAT-001', price: 56600 }, ...]

    if (!price_list_id || !items?.length) {
      return NextResponse.json({ error: 'price_list_id and items required' }, { status: 400 })
    }

    // Resolve product codes to IDs
    const { data: products } = await admin
      .from('products')
      .select('id, code')

    const codeToId = new Map((products ?? []).map((p: { id: string; code: string }) => [p.code, p.id]))

    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const item of items) {
      const productId = codeToId.get(item.code)
      if (!productId) {
        skipped++
        errors.push(`SKU ${item.code} not found`)
        continue
      }

      const { error } = await admin
        .from('price_list_items')
        .upsert({
          price_list_id,
          product_id: productId,
          price: item.price,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'price_list_id,product_id' })

      if (error) {
        errors.push(`${item.code}: ${error.message}`)
      } else {
        updated++
      }
    }

    return NextResponse.json({ ok: true, updated, skipped, errors })
  }

  if (body.action === 'assign_client') {
    const { client_id, price_list_id } = body
    await admin.from('clients').update({ price_list_id }).eq('id', client_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
