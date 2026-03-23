import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { SvgIcon } from './IconSprite'
import { AGENTS as AGENTS_CONST, CRON_JOBS as CRON_JOBS_CONST, GATEWAY_URL, HUES, BUILTIN_OUTPUT_ARTIFACTS } from '../lib/constants'
import { supabase, SUPABASE_URL, SUPABASE_KEY, sbHeaders } from '../lib/supabase'
import { loadHue, saveHue, loadLocalJobs, saveLocalJobs, loadTrackers, saveTrackers, loadTrackerArticles, saveTrackerArticles, loadSavedArticles, saveSavedArticles, loadNotifications, saveNotifications, getCancelledJobs, saveCancelledJobs, getDismissedCronJobIds, saveDismissedCronJobIds, getTrash, saveTrash, getDispatchedCatchups, saveDispatchedCatchups } from '../lib/storage'
import { escapeHtml, getTimeAgo, truncate, fmtDate, isToday, isTomorrow, cronToHuman, cronMatchesDate, cronHour, cronMinute, estimateNextRun, getJobDatesForMonth, to24Hour, animateCounter, getLastScheduledBefore, fmtRunDate } from '../lib/utils'

import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import Topbar from './Topbar'
import DashboardPage from '../pages/DashboardPage'
import CalendarPage from '../pages/CalendarPage'
import JobsPage from '../pages/JobsPage'
import TasksPage from '../pages/TasksPage'
import TrackerPage from '../pages/TrackerPage'
import AgentsPage from '../pages/AgentsPage'
import TrashPage from '../pages/TrashPage'
import DocumentViewer from '../pages/DocumentViewer'
import AddJobModal from './modals/AddJobModal'
import EditJobModal from './modals/EditJobModal'
import JobDetailModal from './modals/JobDetailModal'
import EditTaskModal from './modals/EditTaskModal'
import TrackerModal from './modals/TrackerModal'

