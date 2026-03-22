import { SvgIcon } from './IconSprite'

const MOBILE_ITEMS = [
  { page: 'dashboard', icon: 'ico-grid', label: 'Home' },
  { page: 'tasks', icon: 'ico-check-circle', label: 'Tasks' },
  { page: 'tracker', icon: 'ico-rss', label: 'Tracker' },
  { page: 'jobs', icon: 'ico-layers', label: 'Jobs' },
  { page: 'agents', icon: 'ico-cpu', label: 'Agents' },
]

export default function MobileNav({ currentPage, showPage }) {
  return (
    <div className="mobile-nav" id="mobileNav">
      {MOBILE_ITEMS.map(item => (
        <button
          key={item.page}
          className={`mobile-nav-btn ${currentPage === item.page ? 'active' : ''}`}
          onClick={() => showPage(item.page)}
        >
          <SvgIcon id={item.icon} size={20} />
          {item.label}
        </button>
      ))}
    </div>
  )
}
