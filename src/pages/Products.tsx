import { useState, useEffect, FormEvent } from 'react'
import { Plus, Pencil, Trash2, Package, Search, FolderPlus, X } from 'lucide-react'
import { productsApi, categoriesApi } from '../lib/api'
import { Product, Category } from '../types'
import toast from 'react-hot-toast'
import ProductModal from '../components/ProductModal'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catLoading, setCatLoading] = useState(false)

  const fetchProducts = () => {
    setLoading(true)
    const params: any = {}
    if (selectedCategory) params.category = selectedCategory
    productsApi.list(params).then((res) => {
      setProducts(res.data)
    }).finally(() => setLoading(false))
  }

  const fetchCategories = () => {
    categoriesApi.list().then((res) => setCategories(res.data)).catch(() => {})
  }

  useEffect(() => { fetchProducts() }, [selectedCategory])
  useEffect(() => { fetchCategories() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return
    try {
      await productsApi.delete(id)
      toast.success("Mahsulot o'chirildi")
      fetchProducts()
    } catch {
      toast.error('Xato yuz berdi')
    }
  }

  const handleCategoryCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) { toast.error('Kategoriya nomini kiriting'); return }
    setCatLoading(true)
    try {
      await categoriesApi.create({ name: catName })
      toast.success("Kategoriya qo'shildi")
      setCatName('')
      setCatModalOpen(false)
      fetchCategories()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xato yuz berdi')
    } finally {
      setCatLoading(false)
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.dimensions.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mahsulotlar</h1>
          <p className="text-muted text-sm mt-1">{products.length} ta mahsulot</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border text-muted rounded-lg text-sm font-medium hover:bg-steel-light transition-colors"
          >
            <FolderPlus size={16} />
            Kategoriya qo&apos;shish
          </button>
          <button
            onClick={() => { setEditProduct(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            Mahsulot qo&apos;shish
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot nomini qidiring..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface"
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${!selectedCategory ? 'bg-primary text-white' : 'bg-steel-light text-muted hover:bg-border'}`}
            >
              Barchasi
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedCategory === String(cat.id) ? 'bg-primary text-white' : 'bg-steel-light text-muted hover:bg-border'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-16 text-center">
          <Package size={40} className="text-muted mx-auto mb-3" />
          <p className="text-foreground font-medium">Mahsulotlar topilmadi</p>
          <p className="text-muted text-sm mt-1">Yangi mahsulot qo&apos;shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] bg-steel-light flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Package size={32} className="text-muted" />
                )}
              </div>
              <div className="p-4">
                {product.category_name && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold mb-1.5">
                    {product.category_name}
                  </span>
                )}
                <h3 className="font-semibold text-foreground text-sm leading-tight">{product.name}</h3>
                {product.dimensions && (
                  <p className="text-danger text-xs font-bold mt-1">{product.dimensions}</p>
                )}
                {product.description && (
                  <p className="text-muted text-xs mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <p className="font-bold text-foreground text-sm">
                    {Number(product.price).toLocaleString('ru-RU')} so&apos;m
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setEditProduct(product); setModalOpen(true) }}
                      className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ProductModal
          product={editProduct}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchProducts(); fetchCategories() }}
        />
      )}

      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Yangi kategoriya qo&apos;shish</h2>
              <button onClick={() => setCatModalOpen(false)} className="p-1.5 rounded-lg text-muted hover:bg-steel-light transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCategoryCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Kategoriya nomi *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Masalan: Stol, Stul, Divan..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:bg-steel-light transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={catLoading}
                  className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {catLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Qo&apos;shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