export default function DashboardApp() {
  const { user, signOut } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [hue, setHue] = useState(loadHue())
  const [gatewayOnline, setGatewayOnline] = useState(null)
  const [agents, setAgents] = useState({ ...AGENTS_CONST })
  const [cronJobs, setCronJobs] = useState(() => CRON_JOBS_CONST.map(j => ({ ...j })))
  const [dbTasks, setDbTasks] = useState([])
  const [notifications, setNotifications] = useState(loadNotifications())
  const [toasts, setToasts] = useState([])

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailModalJob, setDetailModalJob] = useState(null)
  const [detailModalTask, setDetailModalTask] = useState(null)
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editJobModalOpen, setEditJobModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [trackerModalOpen, setTrackerModalOpen] = useState(false)
  const [editingTrackerId, setEditingTrackerId] = useState(null)

  // Document viewer
  const [docPage, setDocPage] = useState(null) // { filename, title, returnPage }

  // Output artifacts
  const [outputArtifacts, setOutputArtifacts] = useState({ tasks: [...BUILTIN_OUTPUT_ARTIFACTS.tasks] })

  // Apply hue to document
  useEffect(() => {
    document.documentElement.dataset.hue = hue
  }, [hue])

  const changeHue = useCallback((h) => {
    setHue(h)
    saveHue(h)
  }, [])

  // Toast helper
  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4300)
  }, [])

  // Notification helper
  const addNotification = useCallback((type, title, body, action) => {
    setNotifications(prev => {
      const next = [{ id: 'n-' + Date.now().toString(36), type, title, body: body || '', action: action || null, time: Date.now(), read: false }, ...prev].slice(0, 50)
      saveNotifications(next)
      return next
    })
  }, [])

  // Get all jobs (cron + local)
  const getAllJobs = useCallback(() => {
    return [...cronJobs.filter(j => !j._deleted), ...loadLocalJobs()]
  }, [cronJobs])

  // Load tasks from Supabase
  const loadTasksFromDB = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=*&order=created_at.desc`, { headers: sbHeaders })
      if (res.ok) {
        const rows = await res.json()
        return rows.map(r => ({
          id: r.id, name: r.name, agent: r.agent, status: r.status, type: r.type,
          description: r.description, createdAt: r.created_at, updatedAt: r.updated_at,
          completedAt: r.completed_at, color: r.color, schedule: r.schedule, error: r.error,
          links: r.links || [], documents: r.documents || [], attachments: r.attachments || [],
          progress: r.progress, bookmarked: r.bookmarked || false, fromDB: true
        }))
      }
    } catch (e) { console.warn('Supabase fetch failed:', e) }
    return null
  }, [])

  // Initial load
  useEffect(() => {
    // Apply cancelled/deleted state to cron jobs
    const cancelled = getCancelledJobs()
    const trash = getTrash()
    const deletedCronIds = new Set(trash.filter(t => t._trashType === 'cron-job').map(t => t.id))
    setCronJobs(prev => prev.map(j => {
      if (cancelled.includes(j.id)) {
        return { ...j, enabled: false, status: 'disabled', _deleted: deletedCronIds.has(j.id) }
      }
      return j
    }))

    // Purge old trash
    const trashItems = getTrash()
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const remaining = trashItems.filter(t => t.deletedAt > cutoff)
    if (remaining.length !== trashItems.length) saveTrash(remaining)

    // Load tasks, then purge any completed/error tasks older than 30 days (unless bookmarked)
    loadTasksFromDB().then(async tasks => {
      if (!tasks) return
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      const toDelete = tasks.filter(t =>
        !t.bookmarked && ['completed', 'error'].includes(t.status) && (t.createdAt || 0) < cutoff
      )
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(t =>
          fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(t.id)}`, { method: 'DELETE', headers: sbHeaders })
            .catch(() => {})
        ))
        setDbTasks(tasks.filter(t => !toDelete.some(d => d.id === t.id)))
      } else {
        setDbTasks(tasks)
      }
    })

    // Sync trackers from Supabase — Supabase is authoritative
    if (user?.id) {
      supabase.from('trackers').select('*').eq('user_id', user.id).then(({ data, error }) => {
        if (error || !data) return
        const remoteIds = new Set(data.map(r => r.id))
        const local = loadTrackers()
        const localOnly = local.filter(t => !remoteIds.has(t.id))
        const remote = data.map(row => ({
          id: row.id, name: row.name, keywords: row.keywords || [],
          color: row.color || '#b9a9ff', createdAt: row.created_at,
          updatedAt: row.updated_at, lastFetched: row.last_fetched
        }))
        saveTrackers([...remote, ...localOnly])
      })
    }

    // Load output artifacts
    fetch('./output/artifacts.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(ext => {
        if (ext?.tasks) {
          setOutputArtifacts(prev => {
            const seen = new Set(prev.tasks.map(r => JSON.stringify(r)))
            const merged = [...prev.tasks]
            for (const row of ext.tasks) {
              const s = JSON.stringify(row)
              if (!seen.has(s)) { merged.push(row); seen.add(s) }
            }
            return { tasks: merged }
          })
        }
      })
      .catch(() => {})
  }, [loadTasksFromDB])

  // Gateway health check
  useEffect(() => {
    let prevOnline = null
    const check = async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 4000)
        await fetch(GATEWAY_URL, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
        clearTimeout(timeout)
        if (prevOnline === false) addNotification('success', 'Gateway Online', 'Connection to OpenClaw gateway restored')
        prevOnline = true
        setGatewayOnline(true)
      } catch {
        if (prevOnline === true) addNotification('error', 'Gateway Offline', 'Lost connection to OpenClaw gateway')
        prevOnline = false
        setGatewayOnline(false)
      }
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [addNotification])

  // Catchup: when gateway comes online, dispatch any recurring jobs missed within the last 3 hours
  useEffect(() => {
    if (!gatewayOnline) return

    const now = Date.now()
    const dispatched = getDispatchedCatchups()
    const missed = []

    for (const job of cronJobs) {
      if (!job.enabled || !job.cron || job._deleted) continue
      const lastScheduled = getLastScheduledBefore(job.cron, now, 3 * 60 * 60 * 1000)
      if (!lastScheduled) continue
      if (lastScheduled <= (job.lastRun || 0)) continue  // already ran on schedule

      const dateStr = fmtRunDate(lastScheduled)
      const alreadyDispatched = dispatched.some(d => d.jobId === job.id && d.dateStr === dateStr)
      if (alreadyDispatched) continue

      missed.push({ job, lastScheduled, dateStr })
    }

    if (missed.length === 0) return

    ;(async () => {
      for (const { job, lastScheduled, dateStr } of missed) {
        const datedName = `${job.name} ${dateStr}`
        const taskId = 'catchup-' + Date.now().toString(36) + '-' + job.id.slice(0, 8)
        await postJobQueue(taskId, job.agent, datedName, job.message)
        dispatched.push({ jobId: job.id, dateStr, ts: now })
      }
      saveDispatchedCatchups(dispatched)
      const label = missed.map(m => m.job.name).join(', ')
      toast(`Dispatched ${missed.length} missed job${missed.length > 1 ? 's' : ''}: ${label}`, 'success')
      addNotification('info', 'Catchup Jobs Queued', `${missed.length} job${missed.length > 1 ? 's' : ''} missed while gateway was offline: ${label}`)
    })()
  }, [gatewayOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update agent status based on task activity
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=agent,updated_at&order=updated_at.desc&limit=20`, { headers: sbHeaders })
        if (!res.ok) return
        const tasks = await res.json()
        setAgents(prev => {
          const next = { ...prev }
          for (const [id, agent] of Object.entries(next)) {
            const latest = tasks.find(t => t.agent === id)
            if (latest?.updated_at) {
              const minsAgo = (Date.now() - latest.updated_at) / 60000
              next[id] = {
                ...agent,
                lastActive: latest.updated_at,
                status: gatewayOnline === false ? 'offline' : minsAgo < 30 ? 'online' : 'idle'
              }
            } else {
              next[id] = { ...agent, status: gatewayOnline ? 'idle' : 'offline' }
            }
          }
          return next
        })
      } catch {
        setAgents(prev => {
          const next = { ...prev }
          for (const id of Object.keys(next)) {
            next[id] = { ...next[id], status: gatewayOnline ? 'idle' : 'offline' }
          }
          return next
        })
      }
    }
    updateStatus()
    const interval = setInterval(updateStatus, 15000)
    return () => clearInterval(interval)
  }, [gatewayOnline])

  // Auto-refresh tasks from Supabase every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      const tasks = await loadTasksFromDB()
      if (tasks) {
        setDbTasks(prev => {
          // Detect status changes for notifications
          const prevMap = {}
          prev.forEach(t => { prevMap[t.id] = t.status })
          for (const task of tasks) {
            const prevStatus = prevMap[task.id]
            if (!prevStatus) {
              const agent = agents[task.agent] || { name: 'Unknown' }
              addNotification('info', 'New Task', `"${task.name}" created for ${agent.name}`, { page: 'tasks' })
            } else if (prevStatus === 'running' && task.status === 'completed') {
              const agent = agents[task.agent] || { name: 'Unknown' }
              addNotification('success', 'Task Completed', `${agent.name} finished "${task.name}"`, { page: 'tasks' })
            } else if (prevStatus !== 'error' && task.status === 'error') {
              addNotification('error', 'Task Error', `"${task.name}" encountered an error`, { page: 'tasks' })
            } else if (prevStatus === 'queued' && task.status === 'running') {
              const agent = agents[task.agent] || { name: 'Unknown' }
              addNotification('warning', 'Task Started', `${agent.name} picked up "${task.name}"`, { page: 'tasks' })
            }
          }
          return tasks
        })
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [loadTasksFromDB, agents, addNotification])

  // Merge task documents with output artifacts
  const mergeTaskDocuments = useCallback((task) => {
    const fromDb = task.documents || []
    const seen = new Set(fromDb.map(d => d?.name?.trim()).filter(Boolean))
    const merged = fromDb.filter(d => d?.name).map(d => ({ name: d.name }))
    const tn = (task.name || '').trim().toLowerCase()
    if (!tn) return merged
    for (const row of outputArtifacts.tasks || []) {
      const hit = (row.matchNames || []).some(n => (n || '').trim().toLowerCase() === tn)
      if (!hit) continue
      for (const f of row.files || []) {
        const name = (f || '').trim()
        if (name && !seen.has(name)) { merged.push({ name }); seen.add(name) }
      }
    }
    return merged
  }, [outputArtifacts])

  // Get all tasks (DB + synthetic cron tasks)
  const getAllTasks = useCallback(() => {
    const dismissedCron = new Set(getDismissedCronJobIds())
    const allJobs = getAllJobs()
    const todayStr = fmtRunDate(Date.now())
    const cronTasks = allJobs
      .filter(j => {
        if (j.isLocal) return false
        if (dismissedCron.has(j.id)) return false
        // Suppress synthetic task if there's already a DB task for this job today
        // (matched by exact name OR dated variant "Job Name MM/DD/YY")
        return !dbTasks.some(t => t.agent === j.agent && (
          t.name === j.name || t.name === `${j.name} ${todayStr}`
        ))
      })
      .map(j => {
        const agent = agents[j.agent] || { name: 'Unknown', initial: '?', color: '#666' }
        let status = 'queued'
        if (j.status === 'error') status = 'error'
        else if (j.lastRun) status = 'completed'
        return {
          id: 'cron-' + j.id, name: j.name, agent: j.agent, status,
          type: j.isOneTime ? 'one-time' : 'recurring', description: j.message,
          createdAt: j.lastRun || Date.now(), updatedAt: j.lastRun || Date.now(),
          completedAt: j.lastRun && j.status !== 'error' ? j.lastRun : null,
          color: j.color || agent.color, schedule: j.cron ? cronToHuman(j.cron) : (j.isOneTime ? 'One-time task' : ''),
          error: j.lastError, links: [], documents: [], progress: j.status === 'error' ? 50 : (j.lastRun ? 100 : 0),
          fromCron: true
        }
      })
    return [...dbTasks, ...cronTasks]
  }, [dbTasks, getAllJobs, agents])

  // DB operations
  const dbInsertTask = useCallback(async (task) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
        method: 'POST', headers: sbHeaders,
        body: JSON.stringify({
          id: task.id, name: task.name, agent: task.agent, status: task.status,
          type: task.type, description: task.description, created_at: task.createdAt,
          updated_at: task.updatedAt, completed_at: task.completedAt, color: task.color,
          schedule: task.schedule || '', error: task.error, links: task.links || [],
          documents: task.documents || [], attachments: task.attachments || [], progress: task.progress || 0
        })
      })
    } catch (e) { console.warn('Supabase insert failed:', e) }
  }, [])

  const dbUpdateTask = useCallback(async (id, updates) => {
    const snaked = {}
    if ('status' in updates) snaked.status = updates.status
    if ('progress' in updates) snaked.progress = updates.progress
    if ('updatedAt' in updates) snaked.updated_at = updates.updatedAt
    if ('completedAt' in updates) snaked.completed_at = updates.completedAt
    if ('error' in updates) snaked.error = updates.error
    if ('attachments' in updates) snaked.attachments = updates.attachments
    if ('bookmarked' in updates) snaked.bookmarked = updates.bookmarked
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: sbHeaders, body: JSON.stringify(snaked)
      })
    } catch (e) { console.warn('Supabase update failed:', e) }
  }, [])

  const dbDeleteTask = useCallback(async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: sbHeaders })
    } catch (e) { console.warn('Supabase delete failed:', e) }
  }, [])

  const postJobQueue = useCallback(async (taskId, agent, name, message) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/job_queue`, {
        method: 'POST', headers: sbHeaders,
        body: JSON.stringify({ id: 'run-' + Date.now().toString(36), task_id: taskId, agent, name, message: message || '', status: 'pending', created_at: Date.now() })
      })
    } catch (e) { console.warn('Job queue insert failed:', e) }
  }, [])

  // Show page
  const showPage = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  // View document
  const viewDocument = useCallback((filename, title) => {
    setDocPage({ filename, title, returnPage: currentPage })
    setCurrentPage('document')
  }, [currentPage])

  // Shared context for all pages
  const ctx = {
    currentPage, showPage, hue, changeHue, gatewayOnline,
    agents, cronJobs, setCronJobs, dbTasks, setDbTasks,
    notifications, setNotifications, addNotification,
    toast, getAllJobs, getAllTasks, mergeTaskDocuments,
    dbInsertTask, dbUpdateTask, dbDeleteTask, postJobQueue, loadTasksFromDB,
    user, signOut, viewDocument, docPage, setDocPage,
    addModalOpen, setAddModalOpen,
    detailModalOpen, setDetailModalOpen, detailModalJob, setDetailModalJob,
    detailModalTask, setDetailModalTask,
    editJobModalOpen, setEditJobModalOpen, editingJob, setEditingJob,
    editTaskModalOpen, setEditTaskModalOpen, editingTask, setEditingTask,
    trackerModalOpen, setTrackerModalOpen, editingTrackerId, setEditingTrackerId,
    outputArtifacts
  }

  const pageLabels = {
    dashboard: '/ Dashboard', calendar: '/ Calendar', jobs: '/ Jobs',
    tasks: '/ Task History', agents: '/ Agents', tracker: '/ Tracker',
    trash: '/ Trash', document: '/ Document'
  }

  return (
    <>
      <div className="app">
        <Sidebar currentPage={currentPage} showPage={showPage} />
        <MobileNav currentPage={currentPage} showPage={showPage} />
        <Topbar
          breadcrumb={pageLabels[currentPage] || ''}
          showPage={showPage}
          hue={hue}
          changeHue={changeHue}
          gatewayOnline={gatewayOnline}
          notifications={notifications}
          setNotifications={setNotifications}
          user={user}
          signOut={signOut}
        />

        <main className="main" id="mainContent">
          {currentPage === 'dashboard' && <DashboardPage ctx={ctx} />}
          {currentPage === 'calendar' && <CalendarPage ctx={ctx} />}
          {currentPage === 'jobs' && <JobsPage ctx={ctx} />}
          {currentPage === 'tasks' && <TasksPage ctx={ctx} />}
          {currentPage === 'tracker' && <TrackerPage ctx={ctx} />}
          {currentPage === 'agents' && <AgentsPage ctx={ctx} />}
          {currentPage === 'trash' && <TrashPage ctx={ctx} />}
          {currentPage === 'document' && <DocumentViewer ctx={ctx} />}
        </main>
      </div>

      {/* Modals */}
      {addModalOpen && <AddJobModal ctx={ctx} />}
      {editJobModalOpen && <EditJobModal ctx={ctx} />}
      {detailModalOpen && <JobDetailModal ctx={ctx} />}
      {editTaskModalOpen && <EditTaskModal ctx={ctx} />}
      {trackerModalOpen && <TrackerModal ctx={ctx} />}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <SvgIcon id={t.type === 'success' ? 'ico-check-circle' : t.type === 'error' ? 'ico-alert' : 'ico-bolt'} size={16} />
            {t.msg}
          </div>
        ))}
      </div>
    </>
  )
}
