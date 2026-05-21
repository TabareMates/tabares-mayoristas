const GMAIL_WEBHOOK = process.env.GMAIL_WEBHOOK_URL

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface OrderEmailParams {
  clientName: string
  clientEmail: string
  orderId: string
  items: { product_name: string; quantity: number; unit_price: number | null }[]
  total: number | null
  currency: string
  comments?: string | null
  shippingCost?: number | null
}

function formatCurrency(value: number | null, currency: string): string {
  if (!value) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value)
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!GMAIL_WEBHOOK) return
  await fetch(GMAIL_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html }),
  })
}

export async function sendOrderNotification(params: OrderEmailParams) {
  if (!GMAIL_WEBHOOK) return

  const { clientName, clientEmail, orderId, items, total, currency, comments, shippingCost } = params
  const orderRef = orderId.slice(0, 8).toUpperCase()

  const itemsHtml = items.map(item =>
    `<tr>
      <td style="padding:6px 0;border-bottom:1px solid #e8e0d4;">${item.product_name}</td>
      <td style="padding:6px 0;border-bottom:1px solid #e8e0d4;text-align:center;">${item.quantity}</td>
      <td style="padding:6px 0;border-bottom:1px solid #e8e0d4;text-align:right;">${formatCurrency(item.unit_price, currency)}</td>
    </tr>`
  ).join('')

  // Email para Manuel
  const adminHtml = `
  <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#2D4535;">
    <div style="background:#2D4535;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h2 style="color:#F0E8D8;margin:0;font-size:18px;">🧉 Nuevo pedido — Tabaré Mates</h2>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e8e0d4;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 4px;"><strong>${clientName}</strong> confirmó un pedido.</p>
      <p style="color:#888;font-size:13px;margin:0 0 20px;">Pedido #${orderRef} · ${new Date().toLocaleDateString('es-AR')}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="color:#999;font-size:12px;">
          <th style="text-align:left;padding-bottom:8px;">Producto</th>
          <th style="text-align:center;padding-bottom:8px;">Cant.</th>
          <th style="text-align:right;padding-bottom:8px;">Precio unit.</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${shippingCost ? `<p style="text-align:right;font-size:13px;color:#666;margin-top:8px;">Envío estimado: ${formatCurrency(shippingCost, currency)}</p>` : ''}
      <p style="text-align:right;font-size:18px;font-weight:bold;color:#B8935A;margin:8px 0 16px;">Total: ${formatCurrency(total, currency)}</p>
      ${comments ? `<div style="padding:12px;background:#F0E8D8;border-radius:8px;font-size:13px;margin-bottom:16px;"><strong>Comentario:</strong> ${escapeHtml(comments)}</div>` : ''}
      <div style="font-size:13px;color:#666;border-top:1px solid #e8e0d4;padding-top:12px;">
        <p style="margin:0;">📧 <a href="mailto:${clientEmail}" style="color:#B8935A;">${clientEmail}</a></p>
        <p style="margin:6px 0 0;"><a href="https://tabares-mayoristas.vercel.app/admin" style="color:#2D4535;font-weight:bold;">Ver en el panel →</a></p>
      </div>
    </div>
  </div>`

  // Email para el cliente
  const clientHtml = `
  <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#2D4535;">
    <div style="background:#2D4535;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h2 style="color:#F0E8D8;margin:0;font-size:18px;">🧉 Tu pedido fue recibido</h2>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e8e0d4;border-radius:0 0 12px 12px;">
      <p>Hola <strong>${clientName}</strong>, recibimos tu pedido y te confirmamos a la brevedad.</p>
      <p style="color:#888;font-size:13px;">Pedido #${orderRef}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="color:#999;font-size:12px;">
          <th style="text-align:left;padding-bottom:8px;">Producto</th>
          <th style="text-align:center;padding-bottom:8px;">Cant.</th>
          <th style="text-align:right;padding-bottom:8px;">Precio unit.</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:18px;font-weight:bold;color:#B8935A;margin:12px 0 16px;">Total: ${formatCurrency(total, currency)}</p>
      <div style="font-size:13px;color:#666;border-top:1px solid #e8e0d4;padding-top:12px;">
        <p style="margin:0;">Seguí el estado de tu pedido en <a href="https://tabares-mayoristas.vercel.app/orders" style="color:#B8935A;">tu panel</a>.</p>
        <p style="margin:6px 0 0;">Consultas: <a href="https://wa.me/5491166407189" style="color:#25D366;">WhatsApp</a> · <a href="mailto:manuel@tabare.com.ar" style="color:#B8935A;">manuel@tabare.com.ar</a></p>
      </div>
    </div>
  </div>`

  await Promise.allSettled([
    sendEmail('manuel@tabare.com.ar', `🧉 Nuevo pedido de ${clientName} — #${orderRef}`, adminHtml),
    sendEmail(clientEmail, `Tu pedido fue recibido — #${orderRef}`, clientHtml),
  ])
}

interface WarrantyConfirmationParams {
  customerName: string
  customerEmail: string
  productDescription: string
  purchaseDate: string
  warrantyExpires: string
  storeName?: string
}

