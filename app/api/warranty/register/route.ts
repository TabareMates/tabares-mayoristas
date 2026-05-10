import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { customer_name, customer_email, country, channel, store_name, purchase_date } = await request.json()

  if (!customer_name || !customer_email || !country || !channel || !purchase_date) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Garantía: 1 año desde la compra
  const purchaseDateObj = new Date(purchase_date)
  const warrantyExpires = new Date(purchaseDateObj)
  warrantyExpires.setFullYear(warrantyExpires.getFullYear() + 1)
  const warrantyExpiresStr = warrantyExpires.toISOString().split('T')[0]

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('warranty_registrations')
    .insert({
      customer_name,
      customer_email,
      country,
      channel,
      store_name: store_name || null,
      purchase_date,
      warranty_expires: warrantyExpiresStr,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })

  return NextResponse.json({ id: data.id })
}
