import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { OrderItem } from '../types'
import './NotoSans-VariableFont_wdth,wght-normal.js'

function fmt(n: number | string) {
  return Number(n).toLocaleString('ru-RU')
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function base64FromImage(img: HTMLImageElement): string {
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return c.toDataURL('image/jpeg', 0.85)
}

function getTotals(items: OrderItem[]) {
  const totalSum = items.reduce((a, item) => a + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
  const totalVat = Math.round(totalSum * 12 / 100)
  const grandTotal = totalSum + totalVat
  const totalQty = items.reduce((a, item) => a + (Number(item.quantity) || 0), 0)
  return { totalSum, totalVat, grandTotal, totalQty }
}

const FONT = 'NotoSans-VariableFont_wdth,wght'

export async function exportExcel(
  orderId: number, orderDate: string, clientName: string, clientPhone: string,
  items: OrderItem[], onProgress?: (pct: number) => void
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CRM'
  const ws = wb.addWorksheet('Zayavka')

  onProgress?.(10)

  // Column widths
  ws.getColumn(1).width = 5
  ws.getColumn(2).width = 22
  ws.getColumn(3).width = 18
  ws.getColumn(4).width = 16
  ws.getColumn(5).width = 38
  ws.getColumn(6).width = 16
  ws.getColumn(7).width = 8
  ws.getColumn(8).width = 16
  ws.getColumn(9).width = 12
  ws.getColumn(10).width = 20

  // Styles
  const headerFont = { name: 'Times New Roman', bold: true, size: 11 } as const
  const normalFont = { name: 'Times New Roman', size: 10 } as const
  const redFont = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFF0000' } } as const
  const thinBorder = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  }
  const center = { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true }
  const leftAlign = { vertical: 'middle' as const, horizontal: 'left' as const, wrapText: true }

  // Row 1: client info
  ws.mergeCells('A1:C1')
  const c1 = ws.getCell('A1')
  c1.value = `Заказчик:   ${clientName}`
  c1.font = headerFont

  ws.mergeCells('D1:J1')
  const c2 = ws.getCell('D1')
  c2.value = `Tel: ${clientPhone}`
  c2.font = headerFont

  // Row 2: date
  ws.mergeCells('A2:J2')
  const c3 = ws.getCell('A2')
  c3.value = `Дата заявки:  ${orderDate}`
  c3.font = headerFont

  // Row 3: table header
  const headers = ['№', 'Наименование', 'Вид', 'Габариты', 'Краткая характеристика',
    'Стоимость', 'Кол. во', 'Сумма', 'НДС 12%', 'сумма с учётом НДС 12%']

  const headerRow = ws.getRow(3)
  headerRow.height = 30
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { name: 'Times New Roman', bold: true, size: 10 }
    cell.alignment = center
    cell.border = thinBorder
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }
  })

  onProgress?.(30)

  // Data rows
  const imagePromises: Promise<void>[] = []

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx]
    const rowNum = 4 + idx
    const row = ws.getRow(rowNum)
    row.height = 70

    const price = Number(item.price) || 0
    const qty = Number(item.quantity) || 0
    const sum = price * qty
    const vat = Math.round(sum * 12 / 100)
    const grand = sum + vat

    const data = [
      idx + 1,
      item.name,
      '',
      item.dimensions,
      item.description,
      price,
      qty,
      sum,
      vat,
      grand,
    ]

    data.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1)
      cell.value = val
      cell.border = thinBorder
      cell.alignment = center

      if ([5, 7, 8, 9].includes(colIdx)) {
        cell.numFmt = '#,##0'
      }
      if (colIdx === 3) {
        cell.font = redFont
      } else {
        cell.font = normalFont
      }
      if (colIdx === 1) {
        cell.alignment = { ...center, horizontal: 'center' }
      }
      if (colIdx === 4) {
        cell.alignment = leftAlign
      }
    })

    // Add image
    if (item.image_url) {
      const imgUrl = item.image_url
      imagePromises.push(
        loadImage(imgUrl).then((img) => {
          const b64 = base64FromImage(img)
          const imageId = wb.addImage({ base64: b64, extension: 'jpeg' })
          ws.addImage(imageId, {
            tl: { col: 2.1, row: rowNum - 0.9 },
            ext: { width: 110, height: 80 },
          })
        }).catch(() => {})
      )
    }
  }

  await Promise.all(imagePromises)

  onProgress?.(60)

  // Totals row
  const { totalSum, totalVat, grandTotal, totalQty } = getTotals(items)
  const lastDataRow = 3 + items.length
  const totalRow = ws.getRow(lastDataRow + 1)
  totalRow.height = 22

  for (let c = 1; c <= 10; c++) {
    totalRow.getCell(c).border = thinBorder
  }
  ws.mergeCells(`A${lastDataRow + 1}:F${lastDataRow + 1}`)
  const labelCell = totalRow.getCell(1)
  labelCell.value = 'Итого:'
  labelCell.font = { name: 'Times New Roman', bold: true, size: 11 }
  labelCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalCols = [7, 8, 9, 10]
  const totalVals = [totalQty, totalSum, totalVat, grandTotal]
  totalCols.forEach((colNum, i) => {
    const cell = totalRow.getCell(colNum)
    cell.value = totalVals[i]
    cell.numFmt = '#,##0'
    cell.font = { name: 'Times New Roman', bold: true, size: 11 }
    cell.alignment = center
  })

  onProgress?.(80)

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer()
  onProgress?.(90)

  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zayavka_${orderId}.xlsx`
  a.click()
  URL.revokeObjectURL(url)

  onProgress?.(100)
}

export async function exportPdf(
  orderId: number, orderDate: string, clientName: string, clientPhone: string,
  items: OrderItem[], onProgress?: (pct: number) => void
) {
  const doc = new jsPDF('l', 'mm', 'a4')

  onProgress?.(10)

  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')
  doc.text(`Заказчик: ${clientName}   Tel: ${clientPhone}`, 14, 20)
  doc.text(`Дата заявки: ${orderDate}`, 14, 28)

  onProgress?.(20)

  // Preload images
  const imageMap = new Map<number, string>()
  await Promise.all(
    items.map(async (item, idx) => {
      if (item.image_url) {
        try {
          const img = await loadImage(item.image_url)
          imageMap.set(idx, base64FromImage(img))
        } catch {}
      }
    })
  )

  onProgress?.(40)

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

  const { totalSum, totalVat, grandTotal, totalQty } = getTotals(items)

  autoTable(doc, {
    startY: 35,
    head: [['№', 'Наименование', 'Вид', 'Габариты', 'Краткая характеристика',
            'Стоимость', 'Кол.во', 'Сумма', 'НДС 12%', 'Сумма с НДС']],
    body: rows,
    foot: [
      [
        { content: 'Итого:', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
        String(totalQty),
        fmt(totalSum),
        fmt(totalVat),
        fmt(grandTotal),
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [198, 239, 206],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      font: FONT,
    },
    bodyStyles: { fontSize: 8, halign: 'center', font: FONT },
    footStyles: { fontSize: 8, halign: 'center', font: FONT, fontStyle: 'bold' },
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
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 2) {
        const rowIndex = data.row.index
        const imgData = imageMap.get(rowIndex)
        if (imgData) {
          const x = data.cell.x + 1
          const y = data.cell.y + 1
          const w = data.cell.width - 2
          const h = data.cell.height - 2
          try {
            doc.addImage(imgData, 'JPEG', x, y, w, h)
          } catch {}
        }
      }
    },
  })

  onProgress?.(80)

  doc.save(`zayavka_${orderId}.pdf`)

  onProgress?.(100)
}
