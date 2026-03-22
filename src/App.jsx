import { AuthProvider, useAuth } from './contexts/AuthContext'
import IconSprite from './components/IconSprite'
import AuthScreen from './components/AuthScreen'
import DashboardApp from './components/DashboardApp'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', color: 'var(--muted-fg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--gradient-accent-chrome)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 28px var(--accent-glow)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5Z" fill="#000" opacity="0.9"/>
              <path d="M2 17l10 5 10-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
              <path d="M2 12l10 5 10-5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.72"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)' }}>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <DashboardApp />
}

export default function App() {
  return (
    <AuthProvider>
      <IconSprite />
      <AppContent />
      <div className="toast-container" id="toastContainer"></div>
    </AuthProvider>
  )
}
