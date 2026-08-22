import { FilePlus2, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react'

export default function Header({ user, navigate, onLogout }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate('/')}>
        <span className="mark">CP</span>
        <span>
          <strong>Guided Grievance Router</strong>
          <small>Mock CPGRAMS improvement prototype</small>
        </span>
      </button>
      <div className="top-actions">
        <button title="Lodge grievance" onClick={() => navigate('/file')}><FilePlus2 size={18} />Lodge</button>
        <button title="View status" onClick={() => navigate('/dashboard')}><LayoutDashboard size={18} />Status</button>
        <button title="Officer console" onClick={() => navigate('/officer')}><ShieldCheck size={18} />Officer</button>
        {user ? (
          <button title="Logout" onClick={onLogout}><LogOut size={18} />{user.name.split(' ')[0]}</button>
        ) : (
          <button onClick={() => navigate('/login')}>Login</button>
        )}
      </div>
    </header>
  )
}
