# Charts & PDF Export Design

## Goal

Add interactive charts to each analysis section in the web app and allow users to export the full report (markdown + charts) as a PDF with basic header/footer.

## Scope

- Web frontend only. CLI remains markdown-only.
- No changes to agent logic or graph flow.

## Data Flow

Backend attaches structured `chart_data` alongside each report section's `content`. Data is sourced from existing tools (`get_stock_data`, `get_indicators`, `get_fundamentals`, `get_balance_sheet`, `get_cashflow`, `get_income_statement`) called after analysis completes.

### chart_data Schema

```json
{
  "market_report": {
    "title": "...",
    "content": "markdown...",
    "chart_data": {
      "price": [{"date": "2026-01-01", "open": 100, "high": 105, "low": 98, "close": 102, "volume": 50000}],
      "indicators": {
        "rsi": [{"date": "2026-01-01", "value": 55}],
        "macd": [{"date": "2026-01-01", "macd": 1.2, "signal": 0.8, "histogram": 0.4}]
      }
    }
  },
  "financial_reports_report": {
    "title": "...",
    "content": "markdown...",
    "chart_data": {
      "income": [{"year": "2022", "revenue": 1000, "net_income": 200, "gross_profit": 400}],
      "balance_sheet": [{"year": "2022", "total_assets": 5000, "total_liabilities": 2000, "equity": 3000}],
      "cashflow": [{"year": "2022", "operating": 300, "investing": -100, "financing": -50}]
    }
  },
  "news_report": {
    "title": "...",
    "content": "markdown...",
    "chart_data": null
  },
  "fundamentals_report": {
    "title": "...",
    "content": "markdown...",
    "chart_data": {
      "ratios": [{"year": "2022", "roe": 0.15, "roa": 0.08, "debt_to_equity": 0.6, "current_ratio": 1.5}],
      "balance_sheet": [{"year": "2022", "total_assets": 5000, "total_liabilities": 2000, "equity": 3000}]
    }
  }
}
```

## Charts per Section

| Section | Chart Type | Recharts Component | Data |
|---------|-----------|-------------------|------|
| Market Analysis | Price line + volume bars | ComposedChart (Line + Bar) | price array |
| Market Analysis | RSI line | LineChart | indicators.rsi |
| Market Analysis | MACD lines + histogram | ComposedChart | indicators.macd |
| Financial Reports | Revenue/profit grouped bars (4 years) | BarChart | income array |
| Financial Reports | Cash flow grouped bars | BarChart | cashflow array |
| News | None | - | - |
| Fundamentals | Assets vs liabilities bars | BarChart | balance_sheet array |
| Fundamentals | ROE/ROA trend lines | LineChart | ratios array |

Charts render directly below the markdown content of each section inside `ResultsView.jsx`.

## PDF Export

Libraries: `html2canvas` + `jspdf`.

Process:
1. User clicks "Tai PDF" button (replaces current markdown download button).
2. Capture the report container DOM element using html2canvas.
3. Split into pages based on content height.
4. Add simple header per page: stock ticker + analysis date.
5. Add simple footer per page: page number.
6. Save as `{ticker}_{date}_report.pdf`.

## File Changes

### Backend: `web/backend/main.py`
- New function `_collect_chart_data(ticker, date)`: calls data tools and returns structured chart_data dict.
- Update `_build_report()`: attach `chart_data` to each section.

### Frontend: new dependencies
- `recharts` — charting library
- `html2canvas` — DOM to canvas
- `jspdf` — canvas to PDF

### Frontend: new files
- `src/components/charts/MarketCharts.jsx` — price, volume, RSI, MACD charts
- `src/components/charts/FinancialReportsCharts.jsx` — revenue, profit, cashflow charts
- `src/components/charts/FundamentalsCharts.jsx` — ratios, balance sheet charts
- `src/utils/exportPdf.js` — PDF export logic

### Frontend: modified files
- `src/components/ResultsView.jsx` — render chart components under each section, replace download button with PDF export

### No changes
- CLI code
- Agent files
- Graph flow
- Existing tool implementations
