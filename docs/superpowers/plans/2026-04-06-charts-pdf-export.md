# Charts & PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interactive Recharts visualizations to each analysis section and enable PDF export from the browser.

**Architecture:** Backend provides a new REST endpoint `/api/chart-data/{ticker}` that fetches structured JSON from yfinance. Frontend renders charts under each report section using Recharts, and exports the full page (markdown + charts) to PDF via html2canvas + jsPDF.

**Tech Stack:** Recharts (React charts), html2canvas + jsPDF (PDF export), yfinance (data source)

---

### Task 1: Backend — chart data endpoint

**Files:**
- Modify: `web/backend/main.py`

- [ ] **Step 1: Add the `/api/chart-data/{ticker}` endpoint**

Add after the existing `/api/config` endpoint (after line 183 in `web/backend/main.py`):

```python
@app.get("/api/chart-data/{ticker}")
async def get_chart_data(ticker: str, date: str = None):
    """Fetch structured chart data for a ticker from yfinance."""
    import yfinance as yf
    import pandas as pd
    from datetime import datetime, timedelta

    ticker = ticker.strip().upper()
    analysis_date = date or datetime.now().strftime("%Y-%m-%d")
    analysis_dt = datetime.strptime(analysis_date, "%Y-%m-%d")

    result = {}

    try:
        yf_ticker = yf.Ticker(ticker)

        # --- Price data (last 6 months) ---
        price_start = (analysis_dt - timedelta(days=180)).strftime("%Y-%m-%d")
        hist = yf_ticker.history(start=price_start, end=analysis_date)
        if not hist.empty:
            if hist.index.tz is not None:
                hist.index = hist.index.tz_localize(None)
            price_records = []
            for idx, row in hist.iterrows():
                price_records.append({
                    "date": idx.strftime("%Y-%m-%d"),
                    "open": round(float(row.get("Open", 0)), 2),
                    "high": round(float(row.get("High", 0)), 2),
                    "low": round(float(row.get("Low", 0)), 2),
                    "close": round(float(row.get("Close", 0)), 2),
                    "volume": int(row.get("Volume", 0)),
                })
            result["price"] = price_records

            # --- Technical indicators from stockstats ---
            from stockstats import wrap as stockstats_wrap
            df = hist.reset_index().copy()
            df.columns = [c.lower() for c in df.columns]
            if "date" not in df.columns and df.index.name == "date":
                df = df.reset_index()
            ss = stockstats_wrap(df)

            # RSI
            try:
                ss["rsi"]
                rsi_data = []
                for _, row in ss.iterrows():
                    d = row.get("date", row.name)
                    if hasattr(d, "strftime"):
                        d = d.strftime("%Y-%m-%d")
                    val = row.get("rsi")
                    if pd.notna(val):
                        rsi_data.append({"date": str(d), "value": round(float(val), 2)})
                result["rsi"] = rsi_data
            except Exception:
                pass

            # MACD
            try:
                ss["macd"]
                ss["macds"]
                ss["macdh"]
                macd_data = []
                for _, row in ss.iterrows():
                    d = row.get("date", row.name)
                    if hasattr(d, "strftime"):
                        d = d.strftime("%Y-%m-%d")
                    m, s, h = row.get("macd"), row.get("macds"), row.get("macdh")
                    if pd.notna(m):
                        macd_data.append({
                            "date": str(d),
                            "macd": round(float(m), 4),
                            "signal": round(float(s), 4) if pd.notna(s) else 0,
                            "histogram": round(float(h), 4) if pd.notna(h) else 0,
                        })
                result["macd"] = macd_data
            except Exception:
                pass

        # --- Income statement (annual, last 4 years) ---
        try:
            inc = yf_ticker.income_stmt
            if inc is not None and not inc.empty:
                income_records = []
                for col in sorted(inc.columns):
                    year = col.strftime("%Y") if hasattr(col, "strftime") else str(col)[:4]
                    income_records.append({
                        "year": year,
                        "revenue": _safe_num(inc.at["Total Revenue", col]) if "Total Revenue" in inc.index else 0,
                        "net_income": _safe_num(inc.at["Net Income", col]) if "Net Income" in inc.index else 0,
                        "gross_profit": _safe_num(inc.at["Gross Profit", col]) if "Gross Profit" in inc.index else 0,
                    })
                result["income"] = income_records
        except Exception:
            pass

        # --- Balance sheet (annual, last 4 years) ---
        try:
            bs = yf_ticker.balance_sheet
            if bs is not None and not bs.empty:
                bs_records = []
                for col in sorted(bs.columns):
                    year = col.strftime("%Y") if hasattr(col, "strftime") else str(col)[:4]
                    bs_records.append({
                        "year": year,
                        "total_assets": _safe_num(bs.at["Total Assets", col]) if "Total Assets" in bs.index else 0,
                        "total_liabilities": _safe_num(bs.at["Total Liabilities Net Minority Interest", col]) if "Total Liabilities Net Minority Interest" in bs.index else 0,
                        "equity": _safe_num(bs.at["Stockholders Equity", col]) if "Stockholders Equity" in bs.index else 0,
                    })
                result["balance_sheet"] = bs_records
        except Exception:
            pass

        # --- Cash flow (annual, last 4 years) ---
        try:
            cf = yf_ticker.cashflow
            if cf is not None and not cf.empty:
                cf_records = []
                for col in sorted(cf.columns):
                    year = col.strftime("%Y") if hasattr(col, "strftime") else str(col)[:4]
                    cf_records.append({
                        "year": year,
                        "operating": _safe_num(cf.at["Operating Cash Flow", col]) if "Operating Cash Flow" in cf.index else 0,
                        "investing": _safe_num(cf.at["Investing Cash Flow", col]) if "Investing Cash Flow" in cf.index else 0,
                        "financing": _safe_num(cf.at["Financing Cash Flow", col]) if "Financing Cash Flow" in cf.index else 0,
                    })
                result["cashflow"] = cf_records
        except Exception:
            pass

        # --- Key ratios from info ---
        try:
            info = yf_ticker.info or {}
            result["ratios"] = {
                "roe": info.get("returnOnEquity"),
                "roa": info.get("returnOnAssets"),
                "debt_to_equity": info.get("debtToEquity"),
                "current_ratio": info.get("currentRatio"),
                "profit_margin": info.get("profitMargins"),
                "pe_ratio": info.get("trailingPE"),
            }
        except Exception:
            pass

    except Exception as e:
        return {"error": str(e)}

    return result
```

