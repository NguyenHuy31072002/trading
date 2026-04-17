# Server-Side History Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage-based history with server-side JSON file storage so analysis history survives page reloads and browser cache clears.

**Architecture:** Backend stores each analysis result as a JSON file in `web/backend/history/`. Three new REST endpoints (list, get-one, delete, clear) serve the data. Frontend `history.js` is rewritten to call these endpoints instead of localStorage. Sidebar and App.jsx remain structurally unchanged — only the data source changes.

**Tech Stack:** FastAPI (existing), JSON files on disk, fetch API (frontend)

---

### Task 1: Backend — History REST API endpoints

**Files:**
- Create: `web/backend/history.py`
- Modify: `web/backend/main.py:167-180` (register router)

- [ ] **Step 1: Create `web/backend/history.py` with all endpoints**

```python
"""History persistence — one JSON file per analysis result."""

import json
import os
import time
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/history", tags=["history"])

HISTORY_DIR = Path(__file__).parent / "history"
HISTORY_DIR.mkdir(exist_ok=True)


def _index_path() -> Path:
    return HISTORY_DIR / "_index.json"


def _read_index() -> list[dict]:
    p = _index_path()
    if not p.exists():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _write_index(entries: list[dict]):
    _index_path().write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _entry_path(entry_id: str) -> Path:
    safe = entry_id.replace("/", "_").replace("..", "_")
    return HISTORY_DIR / f"{safe}.json"


def save_result(result: dict) -> dict:
    """Save an analysis result and return the index entry."""
    ticker = result.get("ticker", "UNKNOWN")
    date = result.get("date", "")
    entry_id = f"{ticker}-{date}-{int(time.time() * 1000)}"

    entry = {
        "id": entry_id,
        "ticker": ticker,
        "date": date,
        "decision": result.get("decision", ""),
        "timestamp": int(time.time() * 1000),
    }

    # Write full data
    _entry_path(entry_id).write_text(
        json.dumps(result, ensure_ascii=False, default=str),
        encoding="utf-8",
    )

    # Update index
    index = _read_index()
    index.insert(0, entry)
    _write_index(index)

    return entry


@router.get("")
async def list_history():
    """Return index (id, ticker, date, decision, timestamp) — no heavy data."""
    return _read_index()


@router.get("/{entry_id}")
async def get_history_entry(entry_id: str):
    """Return full analysis data for one entry."""
    p = _entry_path(entry_id)
    if not p.exists():
        raise HTTPException(404, "Entry not found")
    return JSONResponse(
        content=json.loads(p.read_text(encoding="utf-8")),
        media_type="application/json",
    )


@router.delete("/{entry_id}")
async def delete_history_entry(entry_id: str):
    """Delete one entry."""
    p = _entry_path(entry_id)
    if p.exists():
        p.unlink()
    index = _read_index()
    _write_index([e for e in index if e["id"] != entry_id])
    return {"ok": True}


@router.delete("")
async def clear_history():
    """Delete all entries."""
    for f in HISTORY_DIR.glob("*.json"):
        f.unlink()
    _write_index([])
    return {"ok": True}
```

- [ ] **Step 2: Register router in `web/backend/main.py`**

In `web/backend/main.py`, add the import after the existing imports (around line 23) and register the router before the static mount:

After `from tradingagents.default_config import DEFAULT_CONFIG` add:
```python
from history import router as history_router
```

After the `app.add_middleware(...)` block (around line 179), add:
```python
app.include_router(history_router)
```

- [ ] **Step 3: Save result automatically when WebSocket analysis completes**

In `web/backend/main.py`, inside `websocket_analyze()`, after the line `decision = graph.process_signal(...)` (around line 536) and before `await _send(ws, "complete", ...)`, add:

