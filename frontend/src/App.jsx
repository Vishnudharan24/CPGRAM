import { useEffect, useMemo, useState } from 'react'
import { FileText, LayoutDashboard, LogIn, ShieldCheck } from 'lucide-react'
import { api, clearSession, getToken, getUser } from './api/client.js'
import Header from './components/layout/Header.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import IntakeWizard from './pages/IntakeWizard.jsx'
import Dashboard from './pages/Dashboard.jsx'
import GrievanceDetail from './pages/GrievanceDetail.jsx'
import OfficerConsole from './pages/OfficerConsole.jsx'

const routes = {
  '/': Landing,
  '/login': Login,
  '/file': IntakeWizard,
  '/dashboard': Dashboard,
  '/officer': OfficerConsole
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [sessionTick, setSessionTick] = useState(0)
  const user = useMemo(() => getUser(), [sessionTick])

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function navigate(nextPath) {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  function onLogout() {
    clearSession()
    setSessionTick((value) => value + 1)
    navigate('/')
  }

  function onLogin() {
    setSessionTick((value) => value + 1)
    navigate('/dashboard')
  }

  const detailMatch = path.match(/^\/grievances\/(.+)$/)
  const Page = routes[path] || Landing
  const authed = Boolean(getToken())

  return (
    <>
      <Header user={user} navigate={navigate} onLogout={onLogout} />
      <main>
        {!authed && path !== '/' && path !== '/login' ? (
          <Login navigate={navigate} onLogin={onLogin} />
        ) : detailMatch ? (
          <GrievanceDetail id={detailMatch[1]} navigate={navigate} />
        ) : (
          <Page navigate={navigate} onLogin={onLogin} />
        )}
      </main>
      <nav className="mobile-nav" aria-label="Primary">
        <button onClick={() => navigate('/file')}><FileText size={18} />File</button>
        <button onClick={() => navigate('/dashboard')}><LayoutDashboard size={18} />Track</button>
        <button onClick={() => navigate('/officer')}><ShieldCheck size={18} />Officer</button>
        <button onClick={() => navigate('/login')}><LogIn size={18} />Login</button>
      </nav>
    </>
  )
}
