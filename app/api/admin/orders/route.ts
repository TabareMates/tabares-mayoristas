import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendApprovalNotification } from '@/lib/email'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  const { data: me } = await admin
    .from('clients').select('*').eq('user_id', user.id).single()

  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: orders } = await admin
    .from('orders')
    .select('*, clients(*), order_items(*)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: orders ?? [], admin: me })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  const { data: me } = await admin
    .from('clients').select('is_admin').eq('user_id', user.id).single()

  if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status, admin_notes, dispatch_date, payment_status } = await request.json()
  const update: Record<string, unknown> = {}
  if (status !== undefined) update.status = status
  if (admin_notes !== undefined) update.admin_notes = admin_notes
  if (dispatch_date !== undefined) update.dispatch_date = dispatch_date
  if (payment_status !== undefined) update.payment_status = payment_status

  const { data: updated, error } = await admin.from('orders').update(update).eq('id', id).select('*, clients(*)').single()
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  // Send approval email when status changes to 'approved'
  if (status === 'approved' && updated?.clients) {
    const c = updated.clients as { name: string; email: string; currency: string }
    const total = c.currency === 'ARS' ? updated.total_ars : c.currency === 'EUR' ? updated.total_eur : updated.total_usd
    await sendApprovalNotification({
      clientName: c.name,
      clientEmail: c.email,
      orderId: updated.id,
      total,
      currency: c.currency,
      dispatchDate: updated.dispatch_date,
      adminNotes: updated.admin_notes,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
