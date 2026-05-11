// Google Apps Script — Webhook de Garantías Tabaré Mates
// Sheet ID: 1aMDtGp02WYEgE633ZhJcflHI6uxWHTF5W_u1Q20pdZg
// Hojas: "Registros" y "Reclamos"
// Deploy como: Web App → Execute as: Me → Who can access: Anyone

const SHEET_ID = '1aMDtGp02WYEgE633ZhJcflHI6uxWHTF5W_u1Q20pdZg'

// Encabezados para cada hoja
const HEADERS_REGISTROS = [
  'Fecha registro',
  'Nombre cliente',
  'Email',
  'País',
  'Canal de compra',
  'Nombre local/tienda',
  'Producto',
  'Fecha de compra',
  'Garantía vence',
]

const HEADERS_RECLAMOS = [
  'Fecha reclamo',
  'Nombre cliente',
  'Email',
  'País',
  'Canal de compra',
  'Nombre local/tienda',
  'Producto',
  'Tipo de problema',
  'Descripción',
  'Foto 1',
  'Foto 2',
  'Foto 3',
]

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents)
    const ss = SpreadsheetApp.openById(SHEET_ID)

    if (payload.action === 'warranty_registration') {
      const sheet = getOrCreateSheet(ss, 'Registros', HEADERS_REGISTROS)
      sheet.appendRow([
        formatDate(payload.timestamp),
        payload.customer_name || '',
        payload.customer_email || '',
        payload.country || '',
        formatChannel(payload.channel),
        payload.store_name || '',
        payload.product_description || '',
        payload.purchase_date || '',
        payload.warranty_expires || '',
      ])
    }

    if (payload.action === 'warranty_claim') {
      const sheet = getOrCreateSheet(ss, 'Reclamos', HEADERS_RECLAMOS)
      sheet.appendRow([
        formatDate(payload.timestamp),
        payload.customer_name || '',
        payload.customer_email || '',
        payload.country || '',
        formatChannel(payload.channel),
        payload.store_name || '',
        payload.product_description || '',
        formatIssueType(payload.issue_type),
        payload.description || '',
        payload.photo_1 || '',
        payload.photo_2 || '',
        payload.photo_3 || '',
      ])
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

// Crea la hoja si no existe y agrega encabezados con formato
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    const headerRow = sheet.getRange(1, 1, 1, headers.length)
    headerRow.setValues([headers])
    headerRow.setBackground('#2D4535')
    headerRow.setFontColor('#F0E8D8')
    headerRow.setFontWeight('bold')
    sheet.setFrozenRows(1)
    // Ancho de columnas automático
    for (let i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 160)
    }
  }
  return sheet
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return Utilities.formatDate(d, 'America/Buenos_Aires', 'dd/MM/yyyy HH:mm')
}

function formatChannel(val) {
  const map = { local: 'Local físico', online: 'Tienda online', otro: 'Otro' }
  return map[val] || val || ''
}

function formatIssueType(val) {
  const map = {
    defecto_fabricacion: 'Defecto de fabricación',
    rajadura: 'Rajadura o rotura',
    filtrado: 'Filtrado / pérdida de agua',
    bombilla: 'Problema con la bombilla',
    terminacion: 'Problema de terminación',
    otro: 'Otro',
  }
  return map[val] || val || ''
}
