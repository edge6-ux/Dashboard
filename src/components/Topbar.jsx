import { useState, useEffect, useRef } from 'react'
import { SvgIcon } from './IconSprite'
import { HUES } from '../lib/constants'
import { getTimeAgo } from '../lib/utils'
import { saveNotifications } from '../lib/storage'

export default function Topbar({ breadcrumb, showPage, hue, changeHue, gatewayOnline, notifications, setNotifications, user, signOut }) {
  const [clock, setClock] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'America/New_York' }) + ' ET')
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const openNotifPanel = () => {
    setNotifOpen(!notifOpen)
    if (!notifOpen) {
      // Mark all as read
      const updated = notifications.map(n => ({ ...n, read: true }))
      setNotifications(updated)
      saveNotifications(updated)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
    saveNotifications([])
  }

  const gatewayClass = gatewayOnline === null ? 'checking' : gatewayOnline ? '' : 'offline'
  const gatewayLabel = gatewayOnline === null ? 'Checking...' : gatewayOnline ? 'Gateway Online' : 'Gateway Offline'
  const initial = user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="topbar">
      <span className="topbar-title" onClick={() => showPage('dashboard')} style={{ cursor: 'pointer' }}>
        <span className="topbar-title-glow">Command Center</span>
        Command Center
      </span>
      <span className="topbar-breadcrumb">{breadcrumb}</span>

      <div className="topbar-right">
        <div className="theme-hue-picker" role="group" aria-label="Accent color">
          {HUES.map(h => (
            <button
              key={h}
              type="button"
              className={`theme-hue-btn ${hue === h ? 'active' : ''}`}
              data-hue={h}
              title={h.charAt(0).toUpperCase() + h.slice(1)}
              aria-label={`${h} accent`}
              onClick={() => changeHue(h)}
            />
          ))}
        </div>
        <div className="topbar-clock">{clock}</div>
        <div className={`topbar-status ${gatewayClass}`}>
          <div
            className="topbar-dot"
            style={gatewayOnline === false ? {
              background: 'var(--danger)',
              boxShadow: '0 0 8px var(--danger)',
              animation: 'none'
            } : gatewayOnline === null ? {
              background: 'var(--warn)',
              boxShadow: '0 0 8px var(--warn)',
              animation: 'none'
            } : {}}
          />
          <span>{gatewayLabel}</span>
        </div>

        <div className="notif-wrapper" ref={notifRef} style={{ position: 'relative' }}>
          <button className="notif-btn" onClick={openNotifPanel} aria-label="Notifications">
            <svg className="svg-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <div className={`notif-panel ${notifOpen ? 'open' : ''}`}>
            <div className="notif-header">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>Notifications</span>
              <button className="btn btn-sm" onClick={clearNotifications} style={{ padding: '3px 8px', fontSize: 10 }}>Clear All</button>
            </div>
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted-fg)', fontSize: 12 }}>No notifications</div>
              ) : notifications.slice(0, 20).map(n => {
                const icons = { success: 'ico-check-circle', error: 'ico-alert', info: 'ico-bolt', warning: 'ico-clock' }
                return (
                  <div
                    key={n.id}
                    className="notif-item"
                    onClick={() => {
                      if (n.action?.page) { showPage(n.action.page); setNotifOpen(false) }
                    }}
                  >
                    <div className={`notif-icon ${n.type}`}>
                      <SvgIcon id={icons[n.type] || 'ico-bolt'} size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="notif-text"><strong>{n.title}</strong>{n.body ? ' — ' + n.body : ''}</div>
                      <div className="notif-time">{getTimeAgo(n.time)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div
          className="topbar-avatar"
          title={user?.email || ''}
          onClick={() => {
            if (window.confirm('Sign out of ' + (user?.email || 'your account') + '?')) signOut()
          }}
        >
          {initial}
        </div>
      </div>
    </header>
  )
}
