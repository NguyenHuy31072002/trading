import { useState } from 'react'
import Header from './components/Header'
import ConfigPanel from './components/ConfigPanel'
import AnalysisView from './components/AnalysisView'
import ResultsView from './components/ResultsView'

const PAGES = { CONFIG: 'config', ANALYSIS: 'analysis', RESULTS: 'results' }

export default function App() {
  const [page, setPage] = useState(PAGES.CONFIG)
  const [wsData, setWsData] = useState(null)
  const [results, setResults] = useState(null)

  const startAnalysis = (config) => {
    setPage(PAGES.ANALYSIS)
    setWsData(null)
    setResults(null)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/analyze`)

    ws.onopen = () => {
      ws.send(JSON.stringify(config))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.event === 'complete') {
        setResults(data)
        setPage(PAGES.RESULTS)
      } else if (data.event === 'error') {
        setWsData(prev => ({ ...prev, error: data.message }))
      } else {
        setWsData(data)
      }
    }

    ws.onerror = () => {
      setWsData(prev => ({ ...prev, error: 'Mất kết nối WebSocket' }))
    }

    ws.onclose = () => {
      if (page === PAGES.ANALYSIS && !results) {
        // Connection closed unexpectedly during analysis
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onHome={() => { setPage(PAGES.CONFIG); setResults(null) }} />
      <main className="flex-1">
        {page === PAGES.CONFIG && <ConfigPanel onStart={startAnalysis} />}
        {page === PAGES.ANALYSIS && <AnalysisView data={wsData} />}
        {page === PAGES.RESULTS && <ResultsView data={results} onNewAnalysis={() => setPage(PAGES.CONFIG)} />}
      </main>
      <footer className="text-center py-4 text-sm text-slate-500 border-t border-slate-800">
        TradingAgents &copy; 2026 &mdash; Khung phân tích giao dịch tài chính đa tác tử AI
      </footer>
    </div>
  )
}
