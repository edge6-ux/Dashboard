import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo } from '../lib/utils'

export default function AgentsPage({ ctx }) {
  const { agents } = ctx

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-cpu" size={22} /></span>Agents</div>
          <div className="section-sub">Your AI crew — status, models, and roles</div>
        </div>
      </div>
      <div className="anim anim-2" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))' }}>
        {Object.entries(agents).map(([id, a]) => {
          const lastActiveStr = a.lastActive ? getTimeAgo(a.lastActive) + ' ago' : 'No recent activity'
          const status = a.status || 'idle'
          return (
            <div key={id} className="card agent-card" style={{ '--agent-color': a.color }}>
              <div className="agent-card-row">
                <div className="agent-avatar-lg" style={{ background: `${a.color}20`, color: a.color }}>
                  {a.initial}
                </div>
                <div className="agent-mini-info">
                  <div className="agent-mini-name">{a.name}</div>
                  <div className="agent-mini-model">{a.role}</div>
                </div>
                <div className={`agent-mini-status ${status}`}>
                  <div className="agent-mini-status-dot" style={status === 'online' ? { animation: 'pulse 2s ease-in-out infinite' } : {}} />
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
              </div>
              <div className="agent-card-footer">
                <span className="agent-model-tag">{a.model}</span>
                <span className="agent-last-active">Last active: {lastActiveStr}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
