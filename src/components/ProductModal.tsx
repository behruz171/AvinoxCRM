import { useState, useEffect, FormEvent, useRef, useCallback } from 'react'
import { X, Upload, Clipboard, ExternalLink } from 'lucide-react'
import { productsApi, categoriesApi } from '../lib/api'
import { Product, Category } from '../types'
import toast from 'react-hot-toast'

interface Props {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

export default function ProductModal({ product, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: product?.name || '',
    dimensions: product?.dimensions || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category ? String(product.category) : '',
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>(product?.image_url || '')
  const [loading, setLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data)).catch(() => {})
  }, [])

  const setFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayllari qabul qilinadi')
      return
    }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }, [])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFile(file)
  }

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setFile(file)
  }

  // Paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) setFile(file)
          break
        }
      }
    }
    const el = dropRef.current
    if (el) {
      el.addEventListener('paste', handlePaste)
      return () => el.removeEventListener('paste', handlePaste)
    }
  }, [setFile])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    if (imageFile) data.append('image', imageFile)

    try {
      if (product) {
        await productsApi.update(product.id, data)
        toast.success('Mahsulot yangilandi')
      } else {
        await productsApi.create(data)
        toast.success("Mahsulot qo'shildi")
      }
      onSaved()
    } catch (err: any) {
      const errs = err.response?.data
      if (errs) toast.error(Object.values(errs).flat().join(', '))
      else toast.error('Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            {product ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-steel-light transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            ref={dropRef}
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative outline-none ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary'
            }`}
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover absolute inset-0" />
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Upload size={24} className="text-muted" />
                <p className="text-sm text-muted font-medium">Rasm yuklash uchun bosing</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted">
                    <ExternalLink size={10} /> Drag & Drop
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted">
                    <Clipboard size={10} /> Ctrl+V
                  </span>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nomi *</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              placeholder="Mahsulot nomi"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kategoriya</label>
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface"
            >
              <option value="">Kategoriya tanlanmagan</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">O&apos;lchami (Gabarity)</label>
            <input
              type="text"
              value={form.dimensions}
              onChange={set('dimensions')}
              placeholder="700x700x850"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tavsif (Xarakteristika)</label>
            <textarea
              value={form.description}
              onChange={set('description') as any}
              rows={3}
              placeholder="Mahsulot haqida ma'lumot..."
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Narxi (so&apos;m) *</label>
            <input
              type="number"
              value={form.price}
              onChange={set('price')}
              required
              min="0"
              placeholder="1500000"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-steel-light transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {product ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
