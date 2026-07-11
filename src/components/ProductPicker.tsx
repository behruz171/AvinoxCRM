import { useState, useEffect } from 'react'
import { Search, X, Plus, Check, Package } from 'lucide-react'
import { Product, Category } from '../types'
import { categoriesApi } from '../lib/api'

interface Props {
  products: Product[]
  onSelect: (products: Product[]) => void
  onClose: () => void
}

export default function ProductPicker({ products, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data)).catch(() => {})
  }, [])

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.dimensions.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !selectedCategory || String(p.category) === selectedCategory
    return matchSearch && matchCategory
  })

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    const selected = products.filter((p) => selectedIds.has(p.id))
    onSelect(selected)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Mahsulot tanlash</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-background">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Nom yoki o'lcham bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedCategory ? 'bg-primary text-white' : 'bg-steel-light text-muted hover:bg-border'}`}
              >
                Barchasi
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === String(cat.id) ? 'bg-primary text-white' : 'bg-steel-light text-muted hover:bg-border'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted">
              <Search className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Mahsulot topilmadi</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((product) => {
                const selected = selectedIds.has(product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-steel-light'}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-background flex-shrink-0 border border-border">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{product.name}</p>
                      {product.category_name && (
                        <p className="text-xs text-muted mt-0.5">{product.category_name}</p>
                      )}
                      {product.dimensions && (
                        <p className="text-xs text-danger font-semibold mt-0.5">{product.dimensions}</p>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-foreground flex-shrink-0">
                      {Number(product.price).toLocaleString('ru-RU')} so&apos;m
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted">
            {selectedIds.size > 0 ? `${selectedIds.size} ta mahsulot tanlandi` : 'Mahsulot tanlanmagan'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted hover:bg-steel-light transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              <Plus size={16} />
              Qo&apos;shish ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
