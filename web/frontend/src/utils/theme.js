import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'tradingagents:theme'

function resolveInitial() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
}

let current = typeof window === 'undefined' ? 'light' : resolveInitial()
const listeners = new Set()

function setThemeGlobal(next) {
  if (next === current) return
  current = next
  applyTheme(next)
  try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  listeners.forEach(fn => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getSnapshot() { return current }
function getServerSnapshot() { return 'light' }

export function initThemeBeforeRender() {
  current = resolveInitial()
  applyTheme(current)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const handler = (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) setThemeGlobal(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const toggle = useCallback(() => {
    setThemeGlobal(current === 'dark' ? 'light' : 'dark')
  }, [])

  return { theme, toggle }
}

function cssVar(name) {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function readTokens() {
  return {
    grid: cssVar('--border-subtle'),
    axis: cssVar('--text-tertiary'),
    text: cssVar('--text-secondary'),
    tooltipBg: cssVar('--bg-primary'),
    tooltipBorder: cssVar('--border-default'),
    tooltipText: cssVar('--text-primary'),
    info: cssVar('--info'),
    buy: cssVar('--buy'),
    sell: cssVar('--sell'),
    hold: cssVar('--hold'),
    market: cssVar('--agent-market'),
    financial: cssVar('--agent-financial'),
    news: cssVar('--agent-news'),
    fundamental: cssVar('--agent-fundamental'),
  }
}

export function useChartTheme() {
  const { theme } = useTheme()
  // theme is used as key to recompute tokens when it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readTokens(), [theme])
}
