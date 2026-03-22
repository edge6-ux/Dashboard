import { SvgIcon } from '../components/IconSprite'
import { cronToHuman } from '../lib/utils'
import { loadLocalJobs, saveLocalJobs, getCancelledJobs, saveCancelledJobs, getTrash, saveTrash } from '../lib/storage'

export default function JobsPage({ ctx }) {
  const { agents, getAllJobs, cronJobs, setCronJobs, setAddModalOpen, setDetailModalOpen, setDetailModalJob, toast, showPage } = ctx
  const jobs = getAllJobs()

  const showJobDetail = (id) => {
    setDetailModalJob(id)
    setDetailModalOpen(true)
  }

  const deleteLocalJob = (id) => {
    const locals = loadLocalJobs()
    const job = locals.find(j => j.id === id)
    if (job) {
      const trash = getTrash()
      trash.push({ ...job, _trashType: 'job', deletedAt: Date.now() })
      saveTrash(trash)
      saveLocalJobs(locals.filter(j => j.id !== id))
    }
    toast('Job moved to trash', 'success')
    showPage('jobs')
  }

  const cancelJob = (id) => {
    const cancelled = getCancelledJobs()
    if (!cancelled.includes(id)) cancelled.push(id)
    saveCancelledJobs(cancelled)
    setCronJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: false, status: 'disabled' } : j))
    toast('Job cancelled', 'success')
  }

  const reenableJob = (id) => {
    const cancelled = getCancelledJobs().filter(cid => cid !== id)
    saveCancelledJobs(cancelled)
    setCronJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: true, status: 'active', _deleted: false } : j))
    toast('Job re-enabled', 'success')
  }

  const deleteCronJob = (id) => {
    const job = cronJobs.find(j => j.id === id)
    if (job) {
      const trash = getTrash()
      trash.push({ id: job.id, name: job.name, agent: job.agent, cron: job.cron, color: job.color, _trashType: 'cron-job', deletedAt: Date.now() })
      saveTrash(trash)
    }
    const cancelled = getCancelledJobs()
    if (!cancelled.includes(id)) cancelled.push(id)
    saveCancelledJobs(cancelled)
    setCronJobs(prev => prev.map(j => j.id === id ? { ...j, _deleted: true, enabled: false } : j))
    toast('Job moved to trash', 'success')
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-layers" size={22} /></span>Jobs & Tasks</div>
          <div className="section-sub">Manage your recurring and one-time automations</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}><SvgIcon id="ico-plus-circle" size={16} /> New Job</button>
      </div>

      <div className="anim anim-2">
        {jobs.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-icon"><SvgIcon id="ico-cpu" size={32} /></div><div className="empty-text">No jobs configured yet</div></div></div>
        ) : jobs.map(j => {
          const agent = agents[j.agent] || { name: 'Unknown', initial: '?', color: '#666' }
          const statusClass = j.status === 'error' ? 'error' : j.status === 'completed' || j.status === 'running' ? 'completed' : j.status === 'draft' ? 'draft' : (j.enabled === false ? 'disabled' : 'active')
          const statusLabel = statusClass === 'error' ? 'Error' : statusClass === 'completed' ? 'Complete' : statusClass === 'draft' ? 'Draft' : statusClass === 'disabled' ? 'Disabled' : 'Active'
          const nextRunStr = j.nextRun ? new Date(j.nextRun).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' }) : '—'

          return (
            <div key={j.id} className="card" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => showJobDetail(j.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="job-icon" style={{ background: `${j.color || agent.color}20`, color: j.color || agent.color, width: 48, height: 48 }}>
                  <span className="agent-emblem" style={{ fontSize: 18 }}>{agent.initial}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>{j.name}</span>
                    <div className={`job-status ${statusClass}`}><div className="job-status-dot"/>{statusLabel}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted-fg)' }}>
                    <span><strong style={{ color: 'var(--text)' }}>Agent:</strong> {agent.name}</span>
                    <span><strong style={{ color: 'var(--text)' }}>Schedule:</strong> <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{j.cron || '—'}</code></span>
                    <span><strong style={{ color: 'var(--text)' }}>Next:</strong> {nextRunStr}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  {j.isLocal && <button className="btn btn-sm btn-danger btn-ico-only" onClick={() => deleteLocalJob(j.id)} title="Delete"><SvgIcon id="ico-trash" size={14} /></button>}
                  {!j.isLocal && j.enabled !== false && <button className="btn btn-sm btn-danger" onClick={() => cancelJob(j.id)}><SvgIcon id="ico-x" size={14} /> Cancel</button>}
                  {!j.isLocal && j.enabled === false && !j._deleted && <button className="btn btn-sm" onClick={() => reenableJob(j.id)}><SvgIcon id="ico-play" size={14} /> Enable</button>}
                  {!j.isLocal && <button className="btn btn-sm btn-danger btn-ico-only" onClick={() => deleteCronJob(j.id)} title="Delete"><SvgIcon id="ico-trash" size={14} /></button>}
                  <button className="btn btn-sm" onClick={() => showJobDetail(j.id)}>Details</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
