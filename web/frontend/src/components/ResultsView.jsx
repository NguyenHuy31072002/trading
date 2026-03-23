import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  TrendingUp, TrendingDown, Minus, BarChart3, MessageSquare,
  Newspaper, PieChart, Users, Briefcase, Shield, Award,
  ChevronDown, ChevronUp, RefreshCcw, Download
} from 'lucide-react'

const SECTION_META = {
  market_report: { icon: BarChart3, color: 'blue', label: 'Phân tích Thị trường' },
  sentiment_report: { icon: MessageSquare, color: 'violet', label: 'Tâm lý Mạng xã hội' },
  news_report: { icon: Newspaper, color: 'amber', label: 'Phân tích Tin tức' },
  fundamentals_report: { icon: PieChart, color: 'emerald', label: 'Phân tích Cơ bản' },
  investment_plan: { icon: Users, color: 'purple', label: 'Quyết định Đội Nghiên cứu' },
  trader_plan: { icon: Briefcase, color: 'orange', label: 'Kế hoạch Giao dịch' },
  final_decision: { icon: Award, color: 'cyan', label: 'Quyết định Cuối cùng' },
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

function ReportSection({ sectionKey, data }) {
  const [open, setOpen] = useState(sectionKey === 'final_decision')
  const meta = SECTION_META[sectionKey]
  if (!meta || !data) return null

  const Icon = meta.icon
  const isDecision = sectionKey === 'final_decision'

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
        </div>
      )}
    </div>
  )
}

export default function ResultsView({ data, onNewAnalysis }) {
  if (!data) return null

  const { decision, complete_report, ticker, date } = data
  const sections = complete_report || {}

  const handleDownload = () => {
    let md = `# Báo cáo Phân tích: ${ticker}\nNgày: ${date}\n\n`
    for (const [, sec] of Object.entries(sections)) {
      md += `## ${sec.title}\n\n${sec.content}\n\n---\n\n`
    }
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ticker}_${date}_report.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 fade-up">
      {/* Decision Hero */}
      <div className="text-center mb-12">
        <p className="text-sm text-slate-400 mb-2 font-mono">{ticker} &mdash; {date}</p>
        <h2 className="text-3xl font-extrabold text-white mb-6">Kết quả Phân tích</h2>
        <DecisionBadge decision={decision} />
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 mb-10">
        <button
          onClick={onNewAnalysis}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Phân tích mới
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Tải báo cáo
        </button>
      </div>

      {/* Report Sections */}
      <div className="space-y-3">
        {Object.entries(sections).map(([key, sec]) => (
          <ReportSection key={key} sectionKey={key} data={sec} />
        ))}
      </div>
    </div>
  )
}