```python
        # Persist to server-side history
        from history import save_result
        complete_data = {
            "decision": decision,
            "agents": {k: {"status": v, "name": AGENT_DISPLAY_NAMES.get(k, k)} for k, v in agent_status.items()},
            "reports": report_sections,
            "complete_report": complete_report,
            "ticker": ticker,
            "date": analysis_date,
            "chart_data": chart_data,
        }
        saved_entry = save_result(complete_data)
```

Then update the `_send(ws, "complete", ...)` call to include `saved_entry`:

```python
        await _send(ws, "complete", {
            **complete_data,
            "history_entry": saved_entry,
        })
```

- [ ] **Step 4: Test backend manually**

Run:
```bash
cd web/backend && python -c "
from history import save_result, _read_index, _entry_path
import json

# Save a mock result
entry = save_result({'ticker': 'TEST', 'date': '2026-01-01', 'decision': 'BUY', 'complete_report': {'test': True}})
print('Saved:', entry)

# Read index
index = _read_index()
print('Index length:', len(index))
print('Index[0]:', index[0])

# Read full data
import json
data = json.loads(_entry_path(entry['id']).read_text())
print('Full data ticker:', data['ticker'])

# Cleanup
from history import _entry_path, _write_index
_entry_path(entry['id']).unlink()
_write_index([])
print('Cleanup done')
"
```

Expected: Saved entry printed, index has 1 item, full data has ticker TEST.

- [ ] **Step 5: Commit**

```bash
git add web/backend/history.py web/backend/main.py
git commit -m "feat: add server-side history storage API"
```

---

### Task 2: Frontend — Rewrite `history.js` to use server API

**Files:**
- Modify: `web/frontend/src/utils/history.js` (complete rewrite)

- [ ] **Step 1: Rewrite `history.js` to call backend API**

Replace entire file content:

```javascript
const BASE = import.meta.env.BASE_URL

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}api/history${path}`, opts)
  if (!res.ok) throw new Error(`History API ${res.status}`)
  return res.json()
}

export async function getHistory() {
  try {
    return await api('')
  } catch {
    return []
  }
}

export async function getHistoryEntry(id) {
  try {
    return await api(`/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

export async function removeHistory(id) {
  try {
    await api(`/${encodeURIComponent(id)}`, { method: 'DELETE' })
  } catch {
    // silent
  }
}

export async function clearHistory() {
  try {
    await api('', { method: 'DELETE' })
  } catch {
    // silent
  }
}
```

Note: `addHistory` is removed — the backend saves automatically when analysis completes. The WebSocket response includes `history_entry` with the saved metadata.

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/utils/history.js
git commit -m "feat: rewrite history.js to use server API"
```

---

### Task 3: Frontend — Update `App.jsx` to use async history API

**Files:**
- Modify: `web/frontend/src/App.jsx`

- [ ] **Step 1: Rewrite App.jsx to use async history functions**

Key changes:
- `getHistory()` is now async — load in `useEffect` instead of `useState` initializer
- `addHistory()` removed — use `history_entry` from WebSocket complete event
- `handleSelectHistory` calls `getHistoryEntry(id)` to fetch full data lazily
- `removeHistory` and `clearHistory` are now async

```jsx
import { useState, useEffect, useCallback } from 'react'
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
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1')

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
        // History was saved server-side; refresh sidebar list
        if (data.history_entry) {
          setSelectedId(data.history_entry.id)
        }
        refreshHistory()
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
```

- [ ] **Step 2: Commit**

```bash
git add web/frontend/src/App.jsx
git commit -m "feat: App.jsx uses server-side history API"
```

---

### Task 4: Build and verify

- [ ] **Step 1: Build frontend**

```bash
cd /home/ubuntu/huynk/trading/web/frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Start backend and verify API**

```bash
cd /home/ubuntu/huynk/trading/web/backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
sleep 2
# Test list (empty)
curl -s http://localhost:8000/api/history | head
# Kill server
kill %1
```

Expected: Returns `[]`.

- [ ] **Step 3: Commit build output**

```bash
git add web/frontend/dist/
git commit -m "build: rebuild frontend with server-side history"
```
