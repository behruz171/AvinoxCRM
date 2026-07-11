import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ClipboardList, Search, Trash2 } from 'lucide-react'
import { ordersApi } from '../lib/api'
import { Order } from '../types'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchOrders = () => {
    setLoading(true)
    ordersApi.list().then((res) => setOrders(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Zayavkani o'chirishni tasdiqlaysizmi?")) return
    try {
      await ordersApi.delete(id)
      toast.success("Zayavka o'chirildi")
      fetchOrders()
    } catch {
      toast.error('Xato yuz berdi')
    }
  }

  const filtered = orders.filter((o) =>
    o.client_name.toLowerCase().includes(search.toLowerCase()) ||
    o.client_phone.includes(search) ||
    String(o.id).includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Zayavkalar</h1>
          <p className="text-muted text-sm mt-1">{orders.length} ta zayavka</p>
        </div>
        <Link
          to="/orders/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          Yangi zayavka
        </Link>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mijoz ismi, telefon yoki raqam..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface"
        />
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={40} className="text-muted mx-auto mb-3" />
            <p className="text-foreground font-medium">Zayavkalar topilmadi</p>
            <p className="text-muted text-sm mt-1">Yangi zayavka yarating</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-steel-light">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">№</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Mijoz</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Telefon</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Mahsulotlar</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Jami (NDS bilan)</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Sana</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-steel-light transition-colors">
                  <td className="px-5 py-4">
                    <Link to={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/orders/${order.id}`} className="text-sm text-foreground hover:text-primary">
                      {order.client_name || '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">{order.client_phone || '—'}</td>
                  <td className="px-5 py-4 text-sm text-muted">{order.items.length} ta</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-foreground">
                    {Number(order.grand_total).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-muted">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={(e) => handleDelete(order.id, e)}
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
