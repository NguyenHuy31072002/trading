import { useState, useEffect } from 'react'
import {
  TrendingUp, FileText, Newspaper, BarChart3, Check, ArrowRight, Circle,
} from 'lucide-react'

const DEFAULT_CONFIG = {
  providers: [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'google', name: 'Google' },
    { id: 'xai', name: 'xAI' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'ollama', name: 'Ollama' },
  ],
  analysts: [
    { id: 'market', name: 'Phân tích Thị trường', icon: '📈' },
    { id: 'financial_reports', name: 'Phân tích Báo cáo Tài chính', icon: '📑' },
    { id: 'news', name: 'Phân tích Tin tức', icon: '📰' },
    { id: 'fundamentals', name: 'Phân tích Cơ bản', icon: '📊' },
  ],
  depth_options: [
    { id: 1, name: 'Thấp', desc: 'Nhanh · 1 vòng tranh luận' },
    { id: 3, name: 'Cao', desc: 'Kỹ · 3 vòng tranh luận' },
    { id: 5, name: 'Chuyên sâu', desc: 'Toàn diện · 5 vòng tranh luận' },
  ],
}

const AGENT_META = {
  market: {
    icon: TrendingUp, label: 'Thị trường', desc: 'Chart + indicators',
    bgSel: 'bg-agent-market-bg', borderSel: 'border-agent-market', textSel: 'text-agent-market',
  },
  financial_reports: {
    icon: FileText, label: 'Báo cáo TC', desc: 'BCTC quý gần nhất',
    bgSel: 'bg-agent-financial-bg', borderSel: 'border-agent-financial', textSel: 'text-agent-financial',
  },
  news: {
    icon: Newspaper, label: 'Tin tức', desc: '7 ngày gần nhất',
    bgSel: 'bg-agent-news-bg', borderSel: 'border-agent-news', textSel: 'text-agent-news',
  },
  fundamentals: {
    icon: BarChart3, label: 'Cơ bản', desc: 'DCF, P/E, P/B',
    bgSel: 'bg-agent-fundamental-bg', borderSel: 'border-agent-fundamental', textSel: 'text-agent-fundamental',
  },
}

function SectionLabel({ step, title, right }) {
  return (
    <div className="flex items-end justify-between mb-2">
      <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-tertiary tabular-nums">
        {step} · {title}
      </span>
      {right && <span className="text-[11px] text-text-tertiary">{right}</span>}
    </div>
  )
}

function FieldCard({ children, className = '' }) {
  return (
    <div className={`bg-bg-primary border border-border-subtle rounded-lg p-3.5 ${className}`}>
      {children}
    </div>
  )
}

function AgentCard({ agentId, selected, onToggle }) {
  const meta = AGENT_META[agentId]
  if (!meta) return null
  const Icon = meta.icon

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-left p-2.5 rounded-md border transition cursor-pointer hover:border-border-default ${
        selected ? `${meta.bgSel} ${meta.borderSel}` : 'bg-bg-primary border-border-subtle'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <Icon
          className={`w-3.5 h-3.5 ${selected ? meta.textSel : 'text-text-tertiary'}`}
          strokeWidth={2}
        />
        {selected && <Check className={`w-3 h-3 ${meta.textSel}`} strokeWidth={3} />}
      </div>
      <div className={`text-[13px] font-medium ${selected ? meta.textSel : 'text-text-primary'}`}>
        {meta.label}
      </div>
      <div className={`text-[11px] mt-0.5 ${selected ? `${meta.textSel} opacity-75` : 'text-text-tertiary'}`}>
        {meta.desc}
      </div>
    </button>
  )
}