export async function sendWarrantyConfirmation(params: WarrantyConfirmationParams) {
  if (!GMAIL_WEBHOOK) return

  const { customerName, customerEmail, productDescription, purchaseDate, warrantyExpires, storeName } = params

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const storeBlock = storeName
    ? `<p style="margin:4px 0;font-size:14px;">📍 <strong>Local:</strong> ${storeName}</p>`
    : ''

  const html = `
  <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#2D4535;">
    <div style="background:#2D4535;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h2 style="color:#F0E8D8;margin:0;font-size:20px;">🛡️ Tu garantía está activada</h2>
      <p style="color:#F0E8D8;opacity:0.7;margin:6px 0 0;font-size:13px;">Tabaré Mates</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e8e0d4;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;">Hola <strong>${customerName}</strong>, tu garantía quedó registrada correctamente. Guardá este mail — es tu comprobante.</p>

      <div style="background:#F0E8D8;border-radius:10px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:13px;color:#2D4535;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Detalle de la garantía</p>
        <p style="margin:4px 0;font-size:14px;">🧉 <strong>Producto:</strong> ${productDescription}</p>
        ${storeBlock}
        <p style="margin:4px 0;font-size:14px;">📅 <strong>Fecha de compra:</strong> ${formatDate(purchaseDate)}</p>
        <p style="margin:4px 0;font-size:14px;">✅ <strong>Garantía válida hasta:</strong> <span style="color:#2D4535;font-weight:700;">${formatDate(warrantyExpires)}</span></p>
      </div>

      <div style="background:#fff;border:1px solid #e8e0d4;border-radius:10px;padding:16px;margin-bottom:16px;font-size:13px;color:#666;">
        <p style="margin:0 0 6px;font-weight:600;color:#2D4535;">¿Necesitás hacer un reclamo?</p>
        <p style="margin:0;">Ingresá a <a href="https://tabares-mayoristas.vercel.app/garantia/reclamo" style="color:#B8935A;font-weight:600;">tabares-mayoristas.vercel.app/garantia/reclamo</a> y completá el formulario. Respondemos en 48 hs hábiles.</p>
      </div>

      <div style="font-size:13px;color:#888;border-top:1px solid #e8e0d4;padding-top:12px;text-align:center;">
        <p style="margin:0;">¿Tenés dudas? Escribinos a <a href="mailto:hola@tabare.com.ar" style="color:#B8935A;">hola@tabare.com.ar</a></p>
        <p style="margin:8px 0 0;font-size:11px;color:#aaa;">Nuestra producción se realiza junto a las ONGs ADEEI y Punto de Encuentro, impulsando la inclusión laboral.</p>
      </div>
    </div>
  </div>`

  await sendEmail(customerEmail, '🛡️ Tu garantía Tabaré Mates está activada', html)
}

interface ApprovalEmailParams {
  clientName: string
  clientEmail: string
  orderId: string
  total: number | null
  currency: string
  dispatchDate?: string | null
  adminNotes?: string | null
}

export async function sendApprovalNotification(params: ApprovalEmailParams) {
  if (!GMAIL_WEBHOOK) return

  const { clientName, clientEmail, orderId, total, currency, dispatchDate, adminNotes } = params
  const orderRef = orderId.slice(0, 8).toUpperCase()

  const dispatchLine = dispatchDate
    ? `<p style="margin:8px 0 0;font-size:14px;">📦 <strong>Fecha estimada de despacho:</strong> ${new Date(dispatchDate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>`
    : ''

  const notesLine = adminNotes
    ? `<div style="padding:12px;background:#F0E8D8;border-radius:8px;font-size:13px;margin-top:16px;"><strong>Nota:</strong> ${escapeHtml(adminNotes)}</div>`
    : ''

  const clientHtml = `
  <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#2D4535;">
    <div style="background:#2D4535;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h2 style="color:#F0E8D8;margin:0;font-size:18px;">✅ Tu pedido fue aprobado</h2>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e8e0d4;border-radius:0 0 12px 12px;">
      <p>Hola <strong>${clientName}</strong>, tu pedido fue aprobado y está en proceso.</p>
      <p style="color:#888;font-size:13px;margin-top:4px;">Pedido #${orderRef} · Total: <strong style="color:#B8935A;">${formatCurrency(total, currency)}</strong></p>
      ${dispatchLine}
      ${notesLine}
      <div style="font-size:13px;color:#666;border-top:1px solid #e8e0d4;padding-top:16px;margin-top:16px;">
        <p style="margin:0;">Seguí el estado en <a href="https://tabares-mayoristas.vercel.app/orders" style="color:#B8935A;">tu panel</a>.</p>
        <p style="margin:6px 0 0;">Consultas: <a href="https://wa.me/5491166407189" style="color:#25D366;">WhatsApp</a> · <a href="mailto:manuel@tabare.com.ar" style="color:#B8935A;">manuel@tabare.com.ar</a></p>
      </div>
    </div>
  </div>`

  await sendEmail(clientEmail, `✅ Tu pedido fue aprobado — #${orderRef}`, clientHtml)
}
