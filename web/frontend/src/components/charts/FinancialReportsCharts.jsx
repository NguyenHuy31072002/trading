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

function ChartWrapper({ title, children }) {
  return (
    <div className="mt-3 p-3 bg-bg-secondary rounded-md border border-border-subtle">
      <h4 className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-tertiary mb-2">{title}</h4>
      {children}
    </div>
  )
}

export default function FinancialReportsCharts({ chartData }) {
  const t = useChartTheme()
  if (!chartData) return null

  const { income, cashflow } = chartData
  const tooltipStyle = { backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '6px', fontSize: '12px', color: t.tooltipText }
  const labelStyle = { color: t.text }

  return (
    <div className="space-y-3">
      {income && income.length > 0 && (
        <ChartWrapper title="Doanh thu & Lợi nhuận (4 năm)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={income}>
              <CartesianGrid strokeDasharray="2 4" stroke={t.grid} />
              <XAxis dataKey="year" stroke={t.axis} fontSize={12} />
              <YAxis stroke={t.axis} fontSize={11} tickFormatter={formatBillion} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(val) => formatBillion(val)} />
              <Legend wrapperStyle={{ fontSize: '12px', color: t.text }} />
              <Bar dataKey="revenue" fill={t.info} name="Doanh thu" radius={[2, 2, 0, 0]} />
              <Bar dataKey="gross_profit" fill={t.buy} name="Lợi nhuận gộp" radius={[2, 2, 0, 0]} />
              <Bar dataKey="net_income" fill={t.hold} name="Lợi nhuận ròng" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {cashflow && cashflow.length > 0 && (
        <ChartWrapper title="Dòng tiền (4 năm)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="2 4" stroke={t.grid} />
              <XAxis dataKey="year" stroke={t.axis} fontSize={12} />
              <YAxis stroke={t.axis} fontSize={11} tickFormatter={formatBillion} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} formatter={(val) => formatBillion(val)} />
              <Legend wrapperStyle={{ fontSize: '12px', color: t.text }} />
              <Bar dataKey="operating" fill={t.info} name="Hoạt động KD" radius={[2, 2, 0, 0]} />
              <Bar dataKey="investing" fill={t.sell} name="Đầu tư" radius={[2, 2, 0, 0]} />
              <Bar dataKey="financing" fill={t.financial} name="Tài chính" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </div>
  )
}
