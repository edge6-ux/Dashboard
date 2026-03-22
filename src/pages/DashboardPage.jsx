import { useState, useEffect, useRef } from 'react'
import { SvgIcon } from '../components/IconSprite'
import { cronToHuman, getTimeAgo, escapeHtml, animateCounter } from '../lib/utils'
import { loadTrackers, loadTrackerArticles } from '../lib/storage'

export default function DashboardPage({ ctx }) {
  const { agents, getAllJobs, dbTasks, showPage, setAddModalOpen, setDetailModalOpen, setDetailModalJob } = ctx
  const [dashTrackerId, setDashTrackerId] = useState(null)
  const statAgentRef = useRef(null)
  const statJobsRef = useRef(null)
  const statCompletedRef = useRef(null)
  const [nextRunMs, setNextRunMs] = useState(null)
  const [countdown, setCountdown] = useState('')

  const jobs = getAllJobs()
  const activeJobs = jobs.filter(j => j.enabled !== false)
  const completedCount = dbTasks.filter(t => t.status === 'completed').length
  const runningCount = dbTasks.filter(t => t.status === 'running').length
  const onlineCount = Object.values(agents).filter(a => a.status === 'online').length
  const totalAgents = Object.keys(agents).length

  // Animated counters
  useEffect(() => {
    animateCounter(statAgentRef.current, onlineCount)
    animateCounter(statJobsRef.current, activeJobs.length)
    animateCounter(statCompletedRef.current, completedCount)
  }, [onlineCount, activeJobs.length, completedCount])

  // Next run calculation
  const now = Date.now()
  const nextRuns = jobs.filter(j => j.nextRun && j.nextRun > now).sort((a, b) => a.nextRun - b.nextRun)
  const nextJob = nextRuns.length > 0 ? nextRuns[0] : null

  useEffect(() => {
    if (!nextJob) { setNextRunMs(null); return }
    setNextRunMs(nextJob.nextRun)
  }, [nextJob])

  // Countdown timer
  useEffect(() => {
    if (!nextRunMs) { setCountdown(''); return }
    const tick = () => {
      const diff = nextRunMs - Date.now()
      if (diff <= 0) { setCountdown('Now'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [nextRunMs])

  // Agent ring
  const circumference = 113
  const pct = totalAgents > 0 ? onlineCount / totalAgents : 0
  const ringOffset = circumference - (circumference * pct)

  // Job sparkline
  const sparkTasks = dbTasks.slice(0, 7)
  const statuses = { completed: 'var(--ok)', running: 'var(--info)', queued: 'var(--warn)', error: 'var(--danger)' }

  // Agent badge
  const gatewayOnline = ctx.gatewayOnline
  let agentBadgeClass = 'stat-badge tag-yellow'
  let agentBadgeText = 'Agents Idle'
  if (gatewayOnline === false) { agentBadgeClass = 'stat-badge tag-red'; agentBadgeText = '● Gateway Offline' }
  else if (onlineCount === totalAgents && onlineCount > 0) { agentBadgeClass = 'stat-badge tag-green'; agentBadgeText = '● All Systems Go' }
  else if (onlineCount > 0) { agentBadgeClass = 'stat-badge tag-yellow'; agentBadgeText = `● ${onlineCount}/${totalAgents} Active` }

  // Tracker widget
  const trackers = loadTrackers()
  const allArticles = loadTrackerArticles()
  const trackerId = dashTrackerId || trackers[0]?.id
  const trackerArticles = trackerId ? (allArticles[trackerId] || []).slice(0, 6) : []

  const showJobDetail = (id) => {
    ctx.setDetailModalJob(id)
    ctx.setDetailModalOpen(true)
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats Row */}
      <div className="stats-row anim anim-1">
        {/* Active Agents */}
        <div className="stat-card" style={{ '--stat-color': 'var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="stat-icon"><SvgIcon id="ico-cpu" size={24} /></div>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="3"/>
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="113" strokeDashoffset={ringOffset} transform="rotate(-90 22 22)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg>
          </div>
          <div className="stat-value" ref={statAgentRef}>–</div>
          <div className="stat-label">Active Agents</div>
          <div className={agentBadgeClass}>{agentBadgeText}</div>
        </div>

        {/* Scheduled Jobs */}
        <div className="stat-card" style={{ '--stat-color': 'var(--cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="stat-icon"><SvgIcon id="ico-clipboard" size={24} /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
              {(sparkTasks.length === 0 ? Array(7).fill(null) : sparkTasks).map((t, i) => (
                <div key={i} style={{
                  width: 4,
                  height: t ? Math.max(4, (t.progress || 0) / 100 * 28) : 4 + Math.random() * 8,
                  background: t ? (statuses[t.status] || 'var(--border)') : 'var(--border)',
                  borderRadius: 2, transition: 'height 0.3s'
                }} />
              ))}
            </div>
          </div>
          <div className="stat-value" ref={statJobsRef}>0</div>
          <div className="stat-label">Scheduled Jobs</div>
          <div className="stat-badge tag-cyan"><SvgIcon id="ico-bolt" size={11} /> Automated</div>
        </div>

        {/* Completed */}
        <div className="stat-card" style={{ '--stat-color': 'var(--ok)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="stat-icon"><SvgIcon id="ico-check-circle" size={24} /></div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: runningCount > 0 ? 'var(--info)' : 'var(--ok)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {runningCount > 0 ? (
                <><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--info)', animation: 'pulse 1.5s ease-in-out infinite' }}/> {runningCount} running</>
              ) : completedCount > 0 ? `↑ ${completedCount}` : ''}
            </div>
          </div>
          <div className="stat-value" ref={statCompletedRef}>0</div>
          <div className="stat-label">Runs Completed</div>
          <div className="stat-badge tag-green">{completedCount > 0 ? `${completedCount} total` : 'No runs yet'}</div>
        </div>

        {/* Next Run */}
        <div className="stat-card" style={{ '--stat-color': 'var(--warn)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="stat-icon"><SvgIcon id="ico-clock" size={24} /></div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--warn)' }}>{countdown}</div>
          </div>
          <div className="stat-value">
            {nextJob ? new Date(nextJob.nextRun).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }) : '—'}
          </div>
          <div className="stat-label">Next Scheduled Run</div>
          <div className="stat-badge tag-yellow">{nextJob ? nextJob.name : 'No upcoming runs'}</div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dash-grid anim anim-2">
        {/* Tracker Widget */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="title-ico"><SvgIcon id="ico-rss" size={18} /></span>Tracker</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {trackers.length > 0 && (
                <select
                  className="form-select"
                  value={trackerId || ''}
                  onChange={e => setDashTrackerId(e.target.value)}
                  style={{ padding: '5px 28px 5px 10px', fontSize: 11, minWidth: 120, borderRadius: 'var(--radius-full)' }}
                >
                  {trackers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              <button className="btn btn-sm" onClick={() => showPage('tracker')}>View All</button>
            </div>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {trackerArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted-fg)', fontSize: 13 }}>
                No trackers yet — <a href="#" onClick={e => { e.preventDefault(); showPage('tracker') }} style={{ color: 'var(--accent)', textDecoration: 'none' }}>create one</a>
              </div>
            ) : (
              <div className="article-list">
                {trackerArticles.map(a => (
                  <a key={a.id} className="article-card" href={a.url} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 14px' }}>
                    {a.favicon && (
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                        <img src={a.favicon} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} onError={e => { e.target.style.display = 'none' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="article-source">{a.source || 'Web'}</div>
                      <div className="article-title" style={{ fontSize: 13, margin: '2px 0', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</div>
                      <div className="article-time">{a.publishedAt ? getTimeAgo(a.publishedAt) : ''}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <button className="add-task-btn" onClick={() => ctx.setAddModalOpen(true)}>
            <SvgIcon id="ico-plus-circle" size={18} />
            New Task / Job
          </button>

          {/* Agents */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="title-ico"><SvgIcon id="ico-cpu" size={18} /></span>Agents</div>
            </div>
            <div className="agent-minis">
              {Object.entries(agents).map(([id, a]) => (
                <div key={id} className="agent-mini" style={{ '--agent-color': a.color }} onClick={() => showPage('agents')}>
                  <div className="agent-mini-avatar"><span className="agent-emblem">{a.initial}</span></div>
                  <div className="agent-mini-info">
                    <div className="agent-mini-name">{a.name}</div>
                    <div className="agent-mini-model">{a.model}</div>
                  </div>
                  <div className={`agent-mini-status ${a.status || 'idle'}`}>
                    <div className="agent-mini-status-dot" style={a.status === 'online' ? { animation: 'pulse 2s ease-in-out infinite' } : {}} />
                    {(a.status || 'idle').charAt(0).toUpperCase() + (a.status || 'idle').slice(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Jobs */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-title"><span className="title-ico"><SvgIcon id="ico-clipboard" size={18} /></span>Active Jobs</div>
              <button className="btn btn-sm" onClick={() => showPage('jobs')}>View All</button>
            </div>
            <div className="job-list">
              {jobs.slice(0, 5).map(j => {
                const agent = agents[j.agent] || { name: 'Unknown', initial: '?', color: '#666' }
                const statusClass = j.status === 'error' ? 'error' : j.status === 'completed' || j.status === 'running' ? 'completed' : j.status === 'draft' ? 'draft' : (j.enabled === false ? 'disabled' : 'active')
                const statusLabel = statusClass === 'error' ? 'Error' : statusClass === 'completed' ? 'Complete' : statusClass === 'draft' ? 'Draft' : statusClass === 'disabled' ? 'Disabled' : 'Active'
                return (
                  <div key={j.id} className="job-item" onClick={() => showJobDetail(j.id)}>
                    <div className="job-icon" style={{ background: `${j.color || agent.color}20`, color: j.color || agent.color }}>
                      <span className="agent-emblem">{agent.initial}</span>
                    </div>
                    <div className="job-info">
                      <div className="job-name">{j.name}</div>
                      <div className="job-schedule">{j.isOneTime ? 'Draft — run manually' : cronToHuman(j.cron)}</div>
                    </div>
                    <div className={`job-status ${statusClass}`}>
                      <div className="job-status-dot" />
                      {statusLabel}
                    </div>
                  </div>
                )
              })}
              {jobs.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon"><SvgIcon id="ico-clipboard" size={32} /></div>
                  <div className="empty-text">No jobs yet — create one!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
