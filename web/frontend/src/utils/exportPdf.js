import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportReportToPdf(elementId, ticker, date) {
  const element = document.getElementById(elementId)
  if (!element) return

  // Capture the DOM element as a canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f172a',
    logging: false,
  })

  const imgWidth = canvas.width
  const imgHeight = canvas.height

  // A4 dimensions in mm
  const pdfWidth = 210
  const pdfHeight = 297
  const margin = 10
  const headerHeight = 15
  const footerHeight = 10
  const contentWidth = pdfWidth - margin * 2
  const contentHeight = pdfHeight - margin * 2 - headerHeight - footerHeight

  // Scale image to fit page width
  const ratio = contentWidth / (imgWidth / 2) // divide by scale factor
  const scaledHeight = (imgHeight / 2) * ratio
  const totalPages = Math.ceil(scaledHeight / contentHeight)

  const pdf = new jsPDF('p', 'mm', 'a4')

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage()

    // Header
    pdf.setFontSize(9)
    pdf.setTextColor(150)
    pdf.text(`${ticker} — ${date}`, margin, margin + 8)
    pdf.text('Trading Analysis Report', pdfWidth - margin, margin + 8, { align: 'right' })

    // Content: clip from the full image
    const sourceY = page * contentHeight / ratio * 2 // scale back
    const sourceHeight = Math.min(contentHeight / ratio * 2, imgHeight - sourceY)

    // Create a clipped canvas for this page
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = imgWidth
    pageCanvas.height = sourceHeight
    const ctx = pageCanvas.getContext('2d')
    ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)

    const pageImgData = pageCanvas.toDataURL('image/png')
    const drawHeight = (sourceHeight / 2) * ratio

    pdf.addImage(pageImgData, 'PNG', margin, margin + headerHeight, contentWidth, drawHeight)

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(150)
    pdf.text(`Trang ${page + 1} / ${totalPages}`, pdfWidth / 2, pdfHeight - margin, { align: 'center' })
  }

  pdf.save(`${ticker}_${date}_report.pdf`)
}
