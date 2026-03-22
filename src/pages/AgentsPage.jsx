import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo } from '../lib/utils'

export default function AgentsPage({ ctx }) {
  const { agents } = ctx
  const statusColors = { online: 'var(--ok)', idle: 'var(--warn)', offline: 'var(--danger)', checking: 'var(--muted)' }

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
          return (
            <div key={id} className="card" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${a.color}20`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>{a.initial}</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: '1.05rem' }}>{a.name}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{a.role}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[a.status] || 'var(--muted)', ...(a.status === 'online' ? { animation: 'pulse 2s ease-in-out infinite' } : {}) }} />
                  <span style={{ color: statusColors[a.status] || 'var(--muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                    {(a.status || 'idle').charAt(0).toUpperCase() + (a.status || 'idle').slice(1)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ background: 'var(--bg-hover)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--text)' }}>{a.model}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', fontFamily: 'var(--mono)' }}>Last active: {lastActiveStr}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
