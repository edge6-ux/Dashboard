import { SvgIcon } from '../components/IconSprite'
import { cronToHuman, fmtRunDate } from '../lib/utils'
import { loadLocalJobs, saveLocalJobs, getCancelledJobs, saveCancelledJobs, getTrash, saveTrash } from '../lib/storage'
import { supabase, SUPABASE_URL, sbHeaders } from '../lib/supabase'

export default function JobsPage({ ctx }) {
  const { agents, getAllJobs, cronJobs, setCronJobs, setAddModalOpen, setEditJobModalOpen, setEditingJob, dbInsertTask, postJobQueue, setDbTasks, toast, showPage } = ctx
  const jobs = getAllJobs()

  const runJobNow = async (job) => {
    const taskId = 'run-' + Date.now().toString(36)
    const dateStr = fmtRunDate(Date.now())
    const name = `${job.name} ${dateStr}`
    const task = {
      id: taskId, name, agent: job.agent, status: 'queued',
      type: 'recurring', description: job.message,
      createdAt: Date.now(), updatedAt: Date.now(), completedAt: null,
      color: job.color, schedule: 'Manual run',
      error: null, links: [], documents: [], attachments: job.attachments || [], progress: 0
    }
    setDbTasks(prev => [task, ...prev])
    await dbInsertTask(task)
    await postJobQueue(taskId, job.agent, name, job.message)
    toast(`Running "${job.name}"`, 'success')
  }

  const openEdit = (job) => { setEditingJob(job); setEditJobModalOpen(true) }

  const cancelJob = async (id) => {
    const cancelled = getCancelledJobs()
    if (!cancelled.includes(id)) cancelled.push(id)
    saveCancelledJobs(cancelled)
    setCronJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: false, status: 'disabled' } : j))
    try {
      await supabase.from('cron_actions').insert({
        id: 'ca-' + Date.now().toString(36), job_id: id,
        action: 'disable', status: 'pending', created_at: Date.now()
      })
    } catch (e) { console.warn('Cron action failed:', e) }
    toast('Job paused', 'success')
  }

  const reenableJob = async (id) => {
    const cancelled = getCancelledJobs().filter(cid => cid !== id)
    saveCancelledJobs(cancelled)
    setCronJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: true, status: 'active', _deleted: false } : j))
    try {
      await supabase.from('cron_actions').insert({
        id: 'ca-' + Date.now().toString(36), job_id: id,
        action: 'enable', status: 'pending', created_at: Date.now()
      })
    } catch (e) { console.warn('Cron action failed:', e) }
    toast('Job enabled', 'success')
  }

  const deleteJob = (job) => {
    const trash = getTrash()
    if (job.isLocal) {
      trash.push({ ...job, _trashType: 'job', deletedAt: Date.now() })
      saveTrash(trash)
      saveLocalJobs(loadLocalJobs().filter(j => j.id !== job.id))
    } else {
      trash.push({ id: job.id, name: job.name, agent: job.agent, cron: job.cron, color: job.color, _trashType: 'cron-job', deletedAt: Date.now() })
      saveTrash(trash)
      const cancelled = getCancelledJobs()
      if (!cancelled.includes(job.id)) cancelled.push(job.id)
      saveCancelledJobs(cancelled)
      setCronJobs(prev => prev.map(j => j.id === job.id ? { ...j, _deleted: true, enabled: false } : j))
    }
    toast('Job moved to trash', 'success')
    showPage('jobs')
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-layers" size={22} /></span>Jobs</div>
          <div className="section-sub">Manage and control your recurring automations</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}><SvgIcon id="ico-plus-circle" size={16} /> New Job</button>
      </div>

      <div className="anim anim-2">
        {jobs.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><SvgIcon id="ico-layers" size={32} /></div>
              <div className="empty-text">No jobs yet — create one to get started</div>
            </div>
          </div>
        ) : jobs.map(j => {
          const agent = agents[j.agent] || { name: 'Unknown', initial: '?', color: '#666' }
          const isDisabled = j.enabled === false
          const isDraft = j.status === 'draft' || j.isOneTime
          const statusClass = isDraft ? 'draft' : isDisabled ? 'disabled' : j.status === 'error' ? 'error' : 'active'
          const statusLabel = isDraft ? 'Draft' : isDisabled ? 'Paused' : j.status === 'error' ? 'Error' : 'Active'
          const nextRunStr = j.nextRun ? new Date(j.nextRun).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' }) : null
          const lastRunStr = j.lastRun ? new Date(j.lastRun).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' }) : null
          const scheduleStr = j.cron ? cronToHuman(j.cron) : (isDraft ? 'One-time draft' : '—')

          return (
            <div key={j.id} className="job-card" style={{ '--job-color': j.color || agent.color }}>
              <div className="job-card-accent" />
              <div className="job-card-body">
                <div className="job-card-header">
                  <div className="job-card-icon">
                    <span className="agent-emblem" style={{ background: `${j.color || agent.color}20`, color: j.color || agent.color }}>{agent.initial}</span>
                  </div>
                  <div className="job-card-info">
                    <div className="job-card-name">{j.name}</div>
                    <div className="job-card-meta">
                      <span className="job-card-meta-item"><span className="agent-emblem-mini">{agent.initial}</span>{agent.name}</span>
                      <span className="job-card-meta-item"><SvgIcon id="ico-clock" size={13} />{scheduleStr}</span>
                      {nextRunStr && !isDisabled && !isDraft && (
                        <span className="job-card-meta-item"><SvgIcon id="ico-calendar" size={13} />Next: {nextRunStr}</span>
                      )}
                      {lastRunStr && (
                        <span className="job-card-meta-item job-card-meta-dim"><SvgIcon id="ico-refresh" size={13} />Last: {lastRunStr}</span>
                      )}
                    </div>
                  </div>
                  <div className={`job-status ${statusClass}`}>
                    <div className="job-status-dot" />
                    {statusLabel}
                  </div>
                </div>

                {j.message && (
                  <div className="job-card-instructions">{j.message.length > 120 ? j.message.slice(0, 120) + '…' : j.message}</div>
                )}

                <div className="job-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm" onClick={() => runJobNow(j)}>
                    <SvgIcon id="ico-play" size={14} /> Run Now
                  </button>
                  <button className="btn btn-sm" onClick={() => openEdit(j)}>
                    <SvgIcon id="ico-pencil" size={14} /> Edit
                  </button>
                  {!j.isLocal && !isDisabled && (
                    <button className="btn btn-sm" onClick={() => cancelJob(j.id)}>
                      <SvgIcon id="ico-pause" size={14} /> Pause
                    </button>
                  )}
                  {!j.isLocal && isDisabled && !j._deleted && (
                    <button className="btn btn-sm" onClick={() => reenableJob(j.id)}>
                      <SvgIcon id="ico-play" size={14} /> Enable
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }} onClick={() => deleteJob(j)}>
                    <SvgIcon id="ico-trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
