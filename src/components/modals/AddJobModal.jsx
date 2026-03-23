import { useState, useRef } from 'react'
import { SvgIcon } from '../IconSprite'
import { to24Hour, cronToHuman, estimateNextRun } from '../../lib/utils'
import { loadLocalJobs, saveLocalJobs } from '../../lib/storage'
import { SUPABASE_URL, sbHeaders } from '../../lib/supabase'
import AttachmentUploader from '../AttachmentUploader'

export default function AddJobModal({ ctx }) {
  const { setAddModalOpen, toast, showPage, currentPage, agents, dbTasks, setDbTasks, user } = ctx

  // Pre-generate task ID so attachments can be stored under a stable path
  const taskIdRef = useRef('task-' + Date.now().toString(36))

  const [name, setName] = useState('')
  const [agent, setAgent] = useState('gordon')
  const [attachments, setAttachments] = useState([])
  const [message, setMessage] = useState('')
  const [tz, setTz] = useState('America/New_York')
  const [delivery, setDelivery] = useState('announce')
  const [color, setColor] = useState('#b9a9ff')
  const [freq, setFreq] = useState('weekdays')
  const [day, setDay] = useState('1')
  const [monthDay, setMonthDay] = useState('1')
  const [hour, setHour] = useState('8')
  const [minute, setMinute] = useState('30')
  const [ampm, setAmpm] = useState('AM')
  const [submitting, setSubmitting] = useState(false)

  const buildCron = () => {
    const h24 = to24Hour(parseInt(hour), ampm)
    if (freq === 'once') return null
    if (freq === 'weekdays') return `${minute} ${h24} * * 1-5`
    if (freq === 'daily') return `${minute} ${h24} * * *`
    if (freq === 'weekly') return `${minute} ${h24} * * ${day}`
    if (freq === 'monthly') return `${minute} ${h24} ${monthDay} * *`
    return null
  }

  const getPreview = () => {
    const timeStr = `${hour}:${String(minute).padStart(2, '0')} ${ampm}`
    if (freq === 'once') return 'Draft — run manually when ready'
    if (freq === 'weekdays') return `Runs weekdays at ${timeStr}`
    if (freq === 'daily') return `Runs every day at ${timeStr}`
    if (freq === 'weekly') {
      const dayNames = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' }
      return `Runs every ${dayNames[day]} at ${timeStr}`
    }
    if (freq === 'monthly') return `Runs on the ${monthDay}th of every month at ${timeStr}`
    return ''
  }

  const colors = ['#b9a9ff', '#06b6d4', '#34d399', '#fbbf24', '#f43f5e', '#ec4899', '#f97316']

  const create = async () => {
    if (submitting) return
    if (!name.trim()) { toast('Please enter a job name', 'error'); return }
    if (!message.trim()) { toast('Please enter task instructions', 'error'); return }

    setSubmitting(true)
    try {
      const cron = buildCron()
      const isOneTime = freq === 'once'
      const job = {
        id: 'local-' + Date.now().toString(36),
        name: name.trim(), agent, cron, tz, message: message.trim(), delivery, color,
        status: isOneTime ? 'draft' : 'active', enabled: true, isLocal: true, isOneTime,
        scheduleType: isOneTime ? 'draft' : 'cron',
        nextRun: cron ? estimateNextRun(cron, tz) : null,
        lastRun: null, lastError: null
      }

      const locals = loadLocalJobs()
      locals.push(job)
      saveLocalJobs(locals)

      // Create task in Supabase
      const task = {
        id: taskIdRef.current,
        name: job.name, agent: job.agent, status: 'queued',
        type: isOneTime ? 'one-time' : 'recurring',
        description: job.message, createdAt: Date.now(), updatedAt: Date.now(),
        completedAt: null, color: job.color,
        schedule: job.cron ? cronToHuman(job.cron) : (isOneTime ? 'One-time task' : ''),
        error: null, links: [], documents: [], attachments, progress: 0
      }
      setDbTasks(prev => [task, ...prev])
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
          method: 'POST', headers: sbHeaders,
          body: JSON.stringify({ id: task.id, name: task.name, agent: task.agent, status: task.status, type: task.type, description: task.description, created_at: task.createdAt, updated_at: task.updatedAt, completed_at: null, color: task.color, schedule: task.schedule, error: null, links: [], documents: [], attachments, progress: 0 })
        })
      } catch (e) { console.warn('DB insert failed:', e) }

      setAddModalOpen(false)
      toast(isOneTime ? `"${name}" saved as draft.` : `Job "${name}" created.`, 'success')
      showPage(currentPage)
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => setAddModalOpen(false)

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title"><SvgIcon id="ico-plus-circle" size={20} /> New Job</div>
          <button className="modal-close" onClick={close}><SvgIcon id="ico-x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Job Name <span className="required">*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Daily Briefing, Weekly Report…" />
          </div>
          <div className="form-group">
            <label className="form-label">Agent <span className="required">*</span></label>
            <select className="form-select" value={agent} onChange={e => setAgent(e.target.value)}>
              <option value="christopher">Christopher (Opus 4)</option>
              <option value="gordon">Gordon (GPT-5.4 Mini)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Schedule <span className="required">*</span></label>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-fg)', marginBottom: 6 }}>How often?</div>
              <div className="schedule-presets">
                {[{ k: 'once', l: 'Just Once' }, { k: 'weekdays', l: 'Weekdays (Mon–Fri)' }, { k: 'daily', l: 'Every Day' }, { k: 'weekly', l: 'Once a Week' }, { k: 'monthly', l: 'Once a Month' }].map(p => (
                  <button key={p.k} className={`preset-chip ${freq === p.k ? 'active' : ''}`} onClick={() => setFreq(p.k)}>{p.l}</button>
                ))}
              </div>
            </div>

            {freq === 'once' && (
              <div style={{ padding: '10px 14px', background: '#38bdf815', border: '1px solid #38bdf830', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--info)', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                <SvgIcon id="ico-bulb" size={18} /><span>This task will be saved as a draft. You can review and edit it, then use <strong>Run</strong> when you're ready.</span>
              </div>
            )}

            {freq === 'weekly' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-fg)', marginBottom: 6 }}>Which day?</div>
                <div className="schedule-presets">
                  {[['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday'],['0','Sunday']].map(([d, l]) => (
                    <button key={d} className={`preset-chip ${day === d ? 'active' : ''}`} onClick={() => setDay(d)}>{l}</button>
                  ))}
                </div>
              </div>
            )}

            {freq === 'monthly' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-fg)', marginBottom: 6 }}>Which day of the month?</div>
                <select className="form-select" value={monthDay} onChange={e => setMonthDay(e.target.value)}>
                  {['1','2','3','4','5','10','15','20','25','28'].map(d => <option key={d} value={d}>{d}{d==='1'?'st':d==='2'?'nd':d==='3'?'rd':'th'}</option>)}
                </select>
              </div>
            )}

            {freq !== 'once' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-fg)', marginBottom: 6 }}>What time?</div>
                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <select className="form-select" value={hour} onChange={e => setHour(e.target.value)}>
                    {['6','7','8','9','10','11','12','1','2','3','4','5'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select className="form-select" value={minute} onChange={e => setMinute(e.target.value)}>
                    {['0','15','30','45'].map(m => <option key={m} value={m}>:{String(m).padStart(2,'0')}</option>)}
                  </select>
                  <select className="form-select" value={ampm} onChange={e => setAmpm(e.target.value)}>
                    <option value="AM">AM</option><option value="PM">PM</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ padding: '10px 14px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              <SvgIcon id={freq === 'once' ? 'ico-bulb' : 'ico-calendar'} size={16} /> {getPreview()}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" value={tz} onChange={e => setTz(e.target.value)}>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Delivery</label>
              <select className="form-select" value={delivery} onChange={e => setDelivery(e.target.value)}>
                <option value="announce">Announce (Chat)</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Task Instructions <span className="required">*</span></label>
            <textarea className="form-textarea" value={message} onChange={e => setMessage(e.target.value)} placeholder="What should the agent do?" rows={4} />
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
              taskId={taskIdRef.current}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {colors.map(c => (
                <button key={c} className="color-swatch" style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={create} disabled={submitting}><SvgIcon id="ico-rocket" size={16} /> Create Job</button>
        </div>
      </div>
    </div>
  )
}
