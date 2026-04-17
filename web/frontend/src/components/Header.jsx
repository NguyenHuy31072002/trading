import { TrendingUp, Loader2, Sun, Moon } from 'lucide-react'
import { useTheme } from '../utils/theme'

export default function Header({ onHome, analysisRunning }) {
  const { theme, toggle } = useTheme()

  return (
    <header className="border-b border-border-subtle bg-bg-primary sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={onHome}
          className="flex items-center gap-2.5 hover:opacity-80 transition cursor-pointer"
        >
          <div className="w-7 h-7 rounded-md bg-info-bg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-info" strokeWidth={2} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-text-primary tracking-tight">TradingAgents</span>
            <span className="text-[11px] text-text-tertiary">Phân tích AI</span>
          </div>
        </button>

        <nav className="flex items-center gap-2">
          {analysisRunning && (
            <button
              onClick={onHome}
              title="Quay lại phân tích đang chạy"
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-sm bg-hold-bg text-hold text-[11px] font-medium hover:opacity-80 transition cursor-pointer"
            >
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
              Đang phân tích
            </button>
          )}
          <span className="hidden sm:inline-flex items-center h-7 px-2 rounded-sm bg-info-bg text-info text-[11px] font-medium tracking-tight">
            v0.3
          </span>
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            className="w-7 h-7 rounded-sm flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" strokeWidth={1.75} /> : <Moon className="w-4 h-4" strokeWidth={1.75} />}
          </button>
        </nav>
      </div>
    </header>
  )
}
