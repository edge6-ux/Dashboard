import { useState, useEffect } from 'react'
import { SvgIcon } from '../IconSprite'
import { SUPABASE_URL, sbHeaders } from '../../lib/supabase'
import AttachmentUploader from '../AttachmentUploader'

export default function EditTaskModal({ ctx }) {
  const { editingTask, setEditTaskModalOpen, setEditingTask, dbTasks, setDbTasks, loadTasksFromDB, toast, user } = ctx

  const [name, setName] = useState('')
  const [agent, setAgent] = useState('gordon')
  const [status, setStatus] = useState('queued')
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState([])
  const [docs, setDocs] = useState([])
  const [attachments, setAttachments] = useState([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name || '')
      setAgent(editingTask.agent || 'gordon')
      setStatus(editingTask.status || 'queued')
      setDescription(editingTask.description || '')
      setLinks([...(editingTask.links || [])])
      setDocs([...(editingTask.documents || [])])
      setAttachments([...(editingTask.attachments || [])])
    }
  }, [editingTask])

  const close = () => { setEditTaskModalOpen(false); setEditingTask(null) }

  const addLink = () => {
    if (!linkUrl.trim()) { toast('Enter a URL', 'error'); return }
    setLinks([...links, { url: linkUrl.trim(), label: linkLabel.trim() || linkUrl.trim() }])
    setLinkUrl(''); setLinkLabel('')
  }

  const save = async () => {
    if (!name.trim()) { toast('Enter a task name', 'error'); return }
    const now = Date.now()
    const progress = status === 'completed' ? 100 : status === 'running' ? 50 : status === 'error' ? 25 : 0
    const updates = {
      name: name.trim(), agent, status, description: description.trim(),
      links, documents: docs, attachments, updated_at: now, progress,
      ...(status === 'completed' ? { completed_at: now } : {})
    }

    setDbTasks(prev => prev.map(t => t.id === editingTask.id ? {
      ...t, name: updates.name, agent, status, description: updates.description,
      links, documents: docs, attachments, updatedAt: now, progress,
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
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={addLink}><SvgIcon id="ico-plus" size={13} /> Add Link</button>
            {links.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className="task-attachment" style={{ flex: 1 }}><SvgIcon id="ico-link" size={13} />{l.label || l.url}</span>
                <button className="btn btn-sm btn-danger btn-ico-only" onClick={() => setLinks(links.filter((_, j) => j !== i))}><SvgIcon id="ico-x" size={13} /></button>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SvgIcon id="ico-paperclip" size={13} /> Attachments
              <span style={{ fontWeight: 400, color: 'var(--muted-fg)', fontSize: 11 }}>— PDFs or images for Gordon to analyze</span>
            </label>
            <AttachmentUploader
              attachments={attachments}
              onChange={setAttachments}
              userId={user?.id}
              taskId={editingTask?.id}
            />
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
