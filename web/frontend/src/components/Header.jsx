import { TrendingUp } from 'lucide-react'

export default function Header({ onHome }) {
  return (
    <header className="border-b border-slate-800 bg-[#0d1220]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">TradingAgents</h1>
            <p className="text-xs text-slate-400">Phân tích AI</p>
          </div>
        </button>
        <nav className="flex items-center gap-4 text-sm text-slate-400">
          <span className="hidden sm:inline px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
            v0.2.2
          </span>
        </nav>
      </div>
    </header>
  )
}
