import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Package, ArrowLeft, ClipboardList } from 'lucide-react'
import { ordersApi } from '../lib/api'
import { Order } from '../types'

function fmt(n: number | string) {
  return Number(n).toLocaleString('ru-RU')
}

export default function OrderView() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ordersApi.getPublic(Number(id))
      .then((res) => setOrder(res.data))
      .catch(() => setError('Zayavka topilmadi'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-surface rounded-xl border border-border p-10 max-w-sm">
          <ClipboardList size={48} className="text-muted mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground mb-1">Zayavka topilmadi</h1>
          <p className="text-sm text-muted">Bu zayavka mavjud emas yoki olib tashlangan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <a
            href="/"
            className="p-2 rounded-lg text-muted hover:bg-border transition-colors"
          >
            <ArrowLeft size={18} />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Zayavka #{order.id}
            </h1>
            <p className="text-muted text-sm mt-0.5">
              {new Date(order.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted font-medium mb-1">Заказчик</p>
              <p className="text-sm font-semibold text-foreground">{order.client_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium mb-1">Tel</p>
              <p className="text-sm font-semibold text-foreground">{order.client_phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium mb-1">Status</p>
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {order.status_display}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-green-50 border-b border-border">
                  {['№', 'Вид', 'Наименование', 'Габариты', 'Краткая характеристика',
                    'Стоимость', 'Кол.во', 'Сумма', 'НДС 12%', 'Сумма с НДС 12%'].map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-3 text-center text-xs font-bold text-foreground uppercase tracking-wide border-r border-border last:border-r-0"
                      style={{ minWidth: i === 0 ? 40 : i === 4 ? 200 : i === 1 ? 90 : 90 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  const price = Number(item.price) || 0
                  const qty = Number(item.quantity) || 0
                  const sum = price * qty
                  const vat = Math.round(sum * 12 / 100)
                  const grand = sum + vat
                  return (
                    <tr key={index} className="border-b border-border hover:bg-steel-light/50">
                      <td className="px-3 py-3 text-center text-sm text-muted font-medium border-r border-border">{index + 1}</td>
                      <td className="px-2 py-2 border-r border-border">
                        <div className="w-[80px] mx-auto">
                          <div className="w-[80px] h-[60px] border border-border rounded flex items-center justify-center overflow-hidden bg-background">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-muted" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground text-center border-r border-border">{item.name}</td>
                      <td className="px-3 py-3 text-sm text-danger font-bold text-center border-r border-border">{item.dimensions}</td>
                      <td className="px-3 py-3 text-xs text-muted border-r border-border" style={{ minWidth: 200 }}>{item.description}</td>
                      <td className="px-3 py-3 text-sm text-foreground text-center border-r border-border">{fmt(price)}</td>
                      <td className="px-3 py-3 text-sm text-foreground text-center border-r border-border">{qty}</td>
                      <td className="px-3 py-3 text-sm font-medium text-foreground text-center border-r border-border">{fmt(sum)}</td>
                      <td className="px-3 py-3 text-sm text-muted text-center border-r border-border">{fmt(vat)}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-foreground text-center">{fmt(grand)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex flex-col items-end gap-2 max-w-sm ml-auto">
            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-muted font-medium">Итого:</span>
              <span className="font-semibold text-foreground">{fmt(order.total_sum)} so&apos;m</span>
            </div>
            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-muted font-medium">НДС 12%:</span>
              <span className="font-semibold text-foreground">{fmt(order.vat_sum)} so&apos;m</span>
            </div>
            <div className="flex items-center justify-between w-full pt-2 border-t border-border">
              <span className="font-bold text-foreground">Итого с НДС:</span>
              <span className="font-bold text-lg text-primary">{fmt(order.grand_total)} so&apos;m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
