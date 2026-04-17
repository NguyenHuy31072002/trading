import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  TrendingUp, TrendingDown, Minus, BarChart3, MessageSquare,
  Newspaper, PieChart, Users, Briefcase, Award,
  ChevronDown, ChevronUp, RefreshCcw, FileText,
} from 'lucide-react'
import MarketCharts from './charts/MarketCharts'
import FinancialReportsCharts from './charts/FinancialReportsCharts'
import FundamentalsCharts from './charts/FundamentalsCharts'
import { exportStructuredReportToHtml } from '../utils/exportHtml'

const SECTION_META = {
  market_report: { icon: BarChart3, label: 'Phân tích Thị trường' },
  financial_reports_report: { icon: MessageSquare, label: 'Phân tích Báo cáo Tài chính' },
  news_report: { icon: Newspaper, label: 'Phân tích Tin tức' },
  fundamentals_report: { icon: PieChart, label: 'Phân tích Cơ bản' },
  investment_plan: { icon: Users, label: 'Quyết định Đội Nghiên cứu' },
  trader_plan: { icon: Briefcase, label: 'Kế hoạch Giao dịch' },
  final_decision: { icon: Award, label: 'Quyết định Cuối cùng' },
}

const CHART_COMPONENTS = {
  market_report: MarketCharts,
  financial_reports_report: FinancialReportsCharts,
  fundamentals_report: FundamentalsCharts,
}

function decisionStyle(decision) {
  const d = (decision || '').toUpperCase()
  if (d.includes('BUY') || d.includes('OVERWEIGHT')) {
    return {
      label: d.includes('OVERWEIGHT') ? 'Overweight' : 'Mua',
      icon: TrendingUp, bg: 'bg-buy-bg', text: 'text-buy', border: 'border-buy',
    }
  }
  if (d.includes('SELL') || d.includes('UNDERWEIGHT')) {
    return {
      label: d.includes('UNDERWEIGHT') ? 'Underweight' : 'Bán',
      icon: TrendingDown, bg: 'bg-sell-bg', text: 'text-sell', border: 'border-sell',
    }
  }
  return {
    label: 'Giữ', icon: Minus, bg: 'bg-hold-bg', text: 'text-hold', border: 'border-hold',
  }
}

function DecisionPill({ decision }) {
  if (!decision) return null
  const style = decisionStyle(decision)
  const Icon = style.icon
  return (
    <div className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
      <Icon className="w-4 h-4" strokeWidth={2} />
      <span className="text-[13px] font-medium">{style.label}</span>
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
    <div className={`bg-bg-primary border rounded-lg overflow-hidden transition ${
      isDecision ? 'border-info' : 'border-border-subtle'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-11 px-4 hover:bg-bg-secondary transition cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-3.5 h-3.5 ${isDecision ? 'text-info' : 'text-text-tertiary'}`} strokeWidth={1.75} />
          <h3 className={`text-[13px] font-medium ${isDecision ? 'text-info' : 'text-text-primary'}`}>
            {data.title || meta.label}
          </h3>
        </div>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
        )}
      </button>

      {open && (
        <div className="px-4 py-4 border-t border-border-subtle fade-up">
          <div className="md-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.content}
            </ReactMarkdown>
          </div>
          {ChartComponent && chartData && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <ChartComponent chartData={chartData} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsView({ data, onNewAnalysis }) {
  const [chartData, setChartData] = useState(null)
  const ticker = data?.ticker
  const date = data?.date
  const wsChart = data?.chart_data

  useEffect(() => {
    if (wsChart && Object.keys(wsChart).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChartData(wsChart)
      return
    }
    if (!ticker) return
    fetch(`${import.meta.env.BASE_URL}api/chart-data/${encodeURIComponent(ticker)}?date=${encodeURIComponent(date)}`)
      .then(r => r.json())
      .then(setChartData)
      .catch(() => setChartData(null))
  }, [ticker, date, wsChart])

  if (!data) return null

  const { decision, complete_report } = data
  const sections = complete_report || {}

  const handleExportHtml = () => {
    exportStructuredReportToHtml(sections, ticker, date, decision, chartData)
  }

  const sectionChartData = chartData ? {
    market_report: { price: chartData.price, rsi: chartData.rsi, macd: chartData.macd },
    financial_reports_report: { income: chartData.income, cashflow: chartData.cashflow },
    fundamentals_report: { balance_sheet: chartData.balance_sheet, ratios: chartData.ratios },
  } : {}

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 fade-up">
      <div id="report-content">
        {/* Decision header */}
        <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-text-tertiary mb-1 tabular-nums tracking-tight">
              <span className="font-medium text-text-secondary">{ticker}</span>
              <span>·</span>
              <span>{date}</span>
            </div>
            <h1 className="text-2xl font-medium text-text-primary tracking-tight">Kết quả phân tích</h1>
          </div>
          <DecisionPill decision={decision} />
        </div>

        {/* Report sections */}
        <div className="space-y-2">
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
      <div className="flex justify-end gap-2 mt-8 pt-6 border-t border-border-subtle">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-bg-primary border border-border-subtle hover:border-border-default text-text-primary rounded-md text-[13px] font-medium transition cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
          Phân tích mới
        </button>
        <button
          onClick={handleExportHtml}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-info text-info-bg rounded-md text-[13px] font-medium transition cursor-pointer hover:opacity-90"
        >
          <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
          Tải báo cáo
        </button>
      </div>
    </div>
  )
}
