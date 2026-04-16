import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ConfigPanel from './components/ConfigPanel'
import AnalysisView from './components/AnalysisView'
import ResultsView from './components/ResultsView'
import { getHistory, addHistory, removeHistory, clearHistory } from './utils/history'

const PAGES = { CONFIG: 'config', ANALYSIS: 'analysis', RESULTS: 'results' }
const SIDEBAR_KEY = 'tradingagents:sidebar-collapsed'

export default function App() {
  const [page, setPage] = useState(PAGES.CONFIG)
  const [wsData, setWsData] = useState(null)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState(() => getHistory())
  const [selectedId, setSelectedId] = useState(null)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const startAnalysis = (config) => {
    setPage(PAGES.ANALYSIS)
    setWsData(null)
    setResults(null)
    setSelectedId(null)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}${import.meta.env.BASE_URL}ws/analyze`)

    ws.onopen = () => {
      ws.send(JSON.stringify(config))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.event === 'complete') {
        setResults(data)
        setPage(PAGES.RESULTS)
        const entry = addHistory(data)
        if (entry) {
          setHistory(getHistory())
          setSelectedId(entry.id)
        }
      } else if (data.event === 'error') {
        setWsData(prev => ({ ...prev, error: data.message }))
      } else {
        setWsData(data)
      }
    }

    ws.onerror = () => {
      setWsData(prev => ({ ...prev, error: 'Mất kết nối WebSocket' }))
    }
  }

  const handleSelectHistory = (item) => {
    setResults(item.data)
    setSelectedId(item.id)
    setPage(PAGES.RESULTS)
  }

  const handleDeleteHistory = (id) => {
    removeHistory(id)
    setHistory(getHistory())
    if (selectedId === id) {
      setSelectedId(null)
      if (page === PAGES.RESULTS) {
        setPage(PAGES.CONFIG)
        setResults(null)
      }
    }
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
    setSelectedId(null)
    if (page === PAGES.RESULTS) {
      setPage(PAGES.CONFIG)
      setResults(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onHome={() => { setPage(PAGES.CONFIG); setResults(null); setSelectedId(null) }} />
      <div className="flex flex-1">
        <Sidebar
          history={history}
          selectedId={selectedId}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onClear={handleClearHistory}
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
        />
        <main className="flex-1 min-w-0">
          {page === PAGES.CONFIG && <ConfigPanel onStart={startAnalysis} />}
          {page === PAGES.ANALYSIS && <AnalysisView data={wsData} />}
          {page === PAGES.RESULTS && <ResultsView data={results} onNewAnalysis={() => { setPage(PAGES.CONFIG); setSelectedId(null) }} />}
        </main>
      </div>
      <footer className="text-center py-4 text-sm text-slate-500 border-t border-slate-800">
        TradingAgents &copy; 2026 &mdash; Khung phân tích giao dịch tài chính đa tác tử AI
      </footer>
    </div>
  )
}
