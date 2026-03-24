import { SvgIcon } from '../IconSprite'
import { cronToHuman } from '../../lib/utils'

export default function JobDetailModal({ ctx }) {
  const { agents, getAllJobs, detailModalJob, detailModalTask, setDetailModalOpen, toast, viewDocument } = ctx

  const close = () => { ctx.setDetailModalOpen(false); ctx.setDetailModalJob(null); ctx.setDetailModalTask(null) }

  // If showing task detail
  if (detailModalTask) {
    const task = detailModalTask
    const agent = agents[task.agent] || { name: 'Unknown', initial: '?', color: '#666', model: '' }
    const statusLabels = { queued: 'Queued', running: 'In Progress', completed: 'Completed', error: 'Stuck / Error' }
    const completedStr = task.completedAt ? new Date(task.completedAt).toLocaleString('en-US', { timeZone: 'America/New_York' }) : '—'
    const createdStr = task.createdAt ? new Date(task.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' }) : '—'
    const hasResponse = !!task.output

    const openResponse = () => {
      close()
      viewDocument(null, task.name, task.output)
    }

    return (
      <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) close() }}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title"><span className="agent-emblem-mini">{agent.initial}</span> {task.name}</div>
            <button className="modal-close" onClick={close}><SvgIcon id="ico-x" size={16} /></button>
          </div>
          <div className="modal-body">
            <div className="detail-row"><div className="detail-key">Status</div><div className="detail-val"><div className={`task-status-badge ${task.status}`} style={{ display: 'inline-flex' }}>{statusLabels[task.status]}</div></div></div>
            <div className="detail-row"><div className="detail-key">Agent</div><div className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="agent-emblem-mini">{agent.initial}</span>{agent.name} <span className={`tag tag-${task.agent === 'christopher' ? 'violet' : 'cyan'}`}>{agent.model}</span></div></div>
            <div className="detail-row"><div className="detail-key">Created</div><div className="detail-val">{createdStr}</div></div>
            <div className="detail-row"><div className="detail-key">Completed</div><div className="detail-val" style={task.completedAt ? { color: 'var(--ok)', fontWeight: 600 } : {}}>{completedStr}</div></div>
            {task.description && <div className="detail-row"><div className="detail-key">Instructions</div><div className="detail-val" style={{ fontSize: 12, lineHeight: 1.6 }}>{task.description}</div></div>}
            {task.error && <div className="detail-row"><div className="detail-key">Error</div><div className="detail-val" style={{ color: 'var(--danger)', fontSize: 12 }}>{task.error}</div></div>}
          </div>
          <div className="modal-footer">
            {hasResponse && (
              <button className="btn btn-primary" onClick={openResponse}>
                <SvgIcon id="ico-file" size={15} /> View Response
              </button>
            )}
            <button className="btn" onClick={close}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  // Job detail
  const job = getAllJobs().find(j => j.id === detailModalJob)
  if (!job) return null

  const agent = agents[job.agent] || { name: 'Unknown', initial: '?', color: '#666', model: '' }
  const statusClass = job.status === 'error' ? 'error' : job.status === 'completed' || job.status === 'running' ? 'completed' : job.status === 'draft' ? 'draft' : (job.enabled === false ? 'disabled' : 'active')
  const statusLabel = statusClass === 'error' ? 'Error' : statusClass === 'completed' ? 'Complete' : statusClass === 'draft' ? 'Draft' : statusClass === 'disabled' ? 'Disabled' : 'Active'
  const lastRunStr = job.lastRun ? new Date(job.lastRun).toLocaleString('en-US', { timeZone: 'America/New_York' }) : '—'
  const nextRunStr = job.nextRun ? new Date(job.nextRun).toLocaleString('en-US', { timeZone: 'America/New_York' }) : '—'

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title"><span className="agent-emblem-mini">{agent.initial}</span> {job.name}</div>
          <button className="modal-close" onClick={close}><SvgIcon id="ico-x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="detail-row"><div className="detail-key">Status</div><div className="detail-val"><div className={`job-status ${statusClass}`} style={{ display: 'inline-flex' }}><div className="job-status-dot"/>{statusLabel}</div></div></div>
          <div className="detail-row"><div className="detail-key">Agent</div><div className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="agent-emblem-mini">{agent.initial}</span>{agent.name} <span className={`tag tag-${job.agent === 'christopher' ? 'violet' : 'cyan'}`}>{agent.model}</span></div></div>
          <div className="detail-row"><div className="detail-key">Schedule</div><div className="detail-val"><code>{job.cron}</code> <span style={{ color: 'var(--muted-fg)', fontSize: 12, marginLeft: 8 }}>{cronToHuman(job.cron)}</span></div></div>
          <div className="detail-row"><div className="detail-key">Timezone</div><div className="detail-val">{job.tz || 'America/New_York'}</div></div>
          <div className="detail-row"><div className="detail-key">Last Run</div><div className="detail-val">{lastRunStr}</div></div>
          <div className="detail-row"><div className="detail-key">Next Run</div><div className="detail-val" style={{ color: 'var(--accent)', fontWeight: 600 }}>{nextRunStr}</div></div>
          {job.lastError && <div className="detail-row"><div className="detail-key">Last Error</div><div className="detail-val" style={{ color: 'var(--danger)' }}><SvgIcon id="ico-alert" size={16} /> {job.lastError}</div></div>}
          <div className="detail-row"><div className="detail-key">Delivery</div><div className="detail-val">{job.delivery || 'announce'}</div></div>
          <div className="detail-row" style={{ borderBottom: 'none' }}><div className="detail-key">Instructions</div><div className="detail-val" style={{ fontSize: 12, lineHeight: 1.6 }}>{job.message || '—'}</div></div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  )
}
