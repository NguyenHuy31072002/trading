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
