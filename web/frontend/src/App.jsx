import { useState, useEffect, useRef, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ConfigPanel from './components/ConfigPanel'
import AnalysisView from './components/AnalysisView'
import ResultsView from './components/ResultsView'
import { getHistory, getHistoryEntry, removeHistory, clearHistory } from './utils/history'

const PAGES = { CONFIG: 'config', ANALYSIS: 'analysis', RESULTS: 'results' }
const SIDEBAR_KEY = 'tradingagents:sidebar-collapsed'

export default function App() {
  const [page, setPage] = useState(PAGES.CONFIG)
  const [wsData, setWsData] = useState(null)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')

  const wsRef = useRef(null)
  const pageRef = useRef(page)
  useEffect(() => { pageRef.current = page }, [page])

  // Load history from server on mount
  useEffect(() => {
    getHistory().then(setHistory)
  }, [])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const refreshHistory = useCallback(() => {
    getHistory().then(setHistory)
  }, [])

  const startAnalysis = (config) => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      try { wsRef.current.close() } catch { /* ignore */ }
    }

    setPage(PAGES.ANALYSIS)
    setWsData(null)
    setResults(null)
    setSelectedId(null)
    setAnalysisRunning(true)

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}${import.meta.env.BASE_URL}ws/analyze`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify(config))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.event === 'complete') {
        setResults(data)
        setAnalysisRunning(false)
        if (data.history_entry) {
          setSelectedId(data.history_entry.id)
        }
        refreshHistory()
        // Only auto-navigate if user is still watching this analysis
        if (pageRef.current === PAGES.ANALYSIS) {
          setPage(PAGES.RESULTS)
        }
      } else if (data.event === 'error') {
        setWsData(prev => ({ ...prev, error: data.message }))
        setAnalysisRunning(false)
      } else {
        setWsData(data)
      }
    }

    ws.onerror = () => {
      setWsData(prev => ({ ...prev, error: 'Mất kết nối WebSocket' }))
      setAnalysisRunning(false)
    }

    ws.onclose = () => {
      setAnalysisRunning(false)
    }
  }

  const handleSelectHistory = async (item) => {
    setSelectedId(item.id)
    setPage(PAGES.RESULTS)
    // Fetch full data from server
    const data = await getHistoryEntry(item.id)
    if (data) {
      setResults(data)
    }
  }

  const handleDeleteHistory = async (id) => {
    await removeHistory(id)
    refreshHistory()
    if (selectedId === id) {
      setSelectedId(null)
      if (page === PAGES.RESULTS) {
        setPage(PAGES.CONFIG)
        setResults(null)
      }
    }
  }

  const handleClearHistory = async () => {
    await clearHistory()
    setHistory([])
    setSelectedId(null)
    if (page === PAGES.RESULTS) {
      setPage(PAGES.CONFIG)
      setResults(null)
    }
  }

  const handleHome = () => {
    if (analysisRunning) {
      setPage(PAGES.ANALYSIS)
      setSelectedId(null)
      return
    }
    setPage(PAGES.CONFIG)
    setResults(null)
    setSelectedId(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <Header onHome={handleHome} analysisRunning={analysisRunning} />
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
      <footer className="text-center py-3 text-[11px] text-text-tertiary border-t border-border-subtle">
        TradingAgents · Khung phân tích giao dịch tài chính đa tác tử AI
      </footer>
    </div>
  )
}
