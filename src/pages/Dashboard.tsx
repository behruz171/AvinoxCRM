import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ClipboardList, CheckCircle, Clock, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { productsApi, ordersApi } from '../lib/api'
import { Order } from '../types'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ products: 0, orders: 0, confirmed: 0, new: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    Promise.all([productsApi.list(), ordersApi.list()]).then(([pRes, oRes]) => {
      const orders: Order[] = oRes.data
      setStats({
        products: pRes.data.length,
        orders: orders.length,
        confirmed: orders.filter((o) => o.status === 'confirmed').length,
        new: orders.filter((o) => o.status === 'new').length,
      })
      setRecentOrders(orders.slice(0, 5))
    })
  }, [])

  const cards = [
    { label: 'Jami mahsulotlar', value: stats.products, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Jami zayavkalar', value: stats.orders, icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
    { label: 'Tasdiqlangan', value: stats.confirmed, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Yangi', value: stats.new, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Xush kelibsiz, {user?.first_name || user?.username}!
          </h1>
          <p className="text-muted text-sm mt-1">AVINOX CRM boshqaruv paneli</p>
        </div>
        <Link
          to="/orders/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          Yangi zayavka
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-surface rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">So&apos;ngi zayavkalar</h2>
          <Link to="/orders" className="text-sm text-primary hover:underline">
            Barchasini ko&apos;rish
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentOrders.length === 0 && (
            <div className="px-6 py-10 text-center text-muted text-sm">
              Hali zayavkalar yo&apos;q
            </div>
          )}
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-steel-light transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  Zayavka #{order.id} — {order.client_name || 'Mijoz ko\'rsatilmagan'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(order.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">
                  {Number(order.grand_total).toLocaleString('ru-RU')} so&apos;m
                </span>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
