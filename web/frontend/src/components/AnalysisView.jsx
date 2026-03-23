import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const TEAMS = [
  {
    name: 'Đội Phân tích',
    color: 'blue',
    agents: ['Market Analyst', 'Social Analyst', 'News Analyst', 'Fundamentals Analyst'],
  },
  {
    name: 'Đội Nghiên cứu',
    color: 'purple',
    agents: ['Bull Researcher', 'Bear Researcher', 'Research Manager'],
  },
  {
    name: 'Đội Giao dịch',
    color: 'amber',
    agents: ['Trader'],
  },
  {
    name: 'Quản lý Rủi ro',
    color: 'red',
    agents: ['Aggressive Analyst', 'Neutral Analyst', 'Conservative Analyst'],
  },
  {
    name: 'Quản lý Danh mục',
    color: 'emerald',
    agents: ['Portfolio Manager'],
  },
]

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (status === 'in_progress') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
  return <Clock className="w-4 h-4 text-slate-600" />
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    pending: 'bg-slate-700/30 text-slate-500 border-slate-700',
  }
  const labels = {
    completed: 'Hoàn thành',
    in_progress: 'Đang xử lý',
    pending: 'Chờ',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  )
}

export default function AnalysisView({ data }) {
  const agents = data?.agents || {}
  const error = data?.error

  // Calculate progress
  const allAgents = Object.values(agents)
  const completed = allAgents.filter(a => a.status === 'completed').length
  const total = allAgents.length || 12
  const percent = Math.round((completed / total) * 100)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 fade-up">
      {/* Progress header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <h2 className="text-2xl font-bold text-white">Đang phân tích...</h2>
        </div>
        <p className="text-slate-400">{data?.message || 'Các tác tử AI đang làm việc'}</p>

        {/* Progress bar */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Tiến độ</span>
            <span>{completed}/{total} tác tử ({percent}%)</span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Teams grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEAMS.map(team => {
          const teamAgents = team.agents
            .filter(name => agents[name])
            .map(name => ({ key: name, ...agents[name] }))

          if (teamAgents.length === 0) return null

          const teamCompleted = teamAgents.filter(a => a.status === 'completed').length
          const teamActive = teamAgents.some(a => a.status === 'in_progress')

          return (
            <div
              key={team.name}
              className={`bg-slate-900/60 border rounded-2xl p-5 transition-all ${
                teamActive
                  ? 'border-blue-500/40 shadow-lg shadow-blue-500/5'
                  : teamCompleted === teamAgents.length
                    ? 'border-emerald-500/30'
                    : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-slate-200">{team.name}</h3>
                <span className="text-xs text-slate-500">
                  {teamCompleted}/{teamAgents.length}
                </span>
              </div>

              <div className="space-y-3">
                {teamAgents.map(agent => (
                  <div key={agent.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={agent.status} />
                      <span className={`text-sm ${
                        agent.status === 'in_progress' ? 'text-blue-300' :
                        agent.status === 'completed' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {agent.name}
                      </span>
                    </div>
                    <StatusBadge status={agent.status} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