export default function ConfigPanel({ onStart }) {
  const [config, setConfig] = useState(null)
  const [ticker, setTicker] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [analysts, setAnalysts] = useState(['market', 'financial_reports', 'news', 'fundamentals'])
  const [depth, setDepth] = useState(1)
  const [provider, setProvider] = useState('openai')
  const [quickModel, setQuickModel] = useState('')
  const [deepModel, setDeepModel] = useState('')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/config`)
      .then(r => r.json())
      .then(data => {
        setConfig(data)
        if (data.quick_models?.[provider]?.[0]) setQuickModel(data.quick_models[provider][0].id)
        if (data.deep_models?.[provider]?.[0]) setDeepModel(data.deep_models[provider][0].id)
      })
      .catch(() => setConfig(DEFAULT_CONFIG))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!config) return
    const qm = config.quick_models?.[provider]
    const dm = config.deep_models?.[provider]
    if (qm?.[0]) setQuickModel(qm[0].id)
    if (dm?.[0]) setDeepModel(dm[0].id)
  }, [provider, config])

  const toggleAnalyst = (id) => {
    setAnalysts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ticker.trim() || analysts.length === 0) return
    onStart({ ticker, date, analysts, depth, provider, quick_model: quickModel, deep_model: deepModel })
  }

  const cfg = config || DEFAULT_CONFIG
  const depthEstimate = depth === 1 ? '~3 phút' : depth === 3 ? '~6 phút' : '~10 phút'

  const costProfile = config?.cost_profile || {
    input_tokens_per_call: 2500,
    output_tokens_per_call: 1500,
    deep_calls: 3,
  }
  const quickInfo = (config?.quick_models?.[provider] || []).find(m => m.id === quickModel)
  const deepInfo = (config?.deep_models?.[provider] || []).find(m => m.id === deepModel)

  const quickCalls = analysts.length + 5 * depth
  const deepCalls = costProfile.deep_calls
  const inTok = costProfile.input_tokens_per_call
  const outTok = costProfile.output_tokens_per_call
  const totalTokens = (quickCalls + deepCalls) * (inTok + outTok)
  const tokenEstimate = totalTokens >= 1000 ? `~${Math.round(totalTokens / 1000)}k` : `~${totalTokens}`

  const costDollar = (() => {
    if (!quickInfo || !deepInfo) return null
    const qIn = quickInfo.input_price, qOut = quickInfo.output_price
    const dIn = deepInfo.input_price, dOut = deepInfo.output_price
    if ([qIn, qOut, dIn, dOut].some(v => v == null)) return null
    const quickCost = quickCalls * (inTok * qIn + outTok * qOut) / 1e6
    const deepCost = deepCalls * (inTok * dIn + outTok * dOut) / 1e6
    return quickCost + deepCost
  })()
  const costEstimate = costDollar == null ? '—' :
    costDollar === 0 ? 'Miễn phí' :
    costDollar < 0.01 ? '<$0.01' :
    `~$${costDollar.toFixed(costDollar < 1 ? 2 : costDollar < 10 ? 2 : 1)}`

  const valid = ticker.trim() && analysts.length > 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-text-primary tracking-tight mb-1">Phân tích mới</h1>
        <p className="text-[13px] text-text-secondary">
          Cấu hình phiên phân tích đa tác tử — chọn mã, đội phân tích và mô hình LLM.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row 1: Ticker + Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldCard>
            <SectionLabel step="01" title="Mã cổ phiếu" />
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="VNM.VN, FPT.VN, AAPL…"
              className="w-full bg-transparent text-text-primary text-[15px] font-medium placeholder:text-text-tertiary placeholder:font-normal outline-none tabular-nums"
              required
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Hậu tố: .VN (Việt Nam) · .HK (Hong Kong) · .T (Tokyo)
            </p>
          </FieldCard>

          <FieldCard>
            <SectionLabel step="02" title="Ngày phân tích" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent text-text-primary text-[15px] font-medium outline-none tabular-nums [color-scheme:light] dark:[color-scheme:dark]"
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Phân tích trên dữ liệu đến hết ngày này.
            </p>
          </FieldCard>
        </div>

        {/* Row 2: Agents */}
        <FieldCard>
          <SectionLabel
            step="03"
            title="Đội phân tích"
            right={`${analysts.length}/4 đã chọn`}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {cfg.analysts.map(a => (
              <AgentCard
                key={a.id}
                agentId={a.id}
                selected={analysts.includes(a.id)}
                onToggle={() => toggleAnalyst(a.id)}
              />
            ))}
          </div>
          {analysts.length === 0 && (
            <p className="text-[11px] text-sell mt-2">Chọn ít nhất một đội phân tích</p>
          )}
        </FieldCard>

        {/* Row 3: Depth + Provider */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-3">
          <FieldCard>
            <SectionLabel step="04" title="Độ sâu nghiên cứu" right={depthEstimate} />
            <div className="grid grid-cols-3 gap-1.5">
              {cfg.depth_options.map(d => {
                const active = depth === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDepth(d.id)}
                    className={`p-2 rounded-md border text-left transition cursor-pointer ${
                      active
                        ? 'bg-info-bg border-info'
                        : 'bg-bg-primary border-border-subtle hover:border-border-default'
                    }`}
                  >
                    <div className={`text-[13px] font-medium ${active ? 'text-info' : 'text-text-primary'}`}>
                      {d.name}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${active ? 'text-info opacity-75' : 'text-text-tertiary'}`}>
                      {d.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </FieldCard>

          <FieldCard>
            <div className="flex items-end justify-between mb-2">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-tertiary">
                05 · Nhà cung cấp LLM
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-buy">
                <Circle className="w-1.5 h-1.5 fill-buy text-buy pulse-dot" strokeWidth={0} />
                Hoạt động
              </span>
            </div>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full bg-transparent text-text-primary text-[13px] font-medium outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
            >
              {cfg.providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FieldCard>
        </div>

        {/* Row 4: Models */}
        <FieldCard>
          <SectionLabel step="06" title="Mô hình" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-border-subtle rounded-md p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-text-tertiary">Tư duy nhanh</span>
                <PricePill price={quickInfo} />
              </div>
              <select
                value={quickModel}
                onChange={e => setQuickModel(e.target.value)}
                className="w-full bg-transparent text-text-primary text-[13px] font-medium outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              >
                {(config?.quick_models?.[provider] || []).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="border border-border-subtle rounded-md p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-text-tertiary">Tư duy sâu</span>
                <PricePill price={deepInfo} />
              </div>
              <select
                value={deepModel}
                onChange={e => setDeepModel(e.target.value)}
                className="w-full bg-transparent text-text-primary text-[13px] font-medium outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              >
                {(config?.deep_models?.[provider] || []).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-text-tertiary">
            Giá chỉ mang tính tham khảo theo bảng giá công bố. Chi phí thực có thể khác do số token input/output thực tế.
          </div>
        </FieldCard>

        {/* Summary bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3.5 bg-bg-secondary border border-border-subtle rounded-lg mt-2">
          <div className="flex items-center gap-5 tabular-nums">
            <Metric label="Chi phí ước tính" value={costEstimate} />
            <Divider />
            <Metric label="Thời gian" value={depthEstimate} />
            <Divider />
            <Metric label="Tokens" value={tokenEstimate} />
          </div>
          <button
            type="submit"
            disabled={!valid}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 bg-info text-info-bg text-[13px] font-medium rounded-md transition cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Bắt đầu phân tích
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-tertiary">{label}</span>
      <span className="text-[13px] font-medium text-text-primary">{value}</span>
    </div>
  )
}

function Divider() {
  return <span className="w-px h-6 bg-border-subtle" />
}

function PricePill({ price }) {
  if (!price || price.input_price == null || price.output_price == null) {
    return <span className="text-[10px] text-text-tertiary tabular-nums">—</span>
  }
  if (price.input_price === 0 && price.output_price === 0) {
    return <span className="text-[10px] font-medium text-buy tabular-nums">Free</span>
  }
  const fmt = (v) => v < 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(1)}`
  return (
    <span className="text-[10px] text-text-tertiary tabular-nums" title={`Input ${fmt(price.input_price)}/1M · Output ${fmt(price.output_price)}/1M`}>
      {fmt(price.input_price)} / {fmt(price.output_price)} <span className="opacity-60">/1M</span>
    </span>
  )
}
