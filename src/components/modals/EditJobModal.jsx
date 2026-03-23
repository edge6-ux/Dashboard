import { useState, useEffect } from 'react'
import { SvgIcon } from '../IconSprite'
import { to24Hour, cronToHuman, estimateNextRun } from '../../lib/utils'
import { loadLocalJobs, saveLocalJobs } from '../../lib/storage'

const parseCron = (cron) => {
  if (!cron) return { freq: 'once', hour: '8', minute: '30', ampm: 'AM', day: '1', monthDay: '1' }
  const [min, hr, dom, , dow] = cron.split(' ')
  const h24 = parseInt(hr)
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  const ap = h24 < 12 ? 'AM' : 'PM'
  let freq = 'daily', day = '1', monthDay = '1'
  if (dom !== '*') { freq = 'monthly'; monthDay = dom }
  else if (dow === '1-5') { freq = 'weekdays' }
  else if (dow !== '*') { freq = 'weekly'; day = dow }
  return { freq, hour: String(h12), minute: String(min), ampm: ap, day, monthDay }
}

const COLORS = ['#b9a9ff', '#06b6d4', '#34d399', '#fbbf24', '#f43f5e', '#ec4899', '#f97316']

export default function EditJobModal({ ctx }) {
  const { editingJob, setEditJobModalOpen, setEditingJob, setCronJobs, toast } = ctx

  const [name, setName] = useState('')
  const [agent, setAgent] = useState('gordon')
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

  useEffect(() => {
    if (!editingJob) return
    setName(editingJob.name || '')
    setAgent(editingJob.agent || 'gordon')
    setMessage(editingJob.message || '')
    setTz(editingJob.tz || 'America/New_York')
    setDelivery(editingJob.delivery || 'announce')
    setColor(editingJob.color || '#b9a9ff')
    const parsed = parseCron(editingJob.cron)
    setFreq(parsed.freq); setHour(parsed.hour); setMinute(parsed.minute)
    setAmpm(parsed.ampm); setDay(parsed.day); setMonthDay(parsed.monthDay)
  }, [editingJob])

  const close = () => { setEditJobModalOpen(false); setEditingJob(null) }

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
    const t = `${hour}:${String(minute).padStart(2, '0')} ${ampm}`
    if (freq === 'once') return 'One-time draft'
    if (freq === 'weekdays') return `Runs weekdays at ${t}`
    if (freq === 'daily') return `Runs every day at ${t}`
    if (freq === 'weekly') {
      const n = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' }
      return `Runs every ${n[day]} at ${t}`
    }
    if (freq === 'monthly') return `Runs on the ${monthDay}${monthDay==='1'?'st':monthDay==='2'?'nd':monthDay==='3'?'rd':'th'} of every month at ${t}`
    return ''
  }

  const save = () => {
    if (!name.trim()) { toast('Enter a job name', 'error'); return }
    if (!message.trim()) { toast('Enter task instructions', 'error'); return }
    const cron = buildCron()
    const nextRun = cron ? estimateNextRun(cron, tz) : null

    if (editingJob.isLocal) {
      const locals = loadLocalJobs()
      saveLocalJobs(locals.map(j => j.id === editingJob.id ? {
        ...j, name: name.trim(), agent, message: message.trim(), tz, delivery, color, cron, nextRun,
        scheduleType: freq === 'once' ? 'draft' : 'cron',
        status: freq === 'once' ? 'draft' : 'active'
      } : j))
    } else {
      setCronJobs(prev => prev.map(j => j.id === editingJob.id
        ? { ...j, name: name.trim(), message: message.trim(), color }
        : j))
    }
    close()
    toast(`Job "${name.trim()}" updated`, 'success')
  }

  if (!editingJob) return null
  const isLocal = editingJob.isLocal

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title"><SvgIcon id="ico-pencil" size={20} /> Edit Job</div>
          <button className="modal-close" onClick={close}><SvgIcon id="ico-x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Job Name <span className="required">*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {isLocal && (
            <div className="form-group">
              <label className="form-label">Agent</label>
              <select className="form-select" value={agent} onChange={e => setAgent(e.target.value)}>
                <option value="christopher">Christopher (Opus 4)</option>
                <option value="gordon">Gordon (GPT-4.1)</option>
              </select>
            </div>
          )}

          {!isLocal && (
            <div className="form-notice form-notice-warn">
              <SvgIcon id="ico-clock" size={14} /> Schedule is managed by the gateway — only name, instructions, and color can be edited here.
            </div>
          )}

          {isLocal && (
            <div className="form-group">
              <label className="form-label">Schedule</label>
              <div style={{ marginBottom: 12 }}>
                <div className="form-sublabel">How often?</div>
                <div className="schedule-presets">
                  {[{ k: 'once', l: 'Just Once' }, { k: 'weekdays', l: 'Weekdays' }, { k: 'daily', l: 'Every Day' }, { k: 'weekly', l: 'Weekly' }, { k: 'monthly', l: 'Monthly' }].map(p => (
                    <button key={p.k} className={`preset-chip ${freq === p.k ? 'active' : ''}`} onClick={() => setFreq(p.k)}>{p.l}</button>
                  ))}
                </div>
              </div>

              {freq === 'weekly' && (
                <div style={{ marginBottom: 12 }}>
                  <div className="form-sublabel">Which day?</div>
                  <div className="schedule-presets">
                    {[['1','Mon'],['2','Tue'],['3','Wed'],['4','Thu'],['5','Fri'],['6','Sat'],['0','Sun']].map(([d, l]) => (
                      <button key={d} className={`preset-chip ${day === d ? 'active' : ''}`} onClick={() => setDay(d)}>{l}</button>
                    ))}
                  </div>
                </div>
              )}

              {freq === 'monthly' && (
                <div style={{ marginBottom: 12 }}>
                  <div className="form-sublabel">Which day of the month?</div>
                  <select className="form-select" value={monthDay} onChange={e => setMonthDay(e.target.value)}>
                    {['1','2','3','4','5','10','15','20','25','28'].map(d => <option key={d} value={d}>{d}{d==='1'?'st':d==='2'?'nd':d==='3'?'rd':'th'}</option>)}
                  </select>
                </div>
              )}

              {freq !== 'once' && (
                <div style={{ marginBottom: 12 }}>
                  <div className="form-sublabel">What time?</div>
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

              <div className="schedule-preview">
                <SvgIcon id={freq === 'once' ? 'ico-bulb' : 'ico-calendar'} size={14} /> {getPreview()}
              </div>
            </div>
          )}

          {isLocal && (
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
          )}

          <div className="form-group">
            <label className="form-label">Task Instructions <span className="required">*</span></label>
            <textarea className="form-textarea" value={message} onChange={e => setMessage(e.target.value)} rows={4} />
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <button key={c} className="color-swatch" style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} onClick={() => setColor(c)} />
              ))}
            </div>
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
