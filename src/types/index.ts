export interface Category {
  id: number
  name: string
  created_at: string
}

export interface Product {
  id: number
  category: number | null
  category_name: string | null
  name: string
  dimensions: string
  description: string
  price: string
  image: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id?: number
  product?: number | null
  name: string
  dimensions: string
  description: string
  price: string | number
  quantity: number
  image_url: string
  total_price?: number
  vat_amount?: number
  grand_total?: number
}

export interface Order {
  id: number
  client_name: string
  client_phone: string
  status: 'new' | 'reviewing' | 'confirmed' | 'rejected'
  status_display: string
  notes: string
  items: OrderItem[]
  total_sum: number
  vat_sum: number
  grand_total: number
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<string, string> = {
  new: 'Yangi',
  reviewing: "Ko'rib chiqilmoqda",
  confirmed: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
}

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}
