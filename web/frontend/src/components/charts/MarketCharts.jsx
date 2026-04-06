import {
  ResponsiveContainer, ComposedChart, LineChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'

const CHART_COLORS = {
  price: '#3b82f6',
  volume: '#64748b',
  rsi: '#f59e0b',
  macd: '#3b82f6',
  signal: '#ef4444',
  histogram: '#22c55e',
}

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
    <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

export default function MarketCharts({ chartData }) {
  if (!chartData) return null

  const { price, rsi, macd } = chartData

  return (
    <div className="space-y-4">
      {price && price.length > 0 && (
        <ChartWrapper title="Biểu đồ Giá & Khối lượng">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={price}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={11} />
              <YAxis yAxisId="price" orientation="left" stroke="#94a3b8" fontSize={11} tickFormatter={v => formatNumber(v)} />
              <YAxis yAxisId="vol" orientation="right" stroke="#94a3b8" fontSize={11} tickFormatter={v => formatNumber(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Bar yAxisId="vol" dataKey="volume" fill={CHART_COLORS.volume} opacity={0.3} name="Khối lượng" />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke={CHART_COLORS.price} dot={false} strokeWidth={2} name="Giá đóng cửa" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {rsi && rsi.length > 0 && (
        <ChartWrapper title="RSI (Relative Strength Index)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rsi}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Quá mua", fill: "#ef4444", fontSize: 10 }} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Quá bán", fill: "#22c55e", fontSize: 10 }} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS.rsi} dot={false} strokeWidth={2} name="RSI" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}

      {macd && macd.length > 0 && (
        <ChartWrapper title="MACD">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={macd}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="histogram" fill={CHART_COLORS.histogram} opacity={0.5} name="Histogram" />
              <Line type="monotone" dataKey="macd" stroke={CHART_COLORS.macd} dot={false} strokeWidth={2} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke={CHART_COLORS.signal} dot={false} strokeWidth={2} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      )}
    </div>
  )
}
