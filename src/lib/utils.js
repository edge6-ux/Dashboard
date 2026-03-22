// ═══════════════════════════════════════════════
//  Utility Functions
// ═══════════════════════════════════════════════

export function escapeHtml(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function getTimeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(months / 12)}y`
}

export function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isToday(d) {
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function isTomorrow(d) {
  const tom = new Date()
  tom.setDate(tom.getDate() + 1)
  return d.getDate() === tom.getDate() && d.getMonth() === tom.getMonth() && d.getFullYear() === tom.getFullYear()
}

// ── Cron Helpers ──

export function cronToHuman(expr) {
  if (!expr) return '—'
  const parts = expr.split(' ')
  if (parts.length < 5) return expr

  const [min, hour, dom, , dow] = parts
  let time = ''
  const h = parseInt(hour)
  const m = parseInt(min)
  if (!isNaN(h) && !isNaN(m)) {
    const ampm = h >= 12 ? 'pm' : 'am'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    time = `${h12}:${String(m).padStart(2, '0')}${ampm}`
  }

  const dayMap = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat' }
  let days = ''
  if (dow === '*' && dom === '*') days = 'Every day'
  else if (dow === '1-5') days = 'Weekdays'
  else if (dow === '0,6') days = 'Weekends'
  else if (dow === '*' && dom !== '*') days = `Day ${dom} of month`
  else if (dow !== '*') {
    const dayParts = dow.split(',').map(d => {
      if (d.includes('-')) {
        const [s, e] = d.split('-')
        return `${dayMap[s] || s}–${dayMap[e] || e}`
      }
      return dayMap[d] || d
    })
    days = dayParts.join(', ')
  }

  return `${days} at ${time}`
}

export function cronMatchesDate(expr, date) {
  if (!expr) return false
  const parts = expr.split(' ')
  if (parts.length < 5) return false

  const [, , dom, month, dow] = parts
  const d = date.getDay()
  const dm = date.getDate()
  const m = date.getMonth() + 1

  if (month !== '*' && !matchesCronField(month, m)) return false
  if (dom !== '*' && !matchesCronField(dom, dm)) return false
  if (dow !== '*' && !matchesCronField(dow, d)) return false

  return true
}

function matchesCronField(field, value) {
  return field.split(',').some(part => {
    if (part.includes('-')) {
      const [s, e] = part.split('-').map(Number)
      return value >= s && value <= e
    }
    return parseInt(part) === value
  })
}

export function cronHour(expr) {
  const parts = expr.split(' ')
  return parts.length >= 2 ? parseInt(parts[1]) : -1
}

export function cronMinute(expr) {
  const parts = expr.split(' ')
  return parts.length >= 1 ? parseInt(parts[0]) : 0
}

export function estimateNextRun(cron, tz) {
  const now = new Date()
  for (let i = 0; i < 60; i++) {
    const check = new Date(now)
    check.setDate(now.getDate() + i)
    if (cronMatchesDate(cron, check)) {
      const hour = cronHour(cron)
      const min = cronMinute(cron)
      check.setHours(hour, min, 0, 0)
      if (check > now) return check.getTime()
    }
  }
  return null
}

export function getJobDatesForMonth(year, month, jobs, agents) {
  const dates = {}
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const enabledJobs = jobs.filter(j => j.enabled !== false)

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dateStr = fmtDate(date)

    enabledJobs.forEach(j => {
      if (cronMatchesDate(j.cron, date)) {
        if (!dates[dateStr]) dates[dateStr] = []
        const agent = agents[j.agent] || { name: 'Unknown', initial: '?' }
        dates[dateStr].push({
          id: j.id,
          name: j.name,
          color: j.color || agent.color || '#b9a9ff',
          agentInitial: String(agent.initial || agent.name?.[0] || '?').toUpperCase()
        })
      }
    })
  }

  return dates
}

export function to24Hour(hour, ampm) {
  if (ampm === 'AM') return hour === 12 ? 0 : hour
  return hour === 12 ? 12 : hour + 12
}

// Animated counter helper
export function animateCounter(el, target, duration = 600) {
  if (!el) return
  const start = parseInt(el.textContent) || 0
  if (start === target) return
  const diff = target - start
  const startTime = performance.now()
  function step(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = Math.round(start + diff * eased)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