Also add this helper function before the endpoint (after line 148):

```python
def _safe_num(val) -> float:
    """Convert a value to float safely, returning 0 for None/NaN."""
    import math
    if val is None:
        return 0
    try:
        f = float(val)
        return 0 if math.isnan(f) else round(f, 2)
    except (ValueError, TypeError):
        return 0
```

- [ ] **Step 2: Test the endpoint manually**

Run: `cd /home/ubuntu/huynk/trading/web/backend && python -c "
import asyncio, json
from main import get_chart_data
result = asyncio.run(get_chart_data('AAPL', '2026-04-01'))
print(json.dumps(list(result.keys())))
print('price records:', len(result.get('price', [])))
print('income records:', len(result.get('income', [])))
"`
Expected: keys include `price`, `income`, `balance_sheet`, `cashflow`, `ratios`; price records > 0.

- [ ] **Step 3: Commit**

```bash
git add web/backend/main.py
git commit -m "feat: add /api/chart-data endpoint for structured chart data"
```

---

### Task 2: Frontend — install dependencies

**Files:**
- Modify: `web/frontend/package.json`

- [ ] **Step 1: Install recharts, html2canvas, jspdf**

Run:
```bash
cd /home/ubuntu/huynk/trading/web/frontend && npm install recharts html2canvas jspdf
```

- [ ] **Step 2: Verify installation**

Run: `cd /home/ubuntu/huynk/trading/web/frontend && node -e "require('recharts'); require('html2canvas'); require('jspdf'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add web/frontend/package.json web/frontend/package-lock.json
git commit -m "feat: add recharts, html2canvas, jspdf dependencies"
```

