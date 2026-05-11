export type Lang = 'es' | 'en'

export const t = {
  es: {
    // Registration page
    reg_title: 'Garantía Tabaré Mates',
    reg_subtitle: 'Registrá tu compra para activar tu garantía.',
    reg_subtitle2: 'La garantía cubre 1 año desde la fecha de compra.',
    reg_did_you_know: '¿Sabías que?',
    reg_adeei_text: 'Nuestra producción se realiza junto a las ONGs ADEEI y Punto de Encuentro, impulsando la inclusión laboral a través del trabajo.',
    reg_adeei_link1: 'Conocer ADEEI →',
    reg_adeei_link2: 'Conocer Punto de Encuentro →',
    reg_section_personal: 'Tus datos',
    reg_section_purchase: 'Datos de compra',
    reg_name_label: 'Nombre completo',
    reg_name_placeholder: 'Ej: Ana García',
    reg_email_label: 'Email',
    reg_email_placeholder: 'tu@email.com',
    reg_country_label: 'País',
    reg_country_placeholder: 'Seleccioná tu país',
    reg_channel_label: '¿Dónde compraste?',
    reg_store_label: 'Nombre del local o tienda',
    reg_store_optional: '(opcional)',
    reg_store_placeholder: 'Ej: Mate & Cía, Valencia',
    reg_date_label: 'Fecha de compra',
    reg_product_label: '¿Qué producto compraste?',
    reg_product_placeholder: 'Ej: Mate de calabaza natural con virola de alpaca, talla M',
    reg_submit: 'Activar garantía',
    reg_submitting: 'Registrando...',
    reg_required: '*',

    // Success
    reg_success_title: '¡Garantía activada!',
    reg_success_text: 'Tu garantía queda registrada por 1 año desde la fecha de compra.',
    reg_success_email: 'Revisá tu mail — te enviamos la confirmación con todos los datos de tu garantía para que la tengas guardada.',
    reg_success_contact: '¿Tenés dudas? Escribinos a',

    // Claim page
    claim_title: 'Reclamo de garantía',
    claim_subtitle: 'Completá el formulario con todos los datos para gestionar tu reclamo.',
    claim_section_personal: 'Tus datos',
    claim_section_purchase: 'Datos de compra',
    claim_section_problem: 'Detalle del problema',
    claim_section_photos: 'Fotos del producto',
    claim_photos_required: 'Las 3 fotos son obligatorias para procesar el reclamo.',
    claim_photo_label: 'Foto',
    claim_issue_label: '¿Qué problema tiene el producto?',
    claim_desc_label: 'Descripción del problema',
    claim_desc_placeholder: 'Describí con detalle qué pasó, cuándo empezó y cómo usás el producto...',
    claim_submit: 'Enviar reclamo',
    claim_submitting: 'Enviando...',

    // Claim success
    claim_success_title: '¡Reclamo enviado!',
    claim_success_text: 'Recibimos tu reclamo y lo revisamos en las próximas 48 horas hábiles. Te contactamos por email con la resolución.',
    claim_success_contact: '¿Tenés dudas? Escribinos a',

    // Shared
    channel_local: 'Local físico',
    channel_online: 'Tienda online',
    channel_other: 'Otro',

    issue_defecto: 'Defecto de fabricación',
    issue_rajadura: 'Rajadura o rotura',
    issue_filtrado: 'Filtrado / pérdida de agua',
    issue_bombilla: 'Problema con la bombilla',
    issue_terminacion: 'Problema de terminación',
    issue_otro: 'Otro',

    error_required: 'Faltan campos requeridos.',
    error_photos: 'Las 3 fotos son obligatorias.',
    error_generic: 'Error al enviar. Intentá de nuevo.',
  },
  en: {
    // Registration page
    reg_title: 'Tabaré Mates Warranty',
    reg_subtitle: 'Register your purchase to activate your warranty.',
    reg_subtitle2: 'The warranty covers 1 year from the purchase date.',
    reg_did_you_know: 'Did you know?',
    reg_adeei_text: 'Our products are made together with ADEEI and Punto de Encuentro NGOs, promoting job inclusion and real opportunities through work.',
    reg_adeei_link1: 'Learn about ADEEI →',
    reg_adeei_link2: 'Learn about Punto de Encuentro →',
    reg_section_personal: 'Your details',
    reg_section_purchase: 'Purchase details',
    reg_name_label: 'Full name',
    reg_name_placeholder: 'E.g.: Ana García',
    reg_email_label: 'Email',
    reg_email_placeholder: 'your@email.com',
    reg_country_label: 'Country',
    reg_country_placeholder: 'Select your country',
    reg_channel_label: 'Where did you buy it?',
    reg_store_label: 'Store name',
    reg_store_optional: '(optional)',
    reg_store_placeholder: 'E.g.: Mate & Cía, Valencia',
    reg_date_label: 'Purchase date',
    reg_product_label: 'What product did you buy?',
    reg_product_placeholder: 'E.g.: Natural gourd mate with alpaca rim, size M',
    reg_submit: 'Activate warranty',
    reg_submitting: 'Registering...',
    reg_required: '*',

    // Success
    reg_success_title: 'Warranty activated!',
    reg_success_text: 'Your warranty is registered for 1 year from the purchase date.',
    reg_success_email: 'Check your email — we sent you a confirmation with all your warranty details to keep on file.',
    reg_success_contact: 'Questions? Write to us at',

    // Claim page
    claim_title: 'Warranty Claim',
    claim_subtitle: 'Fill in the form with all the details to process your claim.',
    claim_section_personal: 'Your details',
    claim_section_purchase: 'Purchase details',
    claim_section_problem: 'Problem details',
    claim_section_photos: 'Product photos',
    claim_photos_required: 'All 3 photos are required to process the claim.',
    claim_photo_label: 'Photo',
    claim_issue_label: 'What problem does the product have?',
    claim_desc_label: 'Problem description',
    claim_desc_placeholder: 'Describe in detail what happened, when it started and how you use the product...',
    claim_submit: 'Submit claim',
    claim_submitting: 'Sending...',

    // Claim success
    claim_success_title: 'Claim submitted!',
    claim_success_text: 'We received your claim and will review it within the next 48 business hours. We will contact you by email with the resolution.',
    claim_success_contact: 'Questions? Write to us at',

    // Shared
    channel_local: 'Physical store',
    channel_online: 'Online store',
    channel_other: 'Other',

    issue_defecto: 'Manufacturing defect',
    issue_rajadura: 'Crack or break',
    issue_filtrado: 'Water leak',
    issue_bombilla: 'Straw problem',
    issue_terminacion: 'Finishing problem',
    issue_otro: 'Other',

    error_required: 'Required fields are missing.',
    error_photos: 'All 3 photos are required.',
    error_generic: 'Error submitting. Please try again.',
  },
}
