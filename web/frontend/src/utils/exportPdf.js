import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportReportToPdf(elementId, ticker, date) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('exportPdf: element not found:', elementId)
    return
  }

  // Expand all collapsed sections before capture
  const collapsedButtons = element.querySelectorAll('button')
  const sectionsToRestore = []

  collapsedButtons.forEach(btn => {
    const parent = btn.closest('.bg-slate-900\\/60')
    if (!parent) return
    // Check if section content is hidden (no sibling div with border-t visible)
    const contentDiv = parent.querySelector('.border-t')
    if (!contentDiv) {
      // Section is collapsed — click to expand
      sectionsToRestore.push(btn)
      btn.click()
    }
  })

  // Wait for React to re-render expanded sections
  await new Promise(r => setTimeout(r, 500))

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f172a',
      logging: false,
      allowTaint: true,
      // Fix for SVG-based charts (Recharts uses SVG)
      foreignObjectRendering: false,
    })

    const imgWidth = canvas.width
    const imgHeight = canvas.height

    if (imgWidth === 0 || imgHeight === 0) {
      console.error('exportPdf: canvas is empty')
      return
    }

    // A4 dimensions in mm
    const pdfWidth = 210
    const pdfHeight = 297
    const margin = 10
    const headerHeight = 15
    const footerHeight = 10
    const contentWidth = pdfWidth - margin * 2
    const contentHeight = pdfHeight - margin * 2 - headerHeight - footerHeight

    // Scale image to fit page width
    const scaleFactor = 2 // matches html2canvas scale
    const ratio = contentWidth / (imgWidth / scaleFactor)
    const scaledHeight = (imgHeight / scaleFactor) * ratio
    const totalPages = Math.max(1, Math.ceil(scaledHeight / contentHeight))

    const pdf = new jsPDF('p', 'mm', 'a4')

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage()

      // Header
      pdf.setFontSize(9)
      pdf.setTextColor(150)
      pdf.text(`${ticker} — ${date}`, margin, margin + 8)
      pdf.text('Trading Analysis Report', pdfWidth - margin, margin + 8, { align: 'right' })
      pdf.setDrawColor(200)
      pdf.line(margin, margin + 12, pdfWidth - margin, margin + 12)

      // Content: clip from the full image
      const sourceY = Math.floor(page * contentHeight / ratio * scaleFactor)
      const sourceHeight = Math.min(
        Math.floor(contentHeight / ratio * scaleFactor),
        imgHeight - sourceY
      )

      if (sourceHeight <= 0) break

      // Create a clipped canvas for this page
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = imgWidth
      pageCanvas.height = sourceHeight
      const ctx = pageCanvas.getContext('2d')
      ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)

      const pageImgData = pageCanvas.toDataURL('image/png')
      const drawHeight = (sourceHeight / scaleFactor) * ratio

      pdf.addImage(pageImgData, 'PNG', margin, margin + headerHeight, contentWidth, drawHeight)

      // Footer
      pdf.setFontSize(8)
      pdf.setTextColor(150)
      pdf.text(`Trang ${page + 1} / ${totalPages}`, pdfWidth / 2, pdfHeight - margin, { align: 'center' })
    }

    pdf.save(`${ticker}_${date}_report.pdf`)
  } catch (err) {
    console.error('exportPdf error:', err)
    // Fallback: simple text-based PDF
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.setFontSize(10)
      pdf.text(`Report: ${ticker} — ${date}`, 10, 20)
      pdf.text('PDF export encountered an error. Please try again.', 10, 30)
      pdf.save(`${ticker}_${date}_report.pdf`)
    } catch {
      alert('Không thể xuất PDF. Vui lòng thử lại.')
    }
  } finally {
    // Restore collapsed sections
    sectionsToRestore.forEach(btn => btn.click())
  }
}
