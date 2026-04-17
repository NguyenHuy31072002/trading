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
