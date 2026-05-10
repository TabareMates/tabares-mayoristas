import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { registration_id, issue_type, description } = await request.json()

  if (!registration_id || !issue_type || !description) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verificar que el registro existe
  const { data: reg, error: regError } = await admin
    .from('warranty_registrations')
    .select('id, warranty_expires, customer_name')
    .eq('id', registration_id)
    .single()

  if (regError || !reg) {
    return NextResponse.json({ error: 'Registro de garantía no encontrado' }, { status: 404 })
  }

  // Verificar que la garantía no esté vencida
  const today = new Date().toISOString().split('T')[0]
  if (reg.warranty_expires < today) {
    return NextResponse.json({ error: 'La garantía está vencida' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('warranty_claims')
    .insert({ registration_id, issue_type, description, status: 'pending' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Error al enviar el reclamo' }, { status: 500 })

  return NextResponse.json({ id: data.id })
}
