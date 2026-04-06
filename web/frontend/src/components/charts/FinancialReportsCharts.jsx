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

function ChartWrapper({ title, children }) {
  return (
    <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

export default function FinancialReportsCharts({ chartData }) {
  if (!chartData) return null

  const { income, cashflow } = chartData

  return (
    <div className="space-y-4">
      {income && income.length > 0 && (
        <ChartWrapper title="Doanh thu & Lợi nhuận (4 năm)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={income}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatBillion} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(val) => formatBillion(val)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gross_profit" fill="#22c55e" name="Lợi nhuận gộp" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net_income" fill="#f59e0b" name="Lợi nhuận ròng" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {cashflow && cashflow.length > 0 && (
        <ChartWrapper title="Dòng tiền (4 năm)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatBillion} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(val) => formatBillion(val)}
              />
              <Legend />
              <Bar dataKey="operating" fill="#3b82f6" name="Hoạt động KD" radius={[4, 4, 0, 0]} />
              <Bar dataKey="investing" fill="#ef4444" name="Đầu tư" radius={[4, 4, 0, 0]} />
              <Bar dataKey="financing" fill="#8b5cf6" name="Tài chính" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </div>
  )
}
