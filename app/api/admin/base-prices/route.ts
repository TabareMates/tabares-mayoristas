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

export async function GET() {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { data } = await admin.from('products').select('id,code,name,base_price_usd,base_price_ars,base_price_eur,pvp_ars,pvp_eur,pvp_usd,category').order('code')
  return NextResponse.json({ products: data ?? [] })
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const { id, ...fields } = await request.json()
  const allowed = ['base_price_usd','base_price_ars','base_price_eur','pvp_ars','pvp_eur','pvp_usd','category']
  const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)))
  await admin.from('products').update(update).eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = createAdminClient()
  const body = await request.json()

  if (body.action === 'import_csv') {
    const { rows } = body
    for (const row of rows) {
      await admin.from('products').update({
        base_price_usd: row.base_price_usd ? parseFloat(row.base_price_usd) : null,
        base_price_ars: row.base_price_ars ? parseFloat(row.base_price_ars) : null,
        base_price_eur: row.base_price_eur ? parseFloat(row.base_price_eur) : null,
      }).eq('code', row.code)
    }
    return NextResponse.json({ ok: true, updated: rows.length })
  }

  if (body.action === 'recalculate') {
    const { data: products } = await admin.from('products').select('id,category,base_price_usd,base_price_ars,base_price_eur')
    const { data: clients } = await admin.from('clients').select('id').eq('is_admin', false).eq('active', true)
    const { data: discounts } = await admin.from('client_discounts').select('*')
    let updated = 0
    for (const client of (clients ?? [])) {
      for (const product of (products ?? [])) {
        const discount = (discounts ?? []).find((d: { client_id: string; category: string; discount_pct: number }) => d.client_id === client.id && d.category === product.category)
        const pct = discount ? Number(discount.discount_pct) / 100 : 0
        const price_usd = product.base_price_usd ? +(Number(product.base_price_usd) * (1 - pct)).toFixed(2) : null
        const price_ars = product.base_price_ars ? +(Number(product.base_price_ars) * (1 - pct)).toFixed(2) : null
        const price_eur = product.base_price_eur ? +(Number(product.base_price_eur) * (1 - pct)).toFixed(2) : null
        if (price_usd !== null || price_ars !== null || price_eur !== null) {
          await admin.from('client_prices').upsert(
            { client_id: client.id, product_id: product.id, price_usd, price_ars, price_eur },
            { onConflict: 'client_id,product_id' }
          )
          updated++
        }
      }
    }
    return NextResponse.json({ ok: true, updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
