const STORAGE_KEY = 'tradingagents:history'
const MAX_ENTRIES = 30

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    if (e && e.name === 'QuotaExceededError' && list.length > 1) {
      write(list.slice(0, Math.floor(list.length / 2)))
    }
  }
}

export function getHistory() {
  return read()
}

export function addHistory(result) {
  if (!result || !result.ticker) return null
  const entry = {
    id: `${result.ticker}-${result.date}-${Date.now()}`,
    ticker: result.ticker,
    date: result.date,
    decision: result.decision || '',
    timestamp: Date.now(),
    data: result,
  }
  const list = read()
  list.unshift(entry)
  write(list.slice(0, MAX_ENTRIES))
  return entry
}

export function removeHistory(id) {
  write(read().filter(e => e.id !== id))
}

export function clearHistory() {
  write([])
}
