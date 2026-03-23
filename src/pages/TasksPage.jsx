import { useState } from 'react'
import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo, truncate } from '../lib/utils'
import { getTrash, saveTrash } from '../lib/storage'

export default function TasksPage({ ctx }) {
  const { agents, dbTasks, setDbTasks, dbUpdateTask, dbDeleteTask, mergeTaskDocuments, toast, setDetailModalTask, setDetailModalOpen, viewDocument } = ctx
  const [filter, setFilter] = useState('all')

  // Tasks page shows DB tasks only (real runs, not synthetic cron stubs)
  const allTasks = [...dbTasks].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  const filtered = filter === 'all' ? allTasks
    : filter === 'bookmarked' ? allTasks.filter(t => t.bookmarked)
    : allTasks.filter(t => t.status === filter)

  const counts = {
    all: allTasks.length,
    bookmarked: allTasks.filter(t => t.bookmarked).length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    running: allTasks.filter(t => t.status === 'running' || t.status === 'queued').length,
    error: allTasks.filter(t => t.status === 'error').length,
  }

  const toggleBookmark = async (e, task) => {
    e.stopPropagation()
    const bookmarked = !task.bookmarked
    setDbTasks(prev => prev.map(t => t.id === task.id ? { ...t, bookmarked } : t))
    await dbUpdateTask(task.id, { bookmarked })
    toast(bookmarked ? 'Task bookmarked' : 'Bookmark removed', 'success')
  }

  const deleteTask = async (e, task) => {
    e.stopPropagation()
    const trash = getTrash()
    trash.push({ ...task, _trashType: 'task', deletedAt: Date.now() })
    saveTrash(trash)
    setDbTasks(prev => prev.filter(t => t.id !== task.id))
    await dbDeleteTask(task.id)
    toast('Task moved to trash', 'success')
  }

  const statusIcons = { queued: 'ico-clock', running: 'ico-refresh', completed: 'ico-check-circle', error: 'ico-alert' }
  const statusLabels = { queued: 'Queued', running: 'In Progress', completed: 'Completed', error: 'Stuck / Error' }
  const progressColors = { queued: 'var(--warn)', running: 'var(--info)', completed: 'var(--ok)', error: 'var(--danger)' }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-clipboard" size={22} /></span>Task History</div>
          <div className="section-sub">Completed runs — kept 30 days unless bookmarked</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="anim anim-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All', icon: null },
          { key: 'bookmarked', label: 'Bookmarked', icon: 'ico-bookmark-fill' },
          { key: 'completed', label: 'Completed', icon: 'ico-check-circle' },
          { key: 'running', label: 'Active', icon: 'ico-refresh' },
          { key: 'error', label: 'Errors', icon: 'ico-alert' },
        ].map(f => (
          <button key={f.key} className={`task-filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.icon && <SvgIcon id={f.icon} size={14} />}
            {f.label} <span className="task-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="anim anim-3">
        {filtered.length === 0 ? (
          <div className="card" style={{ marginTop: 8 }}>
            <div className="empty-state">
              <div className="empty-icon">
                <SvgIcon id={filter === 'bookmarked' ? 'ico-bookmark' : filter === 'completed' ? 'ico-party' : filter === 'error' ? 'ico-alert' : 'ico-clipboard'} size={32} />
              </div>
              <div className="empty-text">
                {filter === 'all' ? 'No task history yet' : filter === 'bookmarked' ? 'No bookmarked tasks' : filter === 'completed' ? 'No completed tasks yet' : filter === 'error' ? 'No errors — all good!' : 'No active tasks'}
              </div>
            </div>
          </div>
        ) : filtered.map(t => {
          const agent = agents[t.agent] || { name: 'Unknown', initial: '?', color: '#666' }
          const timeAgo = t.updatedAt ? getTimeAgo(t.updatedAt) : ''
          const completedStr = t.completedAt ? new Date(t.completedAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) : ''
          const docs = mergeTaskDocuments(t)
          const links = t.links || []
          const taskAttachments = t.attachments || []

          return (
            <div key={t.id} className="task-card" style={{ '--task-color': t.color || agent.color }}
              onClick={() => { setDetailModalTask(t); setDetailModalOpen(true) }}>
              <div className="task-card-header">
                <div className={`task-status-icon ${t.status}`}><SvgIcon id={statusIcons[t.status]} size={20} /></div>
                <div className="task-main">
                  <div className="task-title">{t.name}</div>
                  <div className="task-meta">
                    <span className="task-meta-item"><span className="agent-emblem-mini">{agent.initial}</span><span>{agent.name}</span></span>
                    {taskAttachments.length > 0 && <span className="task-meta-item"><SvgIcon id="ico-paperclip" size={14} /><span>{taskAttachments.length} attachment{taskAttachments.length > 1 ? 's' : ''}</span></span>}
                    {completedStr && <span className="task-meta-item task-meta-dim"><SvgIcon id="ico-check-circle" size={13} />{completedStr}</span>}
                    {timeAgo && <span className="task-time-ago">{timeAgo}</span>}
                  </div>
                  {t.description && <div className="task-description">{truncate(t.description, 120)}</div>}
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
                <button
                  className={`task-bookmark-btn ${t.bookmarked ? 'active' : ''}`}
                  onClick={e => toggleBookmark(e, t)}
                  title={t.bookmarked ? 'Remove bookmark' : 'Bookmark task'}
                >
                  <SvgIcon id={t.bookmarked ? 'ico-bookmark-fill' : 'ico-bookmark'} size={16} />
                </button>
              </div>
              <div className="task-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }} onClick={e => deleteTask(e, t)}>
                  <SvgIcon id="ico-trash" size={14} /> Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
