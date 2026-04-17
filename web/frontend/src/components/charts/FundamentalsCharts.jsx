import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useChartTheme } from '../../utils/theme'

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
    <div className="mt-3 p-3 bg-bg-secondary rounded-md border border-border-subtle">
      <h4 className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-tertiary mb-2">{title}</h4>
      {children}
    </div>
  )
}

export default function FundamentalsCharts({ chartData }) {
  const t = useChartTheme()
  if (!chartData) return null

  const { balance_sheet, ratios } = chartData
  const tooltipStyle = { backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '6px', fontSize: '12px', color: t.tooltipText }
  const labelStyle = { color: t.text }

  return (
    <div className="space-y-3">
      {balance_sheet && balance_sheet.length > 0 && (
        <ChartWrapper title="Tài sản & Nợ phải trả (4 năm)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={balance_sheet}>
              <CartesianGrid strokeDasharray="2 4" stroke={t.grid} />
              <XAxis dataKey="year" stroke={t.axis} fontSize={12} />
              <YAxis stroke={t.axis} fontSize={11} tickFormatter={formatBillion} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(val) => formatBillion(val)} />
              <Legend wrapperStyle={{ fontSize: '12px', color: t.text }} />
              <Bar dataKey="total_assets" fill={t.info} name="Tổng tài sản" radius={[2, 2, 0, 0]} />
              <Bar dataKey="total_liabilities" fill={t.sell} name="Tổng nợ" radius={[2, 2, 0, 0]} />
              <Bar dataKey="equity" fill={t.buy} name="Vốn chủ sở hữu" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {ratios && (
        <ChartWrapper title="Chỉ số tài chính">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { key: 'roe', label: 'ROE', format: formatPercent },
              { key: 'roa', label: 'ROA', format: formatPercent },
              { key: 'profit_margin', label: 'Biên LN ròng', format: formatPercent },
              { key: 'current_ratio', label: 'Thanh toán', format: v => v != null ? v.toFixed(2) : 'N/A' },
              { key: 'debt_to_equity', label: 'Nợ/Vốn CSH', format: v => v != null ? v.toFixed(2) : 'N/A' },
              { key: 'pe_ratio', label: 'P/E', format: v => v != null ? v.toFixed(2) : 'N/A' },
            ].map(({ key, label, format }) => (
              <div key={key} className="bg-bg-primary rounded-md border border-border-subtle p-2.5">
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-tertiary mb-0.5">{label}</div>
                <div className="text-base font-medium text-text-primary tabular-nums">{format(ratios[key])}</div>
              </div>
            ))}
          </div>
        </ChartWrapper>
      )}
    </div>
  )
}
