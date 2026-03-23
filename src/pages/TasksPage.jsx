import { useState, useCallback } from 'react'
import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo, truncate, cronToHuman } from '../lib/utils'
import { getDismissedCronJobIds, saveDismissedCronJobIds, getTrash, saveTrash } from '../lib/storage'
import { SUPABASE_URL, sbHeaders } from '../lib/supabase'

export default function TasksPage({ ctx }) {
  const { agents, getAllTasks, mergeTaskDocuments, dbTasks, setDbTasks, dbUpdateTask, dbDeleteTask, dbInsertTask, postJobQueue, loadTasksFromDB, getAllJobs, toast, showPage, setAddModalOpen, setEditTaskModalOpen, setEditingTask, setDetailModalOpen, setDetailModalJob, viewDocument } = ctx
  const [filter, setFilter] = useState('all')

  const allTasks = getAllTasks()
  const filtered = filter === 'all' ? allTasks : allTasks.filter(t => t.status === filter)

  const counts = {
    all: allTasks.length,
    queued: allTasks.filter(t => t.status === 'queued').length,
    running: allTasks.filter(t => t.status === 'running').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    error: allTasks.filter(t => t.status === 'error').length,
  }

  // Sort: running first, then queued, then errors, then completed
  const statusOrder = { running: 0, queued: 1, error: 2, completed: 3 }
  const sorted = [...filtered].sort((a, b) => {
    const diff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
    if (diff !== 0) return diff
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  })

  const updateTaskStatus = async (id, newStatus) => {
    const updates = { status: newStatus, updatedAt: Date.now() }
    if (newStatus === 'completed') { updates.completedAt = Date.now(); updates.progress = 100 }
    if (newStatus === 'queued') { updates.completedAt = null }
    if (newStatus === 'error') { updates.progress = 25 }
    if (newStatus === 'running') { updates.progress = 50 }

    setDbTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    toast(`Task updated`, 'success')
    await dbUpdateTask(id, updates)
    const tasks = await loadTasksFromDB()
    if (tasks) setDbTasks(tasks)
  }

  const deleteTaskWithTrash = async (id) => {
    if (id.startsWith('cron-')) {
      const jobId = id.replace(/^cron-/, '')
      const ids = getDismissedCronJobIds()
      ids.push(jobId)
      saveDismissedCronJobIds(ids)
      toast('Removed from tracker', 'success')
      return
    }
    const task = dbTasks.find(t => t.id === id)
    if (task) {
      const trash = getTrash()
      trash.push({ ...task, _trashType: 'task', deletedAt: Date.now() })
      saveTrash(trash)
      setDbTasks(prev => prev.filter(t => t.id !== id))
      await dbDeleteTask(id)
    }
    toast('Task moved to trash', 'success')
  }

  const statusIcons = { queued: 'ico-clock', running: 'ico-refresh', completed: 'ico-check-circle', error: 'ico-alert' }
  const statusLabels = { queued: 'Queued', running: 'In Progress', completed: 'Completed', error: 'Stuck / Error' }
  const progressColors = { queued: 'var(--warn)', running: 'var(--info)', completed: 'var(--ok)', error: 'var(--danger)' }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-check-circle" size={22} /></span>Task Tracker</div>
          <div className="section-sub">Monitor task progress and review completed work</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}><SvgIcon id="ico-plus-circle" size={16} /> New Task</button>
      </div>

      {/* Filter tabs */}
      <div className="anim anim-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Tasks', icon: null },
          { key: 'queued', label: 'Queued', icon: 'ico-clock' },
          { key: 'running', label: 'In Progress', icon: 'ico-refresh' },
          { key: 'completed', label: 'Completed', icon: 'ico-check-circle' },
          { key: 'error', label: 'Stuck / Error', icon: 'ico-alert' },
        ].map(f => (
          <button key={f.key} className={`task-filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.icon && <SvgIcon id={f.icon} size={15} />}
            {f.label} <span className="task-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="anim anim-3">
        {sorted.length === 0 ? (
          <div className="card" style={{ marginTop: 8 }}>
            <div className="empty-state">
              <div className="empty-icon"><SvgIcon id={filter === 'completed' ? 'ico-party' : filter === 'error' ? 'ico-alert' : 'ico-clipboard'} size={32} /></div>
              <div className="empty-text">{filter === 'all' ? 'No tasks yet — create one!' : filter === 'completed' ? 'No completed tasks yet' : filter === 'error' ? 'No stuck tasks — everything is running smooth!' : `No ${filter} tasks`}</div>
            </div>
          </div>
        ) : sorted.map(t => {
          const agent = agents[t.agent] || { name: 'Unknown', initial: '?', color: '#666' }
          const timeAgo = t.updatedAt ? getTimeAgo(t.updatedAt) : ''
          const completedStr = t.completedAt ? new Date(t.completedAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) : ''
          const docs = mergeTaskDocuments(t)
          const links = t.links || []
          const taskAttachments = t.attachments || []

          return (
            <div key={t.id} className="task-card" style={{ '--task-color': t.color || agent.color }} onClick={() => { ctx.setDetailModalTask(t); ctx.setDetailModalOpen(true) }}>
              <div className="task-card-header">
                <div className={`task-status-icon ${t.status}`}><SvgIcon id={statusIcons[t.status]} size={20} /></div>
                <div className="task-main">
                  <div className="task-title">{t.name}</div>
                  <div className="task-meta">
                    <span className="task-meta-item"><span className="agent-emblem-mini">{agent.initial}</span><span>{agent.name}</span></span>
                    <span className="task-meta-item"><SvgIcon id="ico-clipboard" size={14} /><span>{t.type === 'recurring' ? 'Recurring' : 'One-time'}</span></span>
                    {t.schedule && <span className="task-meta-item"><SvgIcon id="ico-clock" size={14} /><span>{t.schedule}</span></span>}
                    {taskAttachments.length > 0 && <span className="task-meta-item"><SvgIcon id="ico-paperclip" size={14} /><span>{taskAttachments.length} attachment{taskAttachments.length > 1 ? 's' : ''}</span></span>}
                    {timeAgo && <span className="task-time-ago">{timeAgo}</span>}
                  </div>
                  {t.description && <div className="task-description">{truncate(t.description, 150)}</div>}
                  {(links.length > 0 || docs.length > 0 || taskAttachments.length > 0) && (
                    <div className="task-attachments">
                      {links.map((l, i) => <a key={i} className="task-attachment" href={l.url} target="_blank" onClick={e => e.stopPropagation()}><SvgIcon id="ico-link" size={13} /><span>{l.label || l.url}</span></a>)}
                      {docs.map((d, i) => <button key={i} type="button" className="task-attachment" onClick={e => { e.stopPropagation(); viewDocument(d.name, t.name) }}><SvgIcon id="ico-file" size={13} /><span>{d.name}</span></button>)}
                      {taskAttachments.map(a => (
                        <a key={a.id} className="task-attachment" href={a.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                          <SvgIcon id={a.type === 'application/pdf' ? 'ico-file' : 'ico-image'} size={13} />
                          <span>{a.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {t.progress !== undefined && (
                    <div className="task-progress">
                      <div className="task-progress-bar">
                        <div className="task-progress-fill" style={{ width: `${t.progress}%`, background: progressColors[t.status] }} />
                      </div>
                      <div className="task-progress-label">
                        <span>{statusLabels[t.status]}</span>
                        <span>{t.progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`task-status-badge ${t.status}`}>{statusLabels[t.status]}</div>
              </div>
              <div className="task-actions" onClick={e => e.stopPropagation()}>
                {t.status === 'running' && <button className="btn btn-sm" onClick={() => updateTaskStatus(t.id, 'queued')}><SvgIcon id="ico-pause" size={14} /> Pause</button>}
                {t.status !== 'running' && t.status !== 'completed' && <button className="btn btn-sm" onClick={() => updateTaskStatus(t.id, 'running')}><SvgIcon id="ico-play" size={14} /> Start</button>}
                {!t.id.startsWith('cron-') && t.status !== 'running' && (
                  <button className="btn btn-sm" onClick={() => { setEditingTask(t); setEditTaskModalOpen(true) }}><SvgIcon id="ico-pencil" size={14} /> Edit</button>
                )}
                <button className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }} onClick={() => deleteTaskWithTrash(t.id)}>Delete</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
