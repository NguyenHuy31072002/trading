import { useState, useEffect } from 'react'
import { Search, Calendar, Users, Layers, Cpu, Brain, Rocket } from 'lucide-react'

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
    { id: 1, name: 'Thấp', desc: 'Nghiên cứu nhanh, ít vòng tranh luận' },
    { id: 3, name: 'Cao', desc: 'Nghiên cứu kỹ lưỡng, nhiều vòng tranh luận' },
    { id: 5, name: 'Chuyên sâu', desc: 'Nghiên cứu toàn diện, tranh luận chuyên sâu' },
  ],
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
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setConfig(data)
        if (data.quick_models?.[provider]?.[0]) setQuickModel(data.quick_models[provider][0].id)
        if (data.deep_models?.[provider]?.[0]) setDeepModel(data.deep_models[provider][0].id)
      })
      .catch(() => setConfig(DEFAULT_CONFIG))
  }, [])

  useEffect(() => {
    if (!config) return
    const qm = config.quick_models?.[provider]
    const dm = config.deep_models?.[provider]
    if (qm?.[0]) setQuickModel(qm[0].id)
    if (dm?.[0]) setDeepModel(dm[0].id)
  }, [provider, config])

  const toggleAnalyst = (id) => {
    setAnalysts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ticker.trim() || analysts.length === 0) return
    onStart({ ticker, date, analysts, depth, provider, quick_model: quickModel, deep_model: deepModel })
  }

  const cfg = config || DEFAULT_CONFIG

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 fade-up">
      {/* Hero */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-4">
          Phân tích Giao dịch AI
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Hệ thống đa tác tử AI phân tích thị trường, tranh luận chiến lược,
          và đưa ra quyết định giao dịch thông minh
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Ticker + Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card icon={<Search className="w-5 h-5" />} title="Mã cổ phiếu" step="1">
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              placeholder="VNM.VN, FPT.VN, AAPL..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-lg"
              required
            />
            <p className="text-xs text-slate-500 mt-2">Hậu tố sàn: .VN (Việt Nam), .HK (Hong Kong), .T (Tokyo)</p>
          </Card>

          <Card icon={<Calendar className="w-5 h-5" />} title="Ngày phân tích" step="2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-lg"
            />
          </Card>
        </div>

        {/* Analysts */}
        <Card icon={<Users className="w-5 h-5" />} title="Đội phân tích" step="3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cfg.analysts.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAnalyst(a.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  analysts.includes(a.id)
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl block mb-2">{a.icon}</span>
                <span className="text-sm font-medium text-slate-200">{a.name}</span>
              </button>
            ))}
          </div>
          {analysts.length === 0 && (
            <p className="text-red-400 text-sm mt-2">Vui lòng chọn ít nhất một nhà phân tích</p>
          )}
        </Card>

        {/* Depth */}
        <Card icon={<Layers className="w-5 h-5" />} title="Độ sâu nghiên cứu" step="4">
          <div className="grid grid-cols-3 gap-3">
            {cfg.depth_options.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDepth(d.id)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  depth === d.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <span className="font-semibold text-white block">{d.name}</span>
                <span className="text-xs text-slate-400 mt-1 block">{d.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Provider + Models */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card icon={<Cpu className="w-5 h-5" />} title="Nhà cung cấp LLM" step="5">
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition"
            >
              {cfg.providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Card>

          <Card icon={<Brain className="w-5 h-5" />} title="LLM Tư duy Nhanh" step="6a">
            <select
              value={quickModel}
              onChange={e => setQuickModel(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition"
            >
              {(config?.quick_models?.[provider] || []).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Card>

          <Card icon={<Brain className="w-5 h-5" />} title="LLM Tư duy Sâu" step="6b">
            <select
              value={deepModel}
              onChange={e => setDeepModel(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition"
            >
              {(config?.deep_models?.[provider] || []).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Card>
        </div>

        {/* Submit */}
        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={!ticker.trim() || analysts.length === 0}
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-2xl text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Rocket className="w-5 h-5" />
            Bắt đầu Phân tích
          </button>
        </div>
      </form>
    </div>
  )
}

function Card({ icon, title, step, children }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
          {icon}
        </div>
        <div>
          <span className="text-xs text-slate-500 font-mono">Bước {step}</span>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  )
}
