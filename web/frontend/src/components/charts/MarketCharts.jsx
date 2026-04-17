import {
  ResponsiveContainer, ComposedChart, LineChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { useChartTheme } from '../../utils/theme'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatNumber(val) {
  if (Math.abs(val) >= 1e9) return (val / 1e9).toFixed(1) + 'B'
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M'
  if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(1) + 'K'
  return val.toFixed(2)
}

function ChartWrapper({ title, children }) {
  return (
    <div className="mt-3 p-3 bg-bg-secondary rounded-md border border-border-subtle">
      <h4 className="text-[10px] font-medium tracking-[0.08em] uppercase text-text-tertiary mb-2">{title}</h4>
      {children}
    </div>
  )
}

export default function MarketCharts({ chartData }) {
  const t = useChartTheme()
  if (!chartData) return null

  const { price, rsi, macd } = chartData
  const tooltipStyle = { backgroundColor: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: '6px', fontSize: '12px', color: t.tooltipText }
  const labelStyle = { color: t.text }

  return (
    <div className="space-y-3">
      {price && price.length > 0 && (
        <ChartWrapper title="Giá & Khối lượng">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={price}>
              <CartesianGrid strokeDasharray="2 4" stroke={t.grid} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke={t.axis} fontSize={11} />
              <YAxis yAxisId="price" orientation="left" stroke={t.axis} fontSize={11} tickFormatter={v => formatNumber(v)} />
              <YAxis yAxisId="vol" orientation="right" stroke={t.axis} fontSize={11} tickFormatter={v => formatNumber(v)} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: t.text }} />
              <Bar yAxisId="vol" dataKey="volume" fill={t.axis} opacity={0.25} name="Khối lượng" />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke={t.info} dot={false} strokeWidth={1.5} name="Giá đóng cửa" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {rsi && rsi.length > 0 && (
        <ChartWrapper title="RSI (Relative Strength Index)">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={rsi}>
              <CartesianGrid strokeDasharray="2 4" stroke={t.grid} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke={t.axis} fontSize={11} />
              <YAxis domain={[0, 100]} stroke={t.axis} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <ReferenceLine y={70} stroke={t.sell} strokeDasharray="3 3" label={{ value: 'Quá mua', fill: t.sell, fontSize: 10 }} />
              <ReferenceLine y={30} stroke={t.buy} strokeDasharray="3 3" label={{ value: 'Quá bán', fill: t.buy, fontSize: 10 }} />
              <Line type="monotone" dataKey="value" stroke={t.hold} dot={false} strokeWidth={1.5} name="RSI" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {macd && macd.length > 0 && (
        <ChartWrapper title="MACD">
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={macd}>
              <CartesianGrid strokeDasharray="2 4" stroke={t.grid} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke={t.axis} fontSize={11} />
              <YAxis stroke={t.axis} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: t.text }} />
              <Bar dataKey="histogram" fill={t.buy} opacity={0.5} name="Histogram" />
              <Line type="monotone" dataKey="macd" stroke={t.info} dot={false} strokeWidth={1.5} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke={t.sell} dot={false} strokeWidth={1.5} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </div>
  )
}
