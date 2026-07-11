import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, FileSpreadsheet, FileText, Save, ArrowLeft, Package, Layers, Share2 } from 'lucide-react'
import SpeechInput from '../components/SpeechInput'
import { ordersApi, productsApi } from '../lib/api'
import { exportExcel, exportPdf } from '../lib/export'
import { Product, OrderItem, Order } from '../types'
import toast from 'react-hot-toast'
import ProductPicker from '../components/ProductPicker'

const STATUS_OPTIONS = [
  { value: 'new', label: 'Yangi' },
  { value: 'reviewing', label: "Ko'rib chiqilmoqda" },
  { value: 'confirmed', label: 'Tasdiqlangan' },
  { value: 'rejected', label: 'Rad etilgan' },
]

const emptyItem = (): OrderItem => ({
  product: null,
  name: '',
  dimensions: '',
  description: '',
  price: 0,
  quantity: 1,
  image_url: '',
})

function fmt(n: number | string) {
  return Number(n).toLocaleString('ru-RU')
}

export default function OrderForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = id && id !== 'new'

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItem[]>([emptyItem()])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!isEdit)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [pickerIndex, setPickerIndex] = useState(-1)
  const [bulkPickerOpen, setBulkPickerOpen] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ type: string; pct: number } | null>(null)

  useEffect(() => {
    productsApi.list().then((res) => setProducts(res.data))
  }, [])

  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      ordersApi.get(Number(id))
        .then((res) => {
          const order: Order = res.data
          setClientName(order.client_name)
          setClientPhone(order.client_phone)
          setStatus(order.status)
          setNotes(order.notes)
          setItems(order.items.length > 0 ? order.items : [emptyItem()])
          setOrderId(order.id)
        })
        .catch(() => toast.error('Zayavka topilmadi'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addItemFromProduct = (product: Product, index: number) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        product: product.id,
        name: product.name,
        dimensions: product.dimensions,
        description: product.description,
        price: product.price,
        image_url: product.image_url || '',
      }
      return updated
    })
  }

  const addItemsFromBulk = (selected: Product[]) => {
    setItems((prev) => {
      const updated = [...prev]
      if (updated.length === 1 && !updated[0].name.trim() && !updated[0].price) {
        updated[0] = {
          product: selected[0].id,
          name: selected[0].name,
          dimensions: selected[0].dimensions,
          description: selected[0].description,
          price: selected[0].price,
          quantity: 1,
          image_url: selected[0].image_url || '',
        }
        return [...updated, ...selected.slice(1).map((p) => ({
          product: p.id,
          name: p.name,
          dimensions: p.dimensions,
          description: p.description,
          price: p.price,
          quantity: 1,
          image_url: p.image_url || '',
        }))]
      }
      return [...updated, ...selected.map((p) => ({
        product: p.id,
        name: p.name,
        dimensions: p.dimensions,
        description: p.description,
        price: p.price,
        quantity: 1,
        image_url: p.image_url || '',
      }))]
    })
  }

  const addRow = () => setItems((prev) => [...prev, emptyItem()])

  const removeRow = (index: number) => {
    if (items.length === 1) { setItems([emptyItem()]); return }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const totals = items.map((item) => {
    const price = Number(item.price) || 0
    const qty = Number(item.quantity) || 0
    const sum = price * qty
    const vat = Math.round(sum * 12 / 100)
    return { sum, vat, grand: sum + vat }
  })
  const totalSum = totals.reduce((a, t) => a + t.sum, 0)
  const totalVat = Math.round(totalSum * 12 / 100)
  const grandTotal = totalSum + totalVat

  const handleSave = async () => {
    if (!clientName.trim()) { toast.error('Mijoz ismini kiriting'); return }
    const validItems = items.filter((it) => it.name.trim())
    if (validItems.length === 0) { toast.error('Kamida bitta mahsulot kiriting'); return }
    setSaving(true)
    const payload = {
      client_name: clientName,
      client_phone: clientPhone,
      status,
      notes,
      items: validItems.map((it) => ({
        product: it.product || null,
        name: it.name,
        dimensions: it.dimensions,
        description: it.description,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        image_url: it.image_url || '',
      })),
    }
    try {
      if (isEdit && orderId) {
        await ordersApi.update(orderId, payload)
        toast.success('Zayavka yangilandi')
      } else {
        const res = await ordersApi.create(payload)
        setOrderId(res.data.id)
        toast.success('Zayavka yaratildi')
        navigate(`/orders/${res.data.id}`, { replace: true })
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xato yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async (type: 'excel' | 'pdf') => {
    if (!orderId && !isEdit) {
      toast.error("Avval zayavkani saqlang")
      return
    }
    const validItems = items.filter((it) => it.name.trim())
    if (validItems.length === 0) {
      toast.error('Mahsulotlar topilmadi')
      return
    }
    const eid = orderId || Number(id)
    const dateStr = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
    setExportProgress({ type, pct: 0 })
    try {
      if (type === 'excel') {
        exportExcel(eid, dateStr, clientName, clientPhone, validItems, (pct) => setExportProgress({ type, pct }))
      } else {
        exportPdf(eid, dateStr, clientName, clientPhone, validItems, (pct) => setExportProgress({ type, pct }))
      }
      toast.success(`${type.toUpperCase()} yuklab olindi`)
    } catch {
      toast.error('Export xatosi')
    } finally {
      setExportProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg text-muted hover:bg-border transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? `Zayavka #${id} tahrirlash` : 'Yangi zayavka'}
            </h1>
            <p className="text-muted text-sm mt-0.5">
              {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(isEdit || orderId) && (
            <>
              <button
                onClick={() => handleExport('excel')}
                disabled={!!exportProgress}
                className="flex items-center gap-2 px-4 py-2 border border-success text-success rounded-lg text-sm font-medium hover:bg-green-50 transition-colors disabled:opacity-60"
              >
                {exportProgress?.type === 'excel' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {exportProgress.pct}%
                  </>
                ) : (
                  <><FileSpreadsheet size={16} /> Excel</>
                )}
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!exportProgress}
                className="flex items-center gap-2 px-4 py-2 border border-danger text-danger rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {exportProgress?.type === 'pdf' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {exportProgress.pct}%
                  </>
                ) : (
                  <><FileText size={16} /> PDF</>
                )}
              </button>
              <button
                onClick={() => navigate(`/orders/${orderId || id}/view`)}
                className="flex items-center gap-2 px-4 py-2 border border-border text-muted rounded-lg text-sm font-medium hover:bg-steel-light transition-colors"
              >
                <Share2 size={16} />
                Ulashish
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={16} />
            }
            Saqlash
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Заказчик (Mijoz ismi)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Mijoz ismi yoki kompaniya"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Tel</label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+998 90 000 00 00"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-green-50 border-b border-border">
                {['№', 'Вид', 'Наименование', 'Габариты', 'Краткая характеристика',
                  'Стоимость', 'Кол.во', 'Сумма', 'НДС 12%', 'Сумма с НДС 12%', ''].map((h, i) => (
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
              {items.map((item, index) => (
                <OrderRow
                  key={index}
                  index={index}
                  item={item}
                  totals={totals[index]}
                  onUpdate={updateItem}
                  onRemove={removeRow}
                  onPickProduct={() => setPickerIndex(index)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center gap-3">
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Plus size={16} />
            Qator qo&apos;shish
          </button>
          <span className="text-muted text-xs">|</span>
          <button
            onClick={() => setBulkPickerOpen(true)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            <Layers size={16} />
            Bir nechta mahsulot qo&apos;shish
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex flex-col items-end gap-2 max-w-sm ml-auto">
          <div className="flex items-center justify-between w-full text-sm">
            <span className="text-muted font-medium">Итого:</span>
            <span className="font-semibold text-foreground">{fmt(totalSum)} so&apos;m</span>
          </div>
          <div className="flex items-center justify-between w-full text-sm">
            <span className="text-muted font-medium">НДС 12%:</span>
            <span className="font-semibold text-foreground">{fmt(totalVat)} so&apos;m</span>
          </div>
          <div className="flex items-center justify-between w-full pt-2 border-t border-border">
            <span className="font-bold text-foreground">Итого с НДС:</span>
            <span className="font-bold text-lg text-primary">{fmt(grandTotal)} so&apos;m</span>
          </div>
        </div>
      </div>

      {/* Single product picker modal */}
      {pickerIndex >= 0 && (
        <ProductPicker
          products={products}
          onSelect={(selected) => {
            addItemFromProduct(selected[0], pickerIndex)
            setPickerIndex(-1)
          }}
          onClose={() => setPickerIndex(-1)}
        />
      )}

      {/* Bulk product picker modal */}
      {bulkPickerOpen && (
        <ProductPicker
          products={products}
          onSelect={addItemsFromBulk}
          onClose={() => setBulkPickerOpen(false)}
        />
      )}
    </div>
  )
}

interface RowProps {
  index: number
  item: OrderItem
  totals: { sum: number; vat: number; grand: number }
  onUpdate: (index: number, field: keyof OrderItem, value: any) => void
  onRemove: (index: number) => void
  onPickProduct: () => void
}

function OrderRow({ index, item, totals, onUpdate, onRemove, onPickProduct }: RowProps) {
  const inputClass = "w-full px-2 py-1.5 text-sm border border-transparent rounded focus:outline-none focus:border-primary focus:bg-white bg-transparent text-center"
  const tdClass = "border-r border-border last:border-r-0 align-middle"

  return (
    <tr className="border-b border-border hover:bg-steel-light/50">
      <td className={`${tdClass} px-3 py-2 text-center text-sm text-muted font-medium`}>{index + 1}</td>

      <td className={`${tdClass} px-2 py-2`}>
        <div className="w-[80px] mx-auto">
          <div
            className="w-[80px] h-[60px] border border-dashed border-border rounded flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary transition-colors"
            onClick={onPickProduct}
          >
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={18} className="text-muted" />
            )}
          </div>
        </div>
      </td>

      <td className={`${tdClass} px-1 py-1`}>
        <SpeechInput
          value={item.name}
          onChange={(v) => onUpdate(index, 'name', v)}
          placeholder="Mahsulot nomi"
          inputClass={inputClass}
        />
      </td>

      <td className={`${tdClass} px-1 py-1`}>
        <input
          type="text"
          value={item.dimensions}
          onChange={(e) => onUpdate(index, 'dimensions', e.target.value)}
          placeholder="700x700x850"
          className={`${inputClass} text-danger font-bold`}
        />
      </td>

      <td className={`${tdClass} px-1 py-1`} style={{ minWidth: 200 }}>
        <SpeechInput
          value={item.description}
          onChange={(v) => onUpdate(index, 'description', v)}
          placeholder="Tavsif..."
          rows={2}
          inputClass="w-full px-2 py-1.5 text-xs border border-transparent rounded focus:outline-none focus:border-primary focus:bg-white bg-transparent resize-none leading-relaxed"
        />
      </td>

      <td className={`${tdClass} px-1 py-1`} style={{ minWidth: 110 }}>
        <input
          type="number"
          value={item.price}
          onChange={(e) => onUpdate(index, 'price', e.target.value)}
          min="0"
          className={inputClass}
        />
      </td>

      <td className={`${tdClass} px-1 py-1`} style={{ minWidth: 60 }}>
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
          min="1"
          className={inputClass}
        />
      </td>

      <td className={`${tdClass} px-3 py-2 text-center text-sm font-medium text-foreground`} style={{ minWidth: 110 }}>
        {totals.sum > 0 ? totals.sum.toLocaleString('ru-RU') : '—'}
      </td>

      <td className={`${tdClass} px-3 py-2 text-center text-sm text-muted`} style={{ minWidth: 90 }}>
        {totals.vat > 0 ? totals.vat.toLocaleString('ru-RU') : '—'}
      </td>

      <td className={`${tdClass} px-3 py-2 text-center text-sm font-semibold text-foreground`} style={{ minWidth: 120 }}>
        {totals.grand > 0 ? totals.grand.toLocaleString('ru-RU') : '—'}
      </td>

      <td className="px-2 py-2 text-center">
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 rounded text-muted hover:text-danger hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  )
}
