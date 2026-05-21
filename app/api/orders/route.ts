import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendOrderNotification } from '@/lib/email'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients').select('*').eq('user_id', user.id).single()

  if (!client) return NextResponse.json({ error: 'No client profile' }, { status: 404 })

  const { data: orders } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ client, orders: orders ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients').select('*').eq('user_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'No client profile' }, { status: 404 })

  const body = await request.json()
  const { items, comments, shipping_cost_estimate, total_usd, total_ars, total_eur } = body

  const { data: order, error } = await admin
    .from('orders')
    .insert({ client_id: client.id, status: 'pending', shipping_cost_estimate, comments, total_usd, total_ars, total_eur })
    .select().single()

  if (error || !order) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })

  await admin.from('order_items').insert(
    items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_code: item.product_code,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price_usd: item.unit_price_usd,
      unit_price_ars: item.unit_price_ars,
      unit_price_eur: item.unit_price_eur,
      variant_label: item.variant_label || null,
    }))
  )

  // Send email notifications — awaited so Vercel doesn't kill the process before it sends
  const currency = client.currency as 'USD' | 'ARS' | 'EUR'
  const total = currency === 'ARS' ? total_ars : currency === 'EUR' ? total_eur : total_usd
  await sendOrderNotification({
    clientName: client.name,
    clientEmail: client.email,
    orderId: order.id,
    currency,
    total,
    comments,
    shippingCost: shipping_cost_estimate,
    items: items.map((item: any) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: currency === 'ARS' ? item.unit_price_ars
                : currency === 'EUR' ? item.unit_price_eur
                : item.unit_price_usd,
    })),
  }).catch(() => {})

  return NextResponse.json({ order })
}