---

### Task 3: Frontend — MarketCharts component

**Files:**
- Create: `web/frontend/src/components/charts/MarketCharts.jsx`

- [ ] **Step 1: Create MarketCharts component**

Create `web/frontend/src/components/charts/MarketCharts.jsx`:

```jsx
import {
  ResponsiveContainer, ComposedChart, LineChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'

const CHART_COLORS = {
  price: '#3b82f6',
  volume: '#64748b',
  rsi: '#f59e0b',
  macd: '#3b82f6',
  signal: '#ef4444',
  histogram: '#22c55e',
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatNumber(val) {
  if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1) + 'B'
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M'
  if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(1) + 'K'
  return val.toFixed(2)
}

function ChartWrapper({ title, children }) {
  return (
    <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

export default function MarketCharts({ chartData }) {
  if (!chartData) return null

  const { price, rsi, macd } = chartData

  return (
    <div className="space-y-4">
      {price && price.length > 0 && (
        <ChartWrapper title="Biểu đồ Giá & Khối lượng">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={price}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={11} />
              <YAxis yAxisId="price" orientation="left" stroke="#94a3b8" fontSize={11} tickFormatter={v => formatNumber(v)} />
              <YAxis yAxisId="vol" orientation="right" stroke="#94a3b8" fontSize={11} tickFormatter={v => formatNumber(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Bar yAxisId="vol" dataKey="volume" fill={CHART_COLORS.volume} opacity={0.3} name="Khối lượng" />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke={CHART_COLORS.price} dot={false} strokeWidth={2} name="Giá đóng cửa" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {rsi && rsi.length > 0 && (
        <ChartWrapper title="RSI (Relative Strength Index)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rsi}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Quá mua", fill: "#ef4444", fontSize: 10 }} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Quá bán", fill: "#22c55e", fontSize: 10 }} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS.rsi} dot={false} strokeWidth={2} name="RSI" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {macd && macd.length > 0 && (
        <ChartWrapper title="MACD">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={macd}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="histogram" fill={CHART_COLORS.histogram} opacity={0.5} name="Histogram" />
              <Line type="monotone" dataKey="macd" stroke={CHART_COLORS.macd} dot={false} strokeWidth={2} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke={CHART_COLORS.signal} dot={false} strokeWidth={2} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/components/charts/MarketCharts.jsx
git commit -m "feat: add MarketCharts component with price, RSI, MACD charts"
```

---

### Task 4: Frontend — FinancialReportsCharts component

**Files:**
- Create: `web/frontend/src/components/charts/FinancialReportsCharts.jsx`

- [ ] **Step 1: Create FinancialReportsCharts component**

Create `web/frontend/src/components/charts/FinancialReportsCharts.jsx`:

```jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

function formatBillion(val) {
  if (val === 0) return '0'
  if (Math.abs(val) >= 1e12) return (val / 1e12).toFixed(1) + 'T'
  if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1) + 'B'
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M'
  return val.toLocaleString()
}

function ChartWrapper({ title, children }) {
  return (
    <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

export default function FinancialReportsCharts({ chartData }) {
  if (!chartData) return null

  const { income, cashflow } = chartData

  return (
    <div className="space-y-4">
      {income && income.length > 0 && (
        <ChartWrapper title="Doanh thu & Lợi nhuận (4 năm)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={income}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatBillion} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(val) => formatBillion(val)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gross_profit" fill="#22c55e" name="Lợi nhuận gộp" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net_income" fill="#f59e0b" name="Lợi nhuận ròng" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {cashflow && cashflow.length > 0 && (
        <ChartWrapper title="Dòng tiền (4 năm)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatBillion} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(val) => formatBillion(val)}
              />
              <Legend />
              <Bar dataKey="operating" fill="#3b82f6" name="Hoạt động KD" radius={[4, 4, 0, 0]} />
              <Bar dataKey="investing" fill="#ef4444" name="Đầu tư" radius={[4, 4, 0, 0]} />
              <Bar dataKey="financing" fill="#8b5cf6" name="Tài chính" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/components/charts/FinancialReportsCharts.jsx
git commit -m "feat: add FinancialReportsCharts component for income & cashflow"
```

