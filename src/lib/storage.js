// ═══════════════════════════════════════════════
//  User-Scoped localStorage
// ═══════════════════════════════════════════════

let _userId = null

export function setStorageUserId(id) {
  _userId = id
}

function userKey(key) {
  return _userId ? `${key}:${_userId}` : key
}

// Local Jobs
export function loadLocalJobs() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-custom-jobs')) || '[]') } catch { return [] }
}
export function saveLocalJobs(jobs) {
  localStorage.setItem(userKey('mc-custom-jobs'), JSON.stringify(jobs))
}

// Trackers
export function loadTrackers() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-trackers')) || '[]') } catch { return [] }
}
export function saveTrackers(trackers) {
  localStorage.setItem(userKey('mc-trackers'), JSON.stringify(trackers))
}

// Tracker Articles
export function loadTrackerArticles() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-tracker-articles')) || '{}') } catch { return {} }
}
export function saveTrackerArticles(articles) {
  localStorage.setItem(userKey('mc-tracker-articles'), JSON.stringify(articles))
}

// Saved Articles
export function loadSavedArticles() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-saved-articles')) || '[]') } catch { return [] }
}
export function saveSavedArticles(articles) {
  localStorage.setItem(userKey('mc-saved-articles'), JSON.stringify(articles))
}

// Notifications
const NOTIF_MAX = 50
export function loadNotifications() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-notifications')) || '[]') } catch { return [] }
}
export function saveNotifications(notifs) {
  localStorage.setItem(userKey('mc-notifications'), JSON.stringify(notifs.slice(0, NOTIF_MAX)))
}

// Cancelled Jobs
export function getCancelledJobs() {
  try {
    const raw = localStorage.getItem(userKey('mc-cancelled-jobs'))
    const a = raw ? JSON.parse(raw) : []
    return Array.isArray(a) ? a : []
  } catch { return [] }
}
export function saveCancelledJobs(ids) {
  localStorage.setItem(userKey('mc-cancelled-jobs'), JSON.stringify(ids))
}

// Dismissed Cron Job IDs
export function getDismissedCronJobIds() {
  try {
    const raw = localStorage.getItem(userKey('mc-dismissed-cron-job-ids'))
    const a = raw ? JSON.parse(raw) : []
    return Array.isArray(a) ? a : []
  } catch { return [] }
}
export function saveDismissedCronJobIds(ids) {
  localStorage.setItem(userKey('mc-dismissed-cron-job-ids'), JSON.stringify(ids))
}

// Trash
export function getTrash() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-trash')) || '[]') } catch { return [] }
}
export function saveTrash(items) {
  localStorage.setItem(userKey('mc-trash'), JSON.stringify(items))
}

// Theme hue
export function loadHue() {
  const key = 'mc-ui-hue'
  const allowed = new Set(['purple', 'red', 'blue', 'orange', 'pink', 'green', 'white', 'yellow'])
  const saved = localStorage.getItem(key)
  return (saved && allowed.has(saved)) ? saved : 'purple'
}
export function saveHue(hue) {
  localStorage.setItem('mc-ui-hue', hue)
}
