import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()

  const customer_name = formData.get('customer_name') as string | null
  const customer_email = formData.get('customer_email') as string | null
  const country = formData.get('country') as string | null
  const channel = formData.get('channel') as string | null
  const store_name = formData.get('store_name') as string | null
  const product_description = formData.get('product_description') as string | null
  const issue_type = formData.get('issue_type') as string | null
  const description = formData.get('description') as string | null
  const photo1File = formData.get('photo_1') as File | null
  const photo2File = formData.get('photo_2') as File | null
  const photo3File = formData.get('photo_3') as File | null

  if (!customer_name || !customer_email || !country || !channel || !issue_type || !description) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  if (!photo1File || !photo2File || !photo3File) {
    return NextResponse.json({ error: 'Las 3 fotos son obligatorias' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Asegurar que el bucket existe
  await admin.storage.createBucket('warranty-photos', { public: true }).catch(() => {})

  // Subir fotos a Supabase Storage
  async function uploadPhoto(file: File, index: number): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${index}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await admin.storage.from('warranty-photos').upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw new Error(`Error subiendo foto ${index}: ${error.message}`)
    const { data } = admin.storage.from('warranty-photos').getPublicUrl(path)
    return data.publicUrl
  }

  let photo_1: string
  let photo_2: string
  let photo_3: string

  try {
    ;[photo_1, photo_2, photo_3] = await Promise.all([
      uploadPhoto(photo1File, 1),
      uploadPhoto(photo2File, 2),
      uploadPhoto(photo3File, 3),
    ])
  } catch {
    return NextResponse.json({ error: 'Error al subir las fotos. Intentá de nuevo.' }, { status: 500 })
  }

  // Crear registro de garantía placeholder
  const today = new Date()
  const warrantyExpires = new Date(today)
  warrantyExpires.setFullYear(warrantyExpires.getFullYear() + 1)
  const purchase_date = today.toISOString().split('T')[0]
  const warranty_expires = warrantyExpires.toISOString().split('T')[0]

  const { data: reg, error: regError } = await admin
    .from('warranty_registrations')
    .insert({
      customer_name,
      customer_email,
      country,
      channel,
      store_name: store_name || null,
      product_description: product_description || null,
      purchase_date,
      warranty_expires,
    })
    .select('id')
    .single()

  if (regError || !reg) {
    return NextResponse.json({ error: 'Error al procesar el reclamo' }, { status: 500 })
  }

  // Crear el reclamo
  const { data, error } = await admin
    .from('warranty_claims')
    .insert({
      registration_id: reg.id,
      issue_type,
      description,
      status: 'pending',
      product_description: product_description || null,
      photo_1,
      photo_2,
      photo_3,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Error al enviar el reclamo' }, { status: 500 })

  // Enviar a Google Sheets
  if (process.env.SHEETS_WEBHOOK_URL) {
    await fetch(process.env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'warranty_claim',
        timestamp: new Date().toISOString(),
        customer_name,
        customer_email,
        country,
        channel,
        store_name: store_name || '',
        product_description: product_description || '',
        issue_type,
        description,
        photo_1,
        photo_2,
        photo_3,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ id: data.id })
}
