import { createAdminClient } from '@/lib/supabase/admin'
import { sendWarrantyConfirmation } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { customer_name, customer_email, country, channel, store_name, purchase_date, product_description } = await request.json()

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
      product_description: product_description || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })

  // Enviar email de confirmación al cliente
  sendWarrantyConfirmation({
    customerName: customer_name,
    customerEmail: customer_email,
    productDescription: product_description || 'No especificado',
    purchaseDate: purchase_date,
    warrantyExpires: warrantyExpiresStr,
    storeName: store_name || undefined,
  }).catch(() => {})

  if (process.env.SHEETS_WEBHOOK_URL) {
    fetch(process.env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'warranty_registration',
        timestamp: new Date().toISOString(),
        customer_name,
        customer_email,
        country,
        channel,
        store_name: store_name || '',
        product_description: product_description || '',
        purchase_date,
        warranty_expires: warrantyExpiresStr,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ id: data.id })
}
