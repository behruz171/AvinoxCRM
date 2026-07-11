import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { OrderItem } from '../types'

function fmt(n: number | string) {
  return Number(n).toLocaleString('ru-RU')
}

function itemRows(orderId: number, orderDate: string, clientName: string, clientPhone: string, items: OrderItem[]) {
  return items.map((item, index) => {
    const price = Number(item.price) || 0
    const qty = Number(item.quantity) || 0
    const sum = price * qty
    const vat = Math.round(sum * 12 / 100)
    const grand = sum + vat
    return {
      '№': index + 1,
      'Наименование': item.name,
      'Вид': '',
      'Габариты': item.dimensions,
      'Краткая характеристика': item.description,
      'Стоимость': price,
      'Кол.во': qty,
      'Сумма': sum,
      'НДС 12%': vat,
      'сумма с учётом НДС 12%': grand,
    }
  })
}

export function exportExcel(orderId: number, orderDate: string, clientName: string, clientPhone: string, items: OrderItem[], onProgress?: (pct: number) => void) {
  const rows = itemRows(orderId, orderDate, clientName, clientPhone, items)

  const wb = XLSX.utils.book_new()

  const headerRows = [
    [`Заказчик:   ${clientName}`, `Tel: ${clientPhone}`, '', '', '', '', '', '', '', ''],
    [`Дата заявки:  ${orderDate}`, '', '', '', '', '', '', '', '', ''],
  ]

  const wsData = [
    ...headerRows,
    ['№', 'Наименование', 'Вид', 'Габариты', 'Краткая характеристика',
     'Стоимость', 'Кол. во', 'Сумма', 'НДС 12%', 'сумма с учётом НДС 12%'],
    ...rows.map((r) => Object.values(r)),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
  ]

  const colWidths = [5, 22, 18, 16, 38, 16, 8, 16, 12, 20]
  ws['!cols'] = colWidths.map((w) => ({ wch: w }))

  XLSX.utils.book_append_sheet(wb, ws, 'Zayavka')

  // Total rows
  const totalSum = items.reduce((a, item) => a + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
  const totalVat = Math.round(totalSum * 12 / 100)
  const grandTotal = totalSum + totalVat

  const startRow = headerRows.length + 1 + items.length
  const totalsData = [
    ['', '', '', '', '', '', '', '', '', ''],
    ['Итого:', '', '', '', '', '', '', totalSum, '', ''],
    ['НДС 12%:', '', '', '', '', '', '', totalVat, '', ''],
    ['Итого с НДС:', '', '', '', '', '', '', grandTotal, '', ''],
  ]
  XLSX.utils.sheet_add_aoa(ws, totalsData, { origin: startRow })

  onProgress?.(50)

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  onProgress?.(100)

  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zayavka_${orderId}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPdf(orderId: number, orderDate: string, clientName: string, clientPhone: string, items: OrderItem[], onProgress?: (pct: number) => void) {
  const doc = new jsPDF('l', 'mm', 'a4')

  doc.setFontSize(11)
  doc.text(`Заказчик: ${clientName}   Tel: ${clientPhone}`, 14, 20)
  doc.setFontSize(11)
  doc.text(`Дата заявки: ${orderDate}`, 14, 28)

  onProgress?.(20)

  const rows = items.map((item, index) => {
    const price = Number(item.price) || 0
    const qty = Number(item.quantity) || 0
    const sum = price * qty
    const vat = Math.round(sum * 12 / 100)
    const grand = sum + vat
    return [
      String(index + 1),
      item.name,
      '',
      item.dimensions,
      item.description,
      fmt(price),
      String(qty),
      fmt(sum),
      fmt(vat),
      fmt(grand),
    ]
  })

  onProgress?.(40)

  const totalSum = items.reduce((a, item) => a + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
  const totalVat = Math.round(totalSum * 12 / 100)
  const grandTotal = totalSum + totalVat

  autoTable(doc, {
    startY: 35,
    head: [['№', 'Наименование', 'Вид', 'Габариты', 'Краткая характеристика',
            'Стоимость', 'Кол.во', 'Сумма', 'НДС 12%', 'Сумма с НДС']],
    body: [
      ...rows,
      [{ content: 'Итого:', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, '', fmt(totalSum), '', ''],
      [{ content: 'НДС 12%:', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, '', fmt(totalVat), '', ''],
      [{ content: 'Итого с НДС:', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, '', fmt(grandTotal), '', ''],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [198, 239, 206],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 65 },
      5: { cellWidth: 25 },
      6: { cellWidth: 14 },
      7: { cellWidth: 25 },
      8: { cellWidth: 20 },
      9: { cellWidth: 30 },
    },
    margin: { left: 8, right: 8 },
  })

  onProgress?.(80)

  doc.save(`zayavka_${orderId}.pdf`)

  onProgress?.(100)
}
