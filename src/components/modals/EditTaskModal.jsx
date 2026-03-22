import { useState, useEffect } from 'react'
import { SvgIcon } from '../IconSprite'
import { SUPABASE_URL, sbHeaders } from '../../lib/supabase'

export default function EditTaskModal({ ctx }) {
  const { editingTask, setEditTaskModalOpen, setEditingTask, dbTasks, setDbTasks, loadTasksFromDB, toast } = ctx

  const [name, setName] = useState('')
  const [agent, setAgent] = useState('christopher')
  const [status, setStatus] = useState('queued')
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState([])
  const [docs, setDocs] = useState([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [docName, setDocName] = useState('')

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name || '')
      setAgent(editingTask.agent || 'christopher')
      setStatus(editingTask.status || 'queued')
      setDescription(editingTask.description || '')
      setLinks([...(editingTask.links || [])])
      setDocs([...(editingTask.documents || [])])
    }
  }, [editingTask])

  const close = () => { setEditTaskModalOpen(false); setEditingTask(null) }

  const addLink = () => {
    if (!linkUrl.trim()) { toast('Enter a URL', 'error'); return }
    setLinks([...links, { url: linkUrl.trim(), label: linkLabel.trim() || linkUrl.trim() }])
    setLinkUrl(''); setLinkLabel('')
  }

  const addDoc = () => {
    if (!docName.trim()) { toast('Enter a document name', 'error'); return }
    setDocs([...docs, { name: docName.trim() }])
    setDocName('')
  }

  const save = async () => {
    if (!name.trim()) { toast('Enter a task name', 'error'); return }
    const now = Date.now()
    const progress = status === 'completed' ? 100 : status === 'running' ? 50 : status === 'error' ? 25 : 0
    const updates = {
      name: name.trim(), agent, status, description: description.trim(),
      links, documents: docs, updated_at: now, progress,
      ...(status === 'completed' ? { completed_at: now } : {})
    }

    setDbTasks(prev => prev.map(t => t.id === editingTask.id ? {
      ...t, name: updates.name, agent, status, description: updates.description,
      links, documents: docs, updatedAt: now, progress,
      ...(status === 'completed' ? { completedAt: now } : {})
    } : t))

    close()
    toast(`✅ Task "${name}" updated!`, 'success')

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(editingTask.id)}`, {
        method: 'PATCH', headers: sbHeaders, body: JSON.stringify(updates)
      })
      const tasks = await loadTasksFromDB()
      if (tasks) setDbTasks(tasks)
    } catch (e) { console.warn('Update failed:', e) }
  }

  if (!editingTask) return null

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title"><SvgIcon id="ico-pencil" size={20} /> Edit Task</div>
          <button className="modal-close" onClick={close}><SvgIcon id="ico-x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Task Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Agent</label>
            <select className="form-select" value={agent} onChange={e => setAgent(e.target.value)}>
              <option value="christopher">Christopher</option>
              <option value="gordon">Gordon</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="queued">Queued</option>
              <option value="running">In Progress</option>
              <option value="completed">Completed</option>
              <option value="error">Stuck / Error</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="form-group">
            <label className="form-label">Add Link</label>
            <div className="form-row">
              <input className="form-input" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
              <input className="form-input" value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="Label (optional)" />
            </div>
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={addLink}>+ Add Link</button>
            {links.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span className="task-attachment" style={{ flex: 1 }}>🔗 {l.label || l.url}</span>
                <button className="btn btn-sm btn-danger" onClick={() => setLinks(links.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Add Document Reference</label>
            <div className="form-row" style={{ gridTemplateColumns: '1fr auto' }}>
              <input className="form-input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="filename.pdf" />
              <button className="btn btn-sm" onClick={addDoc}>+ Add</button>
            </div>
            {docs.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span className="task-attachment" style={{ flex: 1 }}>📄 {d.name}</span>
                <button className="btn btn-sm btn-danger" onClick={() => setDocs(docs.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={save}><SvgIcon id="ico-save" size={16} /> Save Changes</button>
        </div>
      </div>
    </div>
  )
}
