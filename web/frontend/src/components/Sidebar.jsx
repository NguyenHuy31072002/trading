import { useState } from 'react'
import { History, Trash2, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function decisionInfo(decision) {
  const d = (decision || '').toUpperCase()
  if (d.includes('BUY') || d.includes('OVERWEIGHT')) {
    return { icon: TrendingUp, color: 'text-buy', bg: 'bg-buy-bg' }
  }
  if (d.includes('SELL') || d.includes('UNDERWEIGHT')) {
    return { icon: TrendingDown, color: 'text-sell', bg: 'bg-sell-bg' }
  }
  return { icon: Minus, color: 'text-hold', bg: 'bg-hold-bg' }
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
      className={`${collapsed ? 'w-12' : 'w-64'} shrink-0 border-r border-border-subtle bg-bg-secondary transition-[width] duration-200 flex flex-col sticky top-14 h-[calc(100vh-3.5rem)]`}
    >
      <div className="flex items-center justify-between h-11 px-3 border-b border-border-subtle">
        {!collapsed && (
          <div className="flex items-center gap-1.5 text-text-primary">
            <History className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
            <span className="text-[13px] font-medium">Lịch sử</span>
            <span className="text-[11px] text-text-tertiary tabular-nums">({history.length})</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-6 h-6 rounded-sm flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition cursor-pointer"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {collapsed ? (
        <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-1">
          {history.slice(0, 20).map(item => {
            const { icon: Icon, color } = decisionInfo(item.decision)
            const isSelected = item.id === selectedId
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-8 h-8 rounded-sm flex items-center justify-center transition cursor-pointer ${
                  isSelected ? 'bg-bg-tertiary' : 'hover:bg-bg-tertiary'
                } ${color}`}
                title={`${item.ticker} — ${item.date}`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )
          })}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
            {history.length === 0 ? (
              <div className="text-center text-[12px] text-text-tertiary px-3 py-6 leading-relaxed">
                Chưa có phân tích nào.<br />
                Chạy phân tích đầu tiên để thấy ở đây.
              </div>
            ) : (
              history.map(item => {
                const { icon: Icon, color } = decisionInfo(item.decision)
                const isSelected = item.id === selectedId
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={`group relative flex items-start gap-2 px-2.5 py-2 rounded-sm cursor-pointer transition ${
                      isSelected
                        ? 'bg-bg-tertiary'
                        : 'hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 mt-[3px] shrink-0 ${color}`} strokeWidth={2} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-text-primary truncate tracking-tight">{item.ticker}</span>
                        <span className="text-[11px] text-text-tertiary tabular-nums">{item.date}</span>
                      </div>
                      <div className="text-[11px] text-text-tertiary mt-0.5">{formatTime(item.timestamp)}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-sm flex items-center justify-center text-text-tertiary hover:text-sell hover:bg-sell-bg transition cursor-pointer"
                      title="Xoá"
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {history.length > 0 && (
            <div className="border-t border-border-subtle p-1.5">
              {confirmClear ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => { onClear(); setConfirmClear(false) }}
                    className="flex-1 h-7 text-[11px] rounded-sm bg-sell-bg text-sell hover:opacity-80 transition cursor-pointer"
                  >
                    Xác nhận xoá
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 h-7 text-[11px] rounded-sm bg-bg-tertiary text-text-secondary hover:text-text-primary transition cursor-pointer"
                  >
                    Huỷ
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full flex items-center justify-center gap-1.5 h-7 text-[11px] rounded-sm text-text-tertiary hover:bg-bg-tertiary hover:text-sell transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                  Xoá toàn bộ
                </button>
              )}
            </div>
          )}
        </>
      )}
    </aside>
  )
}
