import { SvgIcon } from '../components/IconSprite'
import { getTrash, saveTrash, loadLocalJobs, saveLocalJobs, getCancelledJobs, saveCancelledJobs } from '../lib/storage'
import { SUPABASE_URL, sbHeaders } from '../lib/supabase'

export default function TrashPage({ ctx }) {
  const { agents, cronJobs, setCronJobs, dbTasks, setDbTasks, dbInsertTask, toast, showPage } = ctx
  const trash = getTrash()

  const restore = (idx) => {
    const items = getTrash()
    const item = items[idx]
    if (!item) return

    if (item._trashType === 'job') {
      const locals = loadLocalJobs()
      const { _trashType, deletedAt, ...restored } = item
      locals.push(restored)
      saveLocalJobs(locals)
    } else if (item._trashType === 'cron-job') {
      const cancelled = getCancelledJobs().filter(id => id !== item.id)
      saveCancelledJobs(cancelled)
      setCronJobs(prev => prev.map(j => j.id === item.id ? { ...j, enabled: true, status: 'active', _deleted: false } : j))
    } else if (item._trashType === 'task') {
      const { _trashType, deletedAt, ...restored } = item
      setDbTasks(prev => [restored, ...prev])
      dbInsertTask(restored)
    }

    items.splice(idx, 1)
    saveTrash(items)
    toast('Item restored', 'success')
  }

  const permanentDelete = (idx) => {
    const items = getTrash()
    items.splice(idx, 1)
    saveTrash(items)
    toast('Permanently deleted', 'success')
  }

  const emptyTrash = () => {
    saveTrash([])
    toast('Trash emptied', 'success')
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-trash" size={22} /></span>Trash</div>
          <div className="section-sub">Deleted items are permanently removed after 30 days</div>
        </div>
        <button className="btn btn-sm btn-danger" onClick={emptyTrash}><SvgIcon id="ico-trash" size={14} /> Empty Trash</button>
      </div>

      <div className="anim anim-2">
        {trash.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}><SvgIcon id="ico-trash" size={28} /></div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 13 }}>Trash is empty</div>
          </div>
        ) : trash.map((item, i) => {
          const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - item.deletedAt) / (24*60*60*1000)))
          const typeLabel = item._trashType === 'task' ? 'Task' : 'Job'
          const agent = agents[item.agent] || { name: 'Unknown', initial: '?', color: '#666' }
          const deletedStr = new Date(item.deletedAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' })

          return (
            <div key={i} className="card" style={{ marginBottom: 10, padding: '16px 20px', opacity: 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 2 }}>
                    {typeLabel} · {agent.name} · Deleted {deletedStr} · {daysLeft}d until permanent deletion
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => restore(i)}><SvgIcon id="ico-refresh" size={14} /> Restore</button>
                  <button className="btn btn-sm btn-danger" onClick={() => permanentDelete(i)}><SvgIcon id="ico-trash" size={14} /> Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
