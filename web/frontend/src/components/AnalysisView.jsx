import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const TEAMS = [
  {
    name: 'Đội Phân tích',
    agents: ['Market Analyst', 'Financial_reports Analyst', 'News Analyst', 'Fundamentals Analyst'],
  },
  {
    name: 'Đội Nghiên cứu',
    agents: ['Bull Researcher', 'Bear Researcher', 'Research Manager'],
  },
  {
    name: 'Đội Giao dịch',
    agents: ['Trader'],
  },
  {
    name: 'Quản lý Rủi ro',
    agents: ['Aggressive Analyst', 'Neutral Analyst', 'Conservative Analyst'],
  },
  {
    name: 'Quản lý Danh mục',
    agents: ['Portfolio Manager'],
  },
]

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-buy" strokeWidth={2} />
  if (status === 'in_progress') return <Loader2 className="w-3.5 h-3.5 text-info animate-spin" strokeWidth={2} />
  return <Clock className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
}

function StatusLabel({ status }) {
  if (status === 'completed') return <span className="text-[11px] text-buy">Hoàn thành</span>
  if (status === 'in_progress') return <span className="text-[11px] text-info">Đang xử lý</span>
  return <span className="text-[11px] text-text-tertiary">Chờ</span>
}

export default function AnalysisView({ data }) {
  const agents = data?.agents || {}
  const error = data?.error

  const allAgents = Object.values(agents)
  const completed = allAgents.filter(a => a.status === 'completed').length
  const total = allAgents.length || 12
  const percent = Math.round((completed / total) * 100)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 fade-up">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-1">
          <Loader2 className="w-4 h-4 text-info animate-spin" strokeWidth={2} />
          <h1 className="text-xl font-medium text-text-primary tracking-tight">Đang phân tích</h1>
        </div>
        <p className="text-[13px] text-text-secondary">
          {data?.message || 'Các tác tử AI đang phối hợp xử lý'}
        </p>

        <div className="mt-6 max-w-md">
          <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-1.5 tabular-nums">
            <span className="tracking-[0.08em] uppercase font-medium">Tiến độ</span>
            <span>{completed}/{total} tác tử · {percent}%</span>
          </div>
          <div className="h-1 bg-bg-tertiary rounded-sm overflow-hidden">
            <div
              className="h-full bg-info transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-sell-bg border border-sell rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-sell shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13px] text-sell">{error}</p>
        </div>
      )}

      {/* Teams grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              className={`bg-bg-primary border rounded-lg p-3.5 transition ${
                teamActive ? 'border-info' : 'border-border-subtle'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-text-primary">{team.name}</h3>
                <span className="text-[11px] text-text-tertiary tabular-nums">
                  {teamCompleted}/{teamAgents.length}
                </span>
              </div>

              <div className="space-y-2">
                {teamAgents.map(agent => (
                  <div key={agent.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusIcon status={agent.status} />
                      <span className={`text-[13px] truncate ${
                        agent.status === 'completed' ? 'text-text-primary' :
                        agent.status === 'in_progress' ? 'text-text-primary font-medium' :
                        'text-text-tertiary'
                      }`}>
                        {agent.name}
                      </span>
                    </div>
                    <StatusLabel status={agent.status} />
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