---

### Task 5: Frontend — FundamentalsCharts component

**Files:**
- Create: `web/frontend/src/components/charts/FundamentalsCharts.jsx`

- [ ] **Step 1: Create FundamentalsCharts component**

Create `web/frontend/src/components/charts/FundamentalsCharts.jsx`:

```jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

function formatBillion(val) {
  if (val === 0) return '0'
  if (Math.abs(val) >= 1e12) return (val / 1e12).toFixed(1) + 'T'
  if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1) + 'B'
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M'
  return val.toLocaleString()
}

function formatPercent(val) {
  if (val == null) return 'N/A'
  return (val * 100).toFixed(1) + '%'
}

function ChartWrapper({ title, children }) {
  return (
    <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

export default function FundamentalsCharts({ chartData }) {
  if (!chartData) return null

  const { balance_sheet, ratios } = chartData

  return (
    <div className="space-y-4">
      {balance_sheet && balance_sheet.length > 0 && (
        <ChartWrapper title="Tài sản & Nợ phải trả (4 năm)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={balance_sheet}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatBillion} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(val) => formatBillion(val)}
              />
              <Legend />
              <Bar dataKey="total_assets" fill="#3b82f6" name="Tổng tài sản" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total_liabilities" fill="#ef4444" name="Tổng nợ" radius={[4, 4, 0, 0]} />
              <Bar dataKey="equity" fill="#22c55e" name="Vốn chủ sở hữu" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {ratios && (
        <ChartWrapper title="Chỉ số Tài chính">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'roe', label: 'ROE', format: formatPercent },
              { key: 'roa', label: 'ROA', format: formatPercent },
              { key: 'profit_margin', label: 'Biên LN ròng', format: formatPercent },
              { key: 'current_ratio', label: 'Hệ số thanh toán', format: v => v != null ? v.toFixed(2) : 'N/A' },
              { key: 'debt_to_equity', label: 'Nợ/Vốn CSH', format: v => v != null ? v.toFixed(2) : 'N/A' },
              { key: 'pe_ratio', label: 'P/E', format: v => v != null ? v.toFixed(2) : 'N/A' },
            ].map(({ key, label, format }) => (
              <div key={key} className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className="text-lg font-bold text-white">{format(ratios[key])}</div>
              </div>
            ))}
          </div>
        </ChartWrapper>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/components/charts/FundamentalsCharts.jsx
git commit -m "feat: add FundamentalsCharts component for balance sheet & ratios"
```

---

### Task 6: Frontend — PDF export utility

**Files:**
- Create: `web/frontend/src/utils/exportPdf.js`

- [ ] **Step 1: Create exportPdf utility**

Create `web/frontend/src/utils/exportPdf.js`:

```javascript
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

  const imgData = canvas.toDataURL('image/png')
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
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/utils/exportPdf.js
git commit -m "feat: add PDF export utility using html2canvas + jsPDF"
```

---

### Task 7: Frontend — integrate charts and PDF into ResultsView

**Files:**
- Modify: `web/frontend/src/components/ResultsView.jsx`

- [ ] **Step 1: Update ResultsView with chart rendering and PDF export**

Replace the entire `web/frontend/src/components/ResultsView.jsx` with:

