export default function IconSprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" id="app-icon-sprite" style={{position:'absolute',width:0,height:0,overflow:'hidden'}} aria-hidden="true">
      <defs>
        <symbol id="ico-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/></symbol>
        <symbol id="ico-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.5"/></symbol>
        <symbol id="ico-layers" viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m8.75 12.25 2.25 2.25 4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-cpu" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M22 9v2M22 15v2M2 9v2M2 15v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-chat" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.08-3.37 7.4-7.5 7.4-1.17 0-2.28-.26-3.27-.73L4 21l1.92-4.38A7.35 7.35 0 013.5 12C3.5 7.92 6.87 4.6 11 4.6S18.5 7.92 18.5 12 15.13 19.4 11 19.4Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-clipboard" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4a2 2 0 012 2v13a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h4l1-2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 12h6M9 16h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-refresh" viewBox="0 0 24 24"><path d="M4 12a8 8 0 0113.657-5.657L18 6M20 12a8 8 0 01-13.657 5.657L6 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18 6v4h-4M6 18v-4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-alert" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10.3 4.2h3.4l8.3 14.6H2l8.3-14.6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-plus-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-rocket" viewBox="0 0 24 24"><path d="M6 15c-2-3-2-7-2-7s4 0 7 2l3-3c.5-.5 1.5-.3 2.2.4l2.1 2.1c.7.7.9 1.7.4 2.2l-3 3c2 3 2 7 2 7s-4 0-7-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 18 6 21M14 13l-2 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-save" viewBox="0 0 24 24"><path d="M5 3h11l3 3v15H5V3Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 3v8h8V3M7 21v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-pencil" viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 000-3L17 4a2.1 2.1 0 00-3 0L4 14v6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M13 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-trash" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7-11-7Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-pause" viewBox="0 0 24 24"><path d="M7 5v14M17 5v14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 010-7l1-1a5 5 0 017 7l-1 1M14 11a5 5 0 010 7l-1 1a5 5 0 01-7-7l1-1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-file" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 2v6h6M10 13h4M10 17h8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-printer" viewBox="0 0 24 24"><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 9V3h12v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><rect x="6" y="14" width="12" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/></symbol>
        <symbol id="ico-bulb" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a5 5 0 00-3 9c.6.6 1 1.4 1 2.3V15h4v-1.7c0-.9.4-1.7 1-2.3a5 5 0 00-3-9Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-party" viewBox="0 0 24 24"><path d="M7 21 3 3l15 4-6 4-5 10Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12.5 11.5 19 5M8.5 14.5 11 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-arrow-down-tray" viewBox="0 0 24 24"><path d="M12 4v12m-4-4 4 4 4-4M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-rss" viewBox="0 0 24 24"><path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/></symbol>
        <symbol id="ico-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m16.5 16.5 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-external" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14 21 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-tag" viewBox="0 0 24 24"><path d="M3 6.5V12l9 9 6.5-6.5-9-9H3ZM7 10a1 1 0 100-2 1 1 0 000 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-bookmark" viewBox="0 0 24 24"><path d="M5 3h14a1 1 0 011 1v16.5a.5.5 0 01-.75.43L12 17l-7.25 3.93A.5.5 0 014 20.5V4a1 1 0 011-1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-bookmark-fill" viewBox="0 0 24 24"><path d="M5 3h14a1 1 0 011 1v16.5a.5.5 0 01-.75.43L12 17l-7.25 3.93A.5.5 0 014 20.5V4a1 1 0 011-1Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-sort" viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
      </defs>
    </svg>
  )
}

// Helper component for using SVG icons
export function SvgIcon({ id, size = 18, className = '' }) {
  return (
    <svg
      className={`svg-ico ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <use href={`#${id}`} />
    </svg>
  )
}
