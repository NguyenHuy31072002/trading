export function exportReportToHtml(elementId, ticker, date) {
  const element = document.getElementById(elementId)
  if (!element) return

  // Clone the element to manipulate without affecting the page
  const clone = element.cloneNode(true)

  // Expand all collapsed sections in the clone (remove hidden ones, show all content)
  // Remove all buttons (toggle buttons)
  clone.querySelectorAll('button').forEach(btn => {
    const parent = btn.closest('.bg-slate-900\\/60')
    if (parent) {
      // Extract the title text from button
      const title = btn.querySelector('h3')?.textContent || ''
      // Replace button with a header
      const header = document.createElement('h3')
      header.textContent = title
      header.style.cssText = 'font-size:18px;font-weight:bold;margin:20px 0 10px 0;color:#1e293b;border-bottom:2px solid #3b82f6;padding-bottom:8px;'
      btn.replaceWith(header)
    }
  })

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Báo cáo Phân tích: ${ticker} — ${date}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    background: #ffffff;
    padding: 40px;
    max-width: 900px;
    margin: 0 auto;
  }
  .report-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 3px solid #3b82f6;
  }
  .report-header h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; }
  .report-header p { color: #64748b; font-size: 14px; }
  .decision-badge {
    display: inline-block;
    padding: 12px 32px;
    border-radius: 12px;
    color: white;
    font-weight: bold;
    font-size: 20px;
    margin: 16px 0;
  }
  .decision-buy { background: linear-gradient(135deg, #10b981, #34d399); }
  .decision-sell { background: linear-gradient(135deg, #ef4444, #f87171); }
  .decision-hold { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
  .section {
    margin-bottom: 32px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    page-break-inside: avoid;
  }
  .section h3 {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 16px 0;
    color: #1e293b;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }
  th, td {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    text-align: left;
  }
  th { background: #f1f5f9; font-weight: 600; color: #475569; }
  tr:nth-child(even) { background: #f8fafc; }
  h1, h2, h3, h4, h5 { margin-top: 16px; margin-bottom: 8px; }
  h2 { font-size: 20px; color: #1e293b; }
  h4 { font-size: 15px; color: #334155; }
  p { margin-bottom: 8px; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin-bottom: 4px; }
  strong { color: #0f172a; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; }
  pre code { background: none; padding: 0; }
  .chart-note {
    padding: 12px 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    color: #1e40af;
    font-size: 13px;
    margin: 12px 0;
  }
  .footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    color: #94a3b8;
    font-size: 12px;
  }
  @media print {
    body { padding: 20px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <h1>Báo cáo Phân tích Giao dịch</h1>
    <p><strong>${ticker}</strong> — Ngày phân tích: ${date}</p>
    <p>Tạo lúc: ${new Date().toLocaleString('vi-VN')}</p>
  </div>
  <div id="report-body"></div>
  <div class="footer">
    <p>Báo cáo được tạo tự động bởi TradingAgents AI — Chỉ mang tính chất tham khảo</p>
  </div>
</body>
</html>`

  // Parse and rebuild content from the actual report sections
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ticker}_${date}_report.html`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Build a complete HTML report from structured report data.
 * This is more reliable than cloning DOM - it builds from the source data.
 */
export function exportStructuredReportToHtml(sections, ticker, date, decision, chartData) {
  const sectionTitles = {
    market_report: 'Phân t��ch Thị trường',
    financial_reports_report: 'Phân tích Báo cáo Tài chính',
    news_report: 'Phân tích Tin tức',
    fundamentals_report: 'Phân tích Cơ bản',
    investment_plan: 'Quyết định Đội Nghiên cứu',
    trader_plan: 'Kế hoạch Giao dịch',
    final_decision: 'Quyết định Cuối cùng',
  }

  // Determine decision badge
  let decisionHtml = ''
  if (decision) {
    const d = decision.toUpperCase()
    let cls = 'decision-hold', label = 'GIỮ'
    if (d.includes('BUY') || d.includes('OVERWEIGHT')) { cls = 'decision-buy'; label = d.includes('OVERWEIGHT') ? 'OVERWEIGHT' : 'MUA' }
    else if (d.includes('SELL') || d.includes('UNDERWEIGHT')) { cls = 'decision-sell'; label = d.includes('UNDERWEIGHT') ? 'UNDERWEIGHT' : 'BÁN' }
    decisionHtml = `<div class="decision-badge ${cls}">${label}</div>`
  }

  // Build sections HTML
  let sectionsHtml = ''
  for (const [key, sec] of Object.entries(sections)) {
    const title = sec.title || sectionTitles[key] || key
    // Convert markdown-like content to basic HTML
    const content = markdownToHtml(sec.content || '')

    // Add chart data tables for relevant sections
    let chartHtml = ''
    if (chartData) {
      chartHtml = buildChartDataTables(key, chartData)
    }

    sectionsHtml += `
    <div class="section">
      <h3>${title}</h3>
      <div>${content}</div>
      ${chartHtml}
    </div>`
  }

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Báo cáo Phân tích: ${ticker} — ${date}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.7;
    color: #1e293b;
    background: #ffffff;
    padding: 40px;
    max-width: 900px;
    margin: 0 auto;
  }
  .report-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 3px solid #3b82f6;
  }
  .report-header h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; }
  .report-header p { color: #64748b; font-size: 14px; }
  .decision-badge {
    display: inline-block;
    padding: 12px 32px;
    border-radius: 12px;
    color: white;
    font-weight: bold;
    font-size: 20px;
    margin: 16px 0;
  }
  .decision-buy { background: linear-gradient(135deg, #10b981, #34d399); }
  .decision-sell { background: linear-gradient(135deg, #ef4444, #f87171); }
  .decision-hold { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
  .section {
    margin-bottom: 32px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
  }
  .section h3 {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 16px 0;
    color: #1e293b;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }
  th, td {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    text-align: left;
  }
  th { background: #f1f5f9; font-weight: 600; color: #475569; }
  tr:nth-child(even) { background: #f8fafc; }
  h1, h2, h3, h4, h5 { margin-top: 16px; margin-bottom: 8px; }
  h2 { font-size: 20px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  h4 { font-size: 15px; color: #334155; }
  p { margin-bottom: 8px; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin-bottom: 4px; }
  strong { color: #0f172a; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; }
  pre code { background: none; padding: 0; }
  .data-table-title {
    font-size: 14px;
    font-weight: 600;
    color: #3b82f6;
    margin: 20px 0 8px 0;
  }
  .ratios-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 16px 0;
  }
  .ratio-card {
    text-align: center;
    padding: 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }
  .ratio-card .label { font-size: 12px; color: #64748b; }
  .ratio-card .value { font-size: 18px; font-weight: bold; color: #0f172a; }
  .footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    color: #94a3b8;
    font-size: 12px;
  }
  @media print {
    body { padding: 20px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <h1>Báo cáo Phân tích Giao dịch</h1>
    <p><strong>${ticker}</strong> — Ngày phân tích: ${date}</p>
    ${decisionHtml}
    <p style="margin-top:8px;">Tạo lúc: ${new Date().toLocaleString('vi-VN')}</p>
  </div>
  ${sectionsHtml}
  <div class="footer">
    <p>Báo cáo được tạo tự động bởi TradingAgents AI ��� Chỉ mang tính chất tham khảo</p>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ticker}_${date}_report.html`
  a.click()
  URL.revokeObjectURL(url)
}

function formatNum(val) {
  if (val == null || isNaN(val)) return 'N/A'
  if (Math.abs(val) >= 1e12) return (val / 1e12).toFixed(1) + 'T'
  if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1) + 'B'
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M'
  if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(1) + 'K'
  return Number(val).toFixed(2)
}

function formatPct(val) {
  if (val == null || isNaN(val)) return 'N/A'
  return (val * 100).toFixed(1) + '%'
}

function buildChartDataTables(sectionKey, chartData) {
  let html = ''

  if (sectionKey === 'market_report' && chartData.price && chartData.price.length > 0) {
    // Show last 10 price records
    const recent = chartData.price.slice(-10)
    html += `<div class="data-table-title">Dữ liệu Giá gần đây</div>`
    html += `<table><tr><th>Ng��y</th><th>Mở cửa</th><th>Cao nhất</th><th>Th��p nhất</th><th>Đóng cửa</th><th>Khối lượng</th></tr>`
    for (const r of recent) {
      html += `<tr><td>${r.date}</td><td>${r.open}</td><td>${r.high}</td><td>${r.low}</td><td>${r.close}</td><td>${formatNum(r.volume)}</td></tr>`
    }
    html += `</table>`
  }

  if (sectionKey === 'financial_reports_report') {
    if (chartData.income && chartData.income.length > 0) {
      html += `<div class="data-table-title">Báo cáo Thu nhập (4 năm)</div>`
      html += `<table><tr><th>Năm</th><th>Doanh thu</th><th>Lợi nhuận gộp</th><th>Lợi nhuận ròng</th></tr>`
      for (const r of chartData.income) {
        html += `<tr><td>${r.year}</td><td>${formatNum(r.revenue)}</td><td>${formatNum(r.gross_profit)}</td><td>${formatNum(r.net_income)}</td></tr>`
      }
      html += `</table>`
    }
    if (chartData.cashflow && chartData.cashflow.length > 0) {
      html += `<div class="data-table-title">Dòng tiền (4 năm)</div>`
      html += `<table><tr><th>Năm</th><th>Hoạt động KD</th><th>Đầu tư</th><th>Tài chính</th></tr>`
      for (const r of chartData.cashflow) {
        html += `<tr><td>${r.year}</td><td>${formatNum(r.operating)}</td><td>${formatNum(r.investing)}</td><td>${formatNum(r.financing)}</td></tr>`
      }
      html += `</table>`
    }
  }

  if (sectionKey === 'fundamentals_report') {
    if (chartData.balance_sheet && chartData.balance_sheet.length > 0) {
      html += `<div class="data-table-title">Bảng Cân đối Kế toán (4 năm)</div>`
      html += `<table><tr><th>Năm</th><th>Tổng t��i sản</th><th>Tổng nợ</th><th>Vốn CSH</th></tr>`
      for (const r of chartData.balance_sheet) {
        html += `<tr><td>${r.year}</td><td>${formatNum(r.total_assets)}</td><td>${formatNum(r.total_liabilities)}</td><td>${formatNum(r.equity)}</td></tr>`
      }
      html += `</table>`
    }
    if (chartData.ratios) {
      const r = chartData.ratios
      html += `<div class="data-table-title">Chỉ số Tài chính</div>`
      html += `<div class="ratios-grid">`
      html += `<div class="ratio-card"><div class="label">ROE</div><div class="value">${formatPct(r.roe)}</div></div>`
      html += `<div class="ratio-card"><div class="label">ROA</div><div class="value">${formatPct(r.roa)}</div></div>`
      html += `<div class="ratio-card"><div class="label">Biên LN ròng</div><div class="value">${formatPct(r.profit_margin)}</div></div>`
      html += `<div class="ratio-card"><div class="label">Hệ số thanh toán</div><div class="value">${r.current_ratio != null ? r.current_ratio.toFixed(2) : 'N/A'}</div></div>`
      html += `<div class="ratio-card"><div class="label">Nợ/Vốn CSH</div><div class="value">${r.debt_to_equity != null ? r.debt_to_equity.toFixed(2) : 'N/A'}</div></div>`
      html += `<div class="ratio-card"><div class="label">P/E</div><div class="value">${r.pe_ratio != null ? r.pe_ratio.toFixed(2) : 'N/A'}</div></div>`
      html += `</div>`
    }
  }

  return html
}

/** Simple markdown to HTML converter for common patterns */
function markdownToHtml(md) {
  if (!md) return ''
  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, match => {
    const code = match.slice(3, -3).replace(/^\w+\n/, '')
    return `<pre><code>${code}</code></pre>`
  })
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')

  // Tables (markdown format)
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim())
    if (cells.every(c => /^[\s-:]+$/.test(c))) return '<!--separator-->'
    const tag = 'td'
    return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>'
  })
  // Wrap consecutive table rows
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, (match) => {
    let rows = match.replace(/<!--separator-->\n?/g, '')
    // Make first row headers
    rows = rows.replace(/<tr>(.*?)<\/tr>/, (m, inner) => {
      return '<tr>' + inner.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>') + '</tr>'
    })
    return `<table>${rows}</table>`
  })

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">')

  // Paragraphs (lines that aren't already HTML)
  html = html.replace(/^(?!<[a-z]|<!--)(.+)$/gm, '<p>$1</p>')

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')

  return html
}
