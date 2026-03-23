import { SvgIcon } from './IconSprite'

const NAV_ITEMS = [
  { page: 'dashboard', icon: 'ico-grid', label: 'Dashboard' },
  { page: 'calendar', icon: 'ico-calendar', label: 'Calendar' },
  { page: 'jobs', icon: 'ico-layers', label: 'Jobs' },
  { page: 'tasks', icon: 'ico-check-circle', label: 'Tasks' },
  { page: 'agents', icon: 'ico-cpu', label: 'Agents' },
  { page: 'tracker', icon: 'ico-rss', label: 'Tracker' },
]

export default function Sidebar({ currentPage, showPage }) {
  return (
    <nav className="rail">
      <div
        className="rail-logo"
        onClick={() => showPage('dashboard')}
        role="button"
        tabIndex={0}
        aria-label="Mission Control home"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPage('dashboard') } }}
      >
        <svg className="rail-logo-mark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5Z" fill="#000000" opacity="0.92"/>
          <path d="M2 17l10 5 10-5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
          <path d="M2 12l10 5 10-5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.72"/>
        </svg>
      </div>

      {NAV_ITEMS.map(item => (
        <button
          key={item.page}
          className={`rail-btn ${currentPage === item.page ? 'active' : ''}`}
          data-page={item.page}
          onClick={() => showPage(item.page)}
          aria-label={item.label}
        >
          <SvgIcon id={item.icon} size={21} />
          <span className="rail-tooltip">{item.label}</span>
        </button>
      ))}

      <div className="rail-spacer" />

      <button
        className={`rail-btn ${currentPage === 'trash' ? 'active' : ''}`}
        onClick={() => showPage('trash')}
        aria-label="Trash"
      >
        <SvgIcon id="ico-trash" size={21} />
        <span className="rail-tooltip">Trash</span>
      </button>
    </nav>
  )
}