```jsx
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  TrendingUp, TrendingDown, Minus, BarChart3, MessageSquare,
  Newspaper, PieChart, Users, Briefcase, Shield, Award,
  ChevronDown, ChevronUp, RefreshCcw, Download, FileText, Loader2
} from 'lucide-react'
import MarketCharts from './charts/MarketCharts'
import FinancialReportsCharts from './charts/FinancialReportsCharts'
import FundamentalsCharts from './charts/FundamentalsCharts'
import { exportReportToPdf } from '../utils/exportPdf'

const SECTION_META = {
  market_report: { icon: BarChart3, color: 'blue', label: 'Phân tích Thị trường' },
  financial_reports_report: { icon: MessageSquare, color: 'violet', label: 'Phân tích Báo cáo Tài chính' },
  news_report: { icon: Newspaper, color: 'amber', label: 'Phân tích Tin tức' },
  fundamentals_report: { icon: PieChart, color: 'emerald', label: 'Phân tích Cơ bản' },
  investment_plan: { icon: Users, color: 'purple', label: 'Quyết định Đội Nghiên cứu' },
  trader_plan: { icon: Briefcase, color: 'orange', label: 'Kế hoạch Giao dịch' },
  final_decision: { icon: Award, color: 'cyan', label: 'Quyết định Cuối cùng' },
}

const CHART_COMPONENTS = {
  market_report: MarketCharts,
  financial_reports_report: FinancialReportsCharts,
  fundamentals_report: FundamentalsCharts,
}

function DecisionBadge({ decision }) {
  if (!decision) return null
  const d = decision.toUpperCase()
  let color, icon, label

  if (d.includes('BUY') || d.includes('OVERWEIGHT')) {
    color = 'from-emerald-500 to-green-400'
    icon = <TrendingUp className="w-6 h-6" />
    label = d.includes('OVERWEIGHT') ? 'OVERWEIGHT' : 'MUA'
  } else if (d.includes('SELL') || d.includes('UNDERWEIGHT')) {
    color = 'from-red-500 to-rose-400'
    icon = <TrendingDown className="w-6 h-6" />
    label = d.includes('UNDERWEIGHT') ? 'UNDERWEIGHT' : 'BÁN'
  } else {
    color = 'from-amber-500 to-yellow-400'
    icon = <Minus className="w-6 h-6" />
    label = 'GIỮ'
  }

  return (
    <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r ${color} text-white font-bold text-xl shadow-xl`}>
      {icon}
      {label}
    </div>
  )
}

