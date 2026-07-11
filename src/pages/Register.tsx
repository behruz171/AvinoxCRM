import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    password: '',
    password2: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      toast.error('Parollar mos kelmaydi')
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!")
      navigate('/dashboard')
    } catch (err: any) {
      const errors = err.response?.data
      if (errors) {
        const msgs = Object.values(errors).flat().join(', ')
        toast.error(msgs)
      } else {
        toast.error("Xato yuz berdi")
      }
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { id: 'username', label: 'Foydalanuvchi nomi *', type: 'text', placeholder: 'username' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { id: 'first_name', label: 'Ism', type: 'text', placeholder: 'Ism' },
    { id: 'last_name', label: 'Familiya', type: 'text', placeholder: 'Familiya' },
    { id: 'phone', label: 'Telefon', type: 'tel', placeholder: '+998 90 000 00 00' },
    { id: 'company', label: 'Kompaniya', type: 'text', placeholder: 'Kompaniya nomi' },
    { id: 'password', label: 'Parol *', type: 'password', placeholder: '••••••' },
    { id: 'password2', label: 'Parolni tasdiqlang *', type: 'password', placeholder: '••••••' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">AVINOX CRM</h1>
          <p className="text-muted text-sm mt-1">Yangi hisob yaratish</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.id} className={f.id === 'username' || f.id === 'email' ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.id]}
                    onChange={set(f.id)}
                    placeholder={f.placeholder}
                    required={f.label.endsWith('*')}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Ro&apos;yxatdan o&apos;tish
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Hisobingiz bormi?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
