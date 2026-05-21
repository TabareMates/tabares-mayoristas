import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const WEBHOOK_SECRET = process.env.PRICE_SYNC_SECRET

export async function POST(request: Request) {
  // Verify secret
  const authHeader = request.headers.get('x-webhook-secret')
  if (!WEBHOOK_SECRET || authHeader !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { lists } = body
  // lists: [{ slug: 'pvp_ar', items: [{ code: 'MAT-001', price: 57732 }, ...] }, ...]

  if (!lists || !Array.isArray(lists)) {
    return NextResponse.json({ error: 'Invalid payload: expected { lists: [...] }' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Resolve all product codes to IDs
  const { data: products } = await admin.from('products').select('id, code')
  const codeToId = new Map((products ?? []).map((p: { id: string; code: string }) => [p.code, p.id]))

  // Resolve all price list slugs to IDs
  const { data: priceLists } = await admin.from('price_lists').select('id, slug')
  const slugToId = new Map((priceLists ?? []).map((pl: { id: string; slug: string }) => [pl.slug, pl.id]))

  const results: Record<string, { updated: number; skipped: number; errors: string[] }> = {}

  for (const list of lists) {
    const { slug, items } = list
    const priceListId = slugToId.get(slug)

    if (!priceListId) {
      results[slug] = { updated: 0, skipped: 0, errors: [`Lista "${slug}" no encontrada`] }
      continue
    }

    if (!items || !Array.isArray(items)) {
      results[slug] = { updated: 0, skipped: 0, errors: ['No items provided'] }
      continue
    }

    let updated = 0
    let skipped = 0
    const errors: string[] = []

    // Batch upsert for performance
    const upsertRows: { price_list_id: string; product_id: string; price: number; updated_at: string }[] = []

    for (const item of items) {
      const productId = codeToId.get(item.code)
      if (!productId) {
        skipped++
        continue
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        skipped++
        errors.push(`${item.code}: precio invalido (${item.price})`)
        continue
      }
      upsertRows.push({
        price_list_id: priceListId,
        product_id: productId,
        price: Math.round(item.price * 100) / 100,
        updated_at: new Date().toISOString(),
      })
    }

    if (upsertRows.length > 0) {
      const { error } = await admin
        .from('price_list_items')
        .upsert(upsertRows, { onConflict: 'price_list_id,product_id' })

      if (error) {
        errors.push(`DB error: ${error.message}`)
      } else {
        updated = upsertRows.length
      }
    }

    results[slug] = { updated, skipped, errors }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  })
}