function ReportSection({ sectionKey, data, chartData }) {
  const [open, setOpen] = useState(sectionKey === 'final_decision')
  const meta = SECTION_META[sectionKey]
  if (!meta || !data) return null

  const Icon = meta.icon
  const isDecision = sectionKey === 'final_decision'
  const ChartComponent = CHART_COMPONENTS[sectionKey]

  return (
    <div className={`bg-slate-900/60 border rounded-2xl overflow-hidden transition-all ${
      isDecision ? 'border-cyan-500/40 shadow-lg shadow-cyan-500/5' : 'border-slate-800'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-${meta.color}-500/15 flex items-center justify-center`}>
            <Icon className={`w-4.5 h-4.5 text-${meta.color}-400`} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-200 text-sm">{data.title || meta.label}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-800/50 pt-4 fade-up">
          <div className="md-body text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.content}
            </ReactMarkdown>
          </div>
          {ChartComponent && chartData && (
            <ChartComponent chartData={chartData} />
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsView({ data, onNewAnalysis }) {
  if (!data) return null

  const { decision, complete_report, ticker, date } = data
  const sections = complete_report || {}
  const [chartData, setChartData] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!ticker) return
    fetch(`/api/chart-data/${encodeURIComponent(ticker)}?date=${encodeURIComponent(date)}`)
      .then(r => r.json())
      .then(setChartData)
      .catch(() => setChartData(null))
  }, [ticker, date])

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      await exportReportToPdf('report-content', ticker, date)
    } finally {
      setExporting(false)
    }
  }

  // Map section keys to their chart data subsets
  const sectionChartData = chartData ? {
    market_report: { price: chartData.price, rsi: chartData.rsi, macd: chartData.macd },
    financial_reports_report: { income: chartData.income, cashflow: chartData.cashflow },
    fundamentals_report: { balance_sheet: chartData.balance_sheet, ratios: chartData.ratios },
  } : {}

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 fade-up">
      <div id="report-content">
        {/* Decision Hero */}
        <div className="text-center mb-12">
          <p className="text-sm text-slate-400 mb-2 font-mono">{ticker} &mdash; {date}</p>
          <h2 className="text-3xl font-extrabold text-white mb-6">Kết quả Phân tích</h2>
          <DecisionBadge decision={decision} />
        </div>

        {/* Report Sections */}
        <div className="space-y-3">
          {Object.entries(sections).map(([key, sec]) => (
            <ReportSection
              key={key}
              sectionKey={key}
              data={sec}
              chartData={sectionChartData[key] || null}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 mt-10">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Phân tích mới
        </button>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {exporting ? 'Đang xuất...' : 'Tải PDF'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/components/ResultsView.jsx
git commit -m "feat: integrate charts and PDF export into ResultsView"
```

---

### Task 8: Backend — send chart_data in WebSocket complete event

**Files:**
- Modify: `web/backend/main.py`

- [ ] **Step 1: Add chart_data to the complete event**

In `web/backend/main.py`, update the section that sends the `complete` event (around line 379). Replace the `await _send(ws, "complete", ...)` block with:

```python
        # Collect chart data
        chart_data = {}
        try:
            chart_result = await get_chart_data(ticker, analysis_date)
            if isinstance(chart_result, dict) and "error" not in chart_result:
                chart_data = chart_result
        except Exception:
            pass

        await _send(ws, "complete", {
            "decision": decision,
            "agents": {k: {"status": v, "name": AGENT_DISPLAY_NAMES.get(k, k)} for k, v in agent_status.items()},
            "reports": report_sections,
            "complete_report": complete_report,
            "ticker": ticker,
            "date": analysis_date,
            "chart_data": chart_data,
        })
```

- [ ] **Step 2: Update frontend to use WebSocket chart_data if available**

In `web/frontend/src/components/ResultsView.jsx`, update the `useEffect` for chart data to prefer data from the WebSocket response:

Replace the existing `useEffect` block:
```jsx
  useEffect(() => {
    if (!ticker) return
    fetch(`/api/chart-data/${encodeURIComponent(ticker)}?date=${encodeURIComponent(date)}`)
      .then(r => r.json())
      .then(setChartData)
      .catch(() => setChartData(null))
  }, [ticker, date])
```

With:
```jsx
  useEffect(() => {
    // Use chart_data from WebSocket response if available
    if (data.chart_data && Object.keys(data.chart_data).length > 0) {
      setChartData(data.chart_data)
      return
    }
    // Fallback: fetch from REST endpoint
    if (!ticker) return
    fetch(`/api/chart-data/${encodeURIComponent(ticker)}?date=${encodeURIComponent(date)}`)
      .then(r => r.json())
      .then(setChartData)
      .catch(() => setChartData(null))
  }, [ticker, date, data.chart_data])
```

- [ ] **Step 3: Commit**

```bash
git add web/backend/main.py web/frontend/src/components/ResultsView.jsx
git commit -m "feat: send chart_data via WebSocket, fallback to REST endpoint"
```

---

### Task 9: Verify and create charts directory

**Files:**
- Create: `web/frontend/src/components/charts/` (directory)
- Create: `web/frontend/src/utils/` (directory)

- [ ] **Step 1: Ensure directories exist**

Run:
```bash
mkdir -p /home/ubuntu/huynk/trading/web/frontend/src/components/charts
mkdir -p /home/ubuntu/huynk/trading/web/frontend/src/utils
```

Note: This task should be done FIRST before Tasks 3-6 that create files in these directories. The plan lists it here for completeness but it must be executed as a pre-requisite.

---

### Task 10: End-to-end verification

- [ ] **Step 1: Build frontend**

Run:
```bash
cd /home/ubuntu/huynk/trading/web/frontend && npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify backend starts**

Run:
```bash
cd /home/ubuntu/huynk/trading/web/backend && timeout 5 python -c "from main import app; print('Backend OK')" 2>&1 || true
```
Expected: Prints `Backend OK`.

- [ ] **Step 3: Final commit for any fixes**

If any fixes were needed, commit them:
```bash
git add -A && git commit -m "fix: resolve build issues for charts & PDF export"
```
