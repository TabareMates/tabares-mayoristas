export type PriceList = {
  id: string
  name: string
  slug: string
  currency: 'USD' | 'ARS' | 'EUR'
  description: string | null
  show_iva: boolean
  iva_rate: number
  active: boolean
  sort_order: number
  created_at: string
}

export type Client = {
  id: string
  user_id: string
  name: string
  email: string
  company: string | null
  country: string
  currency: 'USD' | 'ARS' | 'EUR'
  is_admin: boolean
  notes: string | null
  active: boolean
  price_list_id: string | null
  created_at: string
}

export type Product = {
  id: string
  code: string
  name: string
  description: string | null
  image_url: string | null
  weight_kg: number | null
  unit: string
  active: boolean
  base_price_usd?: number | null
  base_price_ars?: number | null
  base_price_eur?: number | null
  pvp_ars?: number | null
  pvp_eur?: number | null
  pvp_usd?: number | null
  category?: string | null
}

export type ClientPrice = {
  id: string
  client_id: string
  product_id: string
  price_usd: number | null
  price_ars: number | null
  price_eur: number | null
}

export type ProductWithPrice = Product & {
  price_usd: number | null
  price_ars: number | null
  price_eur: number | null
  pvp_ars?: number | null
  pvp_eur?: number | null
  pvp_usd?: number | null
}

export interface ProductVariant {
  id: string
  product_id: string
  color: string | null
  size: string | null
  label: string
  active: boolean
  created_at: string
}

export interface ClientDiscount {
  id: string
  client_id: string
  category: string
  discount_pct: number
  created_at: string
}

export type OrderStatus = 'pending' | 'approved' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled'

export type Order = {
  id: string
  client_id: string
  status: OrderStatus
  shipping_cost_estimate: number | null
  comments: string | null
  admin_notes: string | null
  total_usd: number | null
  total_ars: number | null
  total_eur: number | null
  dispatch_date: string | null
  payment_status: 'unpaid' | 'paid'
  created_at: string
  updated_at: string
  clients?: Client
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_code: string
  product_name: string
  quantity: number
  unit_price_usd: number | null
  unit_price_ars: number | null
  unit_price_eur: number | null
}

export type CartItem = {
  product: ProductWithPrice
  quantity: number
  variantLabel?: string
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  in_progress: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}
