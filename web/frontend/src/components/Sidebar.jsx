import { useState } from 'react'
import { History, Trash2, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function decisionInfo(decision) {
  const d = (decision || '').toUpperCase()
  if (d.includes('BUY') || d.includes('OVERWEIGHT')) {
    return { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  }
  if (d.includes('SELL') || d.includes('UNDERWEIGHT')) {
    return { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' }
  }
  return { icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/10' }
}

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} giờ trước`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} ngày trước`
  return d.toLocaleDateString('vi-VN')
}

export default function Sidebar({ history, selectedId, onSelect, onDelete, onClear, collapsed, onToggle }) {
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-72'} shrink-0 border-r border-slate-800 bg-[#0d1220]/60 transition-all duration-200 flex flex-col sticky top-[73px] h-[calc(100vh-73px)]`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2 text-slate-300">
            <History className="w-4 h-4" />
            <span className="text-sm font-semibold">Lịch sử</span>
            <span className="text-xs text-slate-500">({history.length})</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {collapsed ? (
        <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-1">
          {history.slice(0, 20).map(item => {
            const { icon: Icon, color, bg } = decisionInfo(item.decision)
            const isSelected = item.id === selectedId
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition cursor-pointer ${
                  isSelected ? 'bg-blue-500/20 ring-1 ring-blue-400' : `${bg} hover:bg-slate-800`
                } ${color}`}
                title={`${item.ticker} — ${item.date}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {history.length === 0 ? (
              <div className="text-center text-xs text-slate-500 px-3 py-8">
                Chưa có phân tích nào.<br />Bắt đầu phân tích để xem lịch sử tại đây.
              </div>
            ) : (
              history.map(item => {
                const { icon: Icon, color } = decisionInfo(item.decision)
                const isSelected = item.id === selectedId
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={`group relative px-3 py-2.5 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-500/15 ring-1 ring-blue-400/50'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-100 truncate">{item.ticker}</span>
                          <span className="text-[11px] text-slate-500">{item.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{formatTime(item.timestamp)}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Xoá"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {history.length > 0 && (
            <div className="border-t border-slate-800 p-2">
              {confirmClear ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => { onClear(); setConfirmClear(false) }}
                    className="flex-1 text-xs py-1.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 cursor-pointer"
                  >
                    Xác nhận xoá
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 text-xs py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Huỷ
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full flex items-center justify-center gap-2 text-xs py-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xoá toàn bộ lịch sử
                </button>
              )}
            </div>
          )}
        </>
      )}
    </aside>
  )
}
