import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ClipboardList, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { to: '/products', label: 'Mahsulotlar', icon: Package },
  { to: '/orders', label: 'Zayavkalar', icon: ClipboardList },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Muvaffaqiyatli chiqildi')
    navigate('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-sidebar flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">AVINOX</p>
            <p className="text-white/40 text-xs mt-0.5">CRM Tizimi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-white/60 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <User size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.first_name || user?.username}
            </p>
            <p className="text-white/40 text-xs truncate">{user?.company || 'Foydalanuvchi'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>
    </aside>
  )
}
