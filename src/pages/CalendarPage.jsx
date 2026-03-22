import { useState } from 'react'
import { SvgIcon } from '../components/IconSprite'
import { fmtDate, cronMatchesDate, cronHour, cronMinute, getJobDatesForMonth } from '../lib/utils'

export default function CalendarPage({ ctx }) {
  const { agents, getAllJobs, setAddModalOpen, setDetailModalOpen, setDetailModalJob } = ctx
  const [calDate, setCalDate] = useState(new Date())
  const [calView, setCalView] = useState('month')

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const year = calDate.getFullYear()
  const month = calDate.getMonth()

  const jobs = getAllJobs()
  const todayStr = fmtDate(new Date())

  const prev = () => {
    const d = new Date(calDate)
    if (calView === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCalDate(d)
  }
  const next = () => {
    const d = new Date(calDate)
    if (calView === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCalDate(d)
  }

  const showJobDetail = (id) => {
    setDetailModalJob(id)
    setDetailModalOpen(true)
  }

  const renderMonth = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const jobDates = getJobDatesForMonth(year, month, jobs, agents)
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT']

    const cells = []
    // Headers
    days.forEach(d => cells.push(<div key={`h-${d}`} className="cal-day-header">{d}</div>))
    // Prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(<div key={`p-${i}`} className="cal-cell other"><div className="cal-cell-num">{daysInPrev - i}</div></div>)
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const isToday = dateStr === todayStr
      const events = jobDates[dateStr] || []
      cells.push(
        <div key={`d-${d}`} className={`cal-cell ${isToday ? 'today' : ''}`} onClick={() => setAddModalOpen(true)}>
          <div className="cal-cell-num">{d}</div>
          <div className="cal-cell-events">
            {events.slice(0, 3).map((e, i) => (
              <div key={i} className="cal-event-pill" style={{ background: `${e.color}cc` }} title={e.name} onClick={ev => { ev.stopPropagation(); showJobDetail(e.id) }}>
                <span className="cal-event-inner">
                  <span className="agent-emblem-mini">{e.agentInitial}</span>
                  <span className="cal-event-txt">{e.name}</span>
                </span>
              </div>
            ))}
            {events.length > 3 && <div className="cal-event-more">+{events.length - 3} more</div>}
          </div>
        </div>
      )
    }
    // Next month
    const totalCells = firstDay + daysInMonth
    const remaining = (7 - (totalCells % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      cells.push(<div key={`n-${d}`} className="cal-cell other"><div className="cal-cell-num">{d}</div></div>)
    }

    return <div className="cal-grid">{cells}</div>
  }

  const renderWeek = () => {
    const startOfWeek = new Date(calDate)
    startOfWeek.setDate(calDate.getDate() - calDate.getDay())
    const hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT']
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      weekDays.push(d)
    }

    return (
      <div className="week-view">
        <div className="week-header-cell" style={{ borderBottom: '1px solid var(--border)' }}></div>
        {weekDays.map((d, i) => {
          const ds = fmtDate(d)
          return (
            <div key={i} className={`week-header-cell ${ds === todayStr ? 'today' : ''}`}>
              {dayNames[i]}
              <span className="week-day-num">{d.getDate()}</span>
            </div>
          )
        })}
        {hours.map(h => {
          const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`
          return [
            <div key={`t-${h}`} className="week-time-col">{label}</div>,
            ...weekDays.map((d, i) => {
              const ds = fmtDate(d)
              const jobsAtHour = jobs.filter(j => j.cron && j.enabled !== false && cronMatchesDate(j.cron, d) && cronHour(j.cron) === h)
              return (
                <div key={`c-${h}-${i}`} className="week-cell" onClick={() => setAddModalOpen(true)}>
                  {jobsAtHour.map(j => {
                    const agent = agents[j.agent] || { initial: '?' }
                    const minute = cronMinute(j.cron)
                    const topPct = (minute / 60) * 100
                    return (
                      <div key={j.id} className="week-event" style={{ background: `${j.color || '#b9a9ff'}cc`, top: `${topPct}%`, height: 24 }} onClick={ev => { ev.stopPropagation(); showJobDetail(j.id) }} title={j.name}>
                        <span className="cal-event-inner"><span className="agent-emblem-mini">{agent.initial}</span><span className="cal-event-txt">{j.name}</span></span>
                      </div>
                    )
                  })}
                </div>
              )
            })
          ]
        })}
      </div>
    )
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-calendar" size={22} /></span>Calendar</div>
          <div className="section-sub">Your scheduled jobs and events at a glance</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}><SvgIcon id="ico-plus-circle" size={16} /> New Task</button>
      </div>

      <div className="card anim anim-2">
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={prev}>‹</button>
          <div className="cal-month">{months[month]} {year}</div>
          <button className="cal-nav-btn" onClick={next}>›</button>
          <button className="cal-today-btn" onClick={() => setCalDate(new Date())}>Today</button>
          <div className="cal-view-btns">
            <button className={`cal-view-btn ${calView === 'month' ? 'active' : ''}`} onClick={() => setCalView('month')}>Month</button>
            <button className={`cal-view-btn ${calView === 'week' ? 'active' : ''}`} onClick={() => setCalView('week')}>Week</button>
          </div>
        </div>
        {calView === 'month' ? renderMonth() : renderWeek()}
      </div>
    </div>
  )
}
