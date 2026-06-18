import { NavLink, Outlet } from 'react-router-dom';
import { useAuthSession } from '../../../app/providers/AuthProvider';
import { Button } from '../ui/button';

export function AppLayout() {
  const { user, logout } = useAuthSession();

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-xl border border-[var(--border)] bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Editorial Verification Workspace</p>
            <h1 className="text-2xl font-bold text-slate-900">IA Detector</h1>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-md border border-slate-200 p-1">
              <NavLink
                to="/app"
                end
                className={({ isActive }) =>
                  `rounded px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-[var(--primary)] text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Verify
              </NavLink>
              <NavLink
                to="/app/history"
                className={({ isActive }) =>
                  `rounded px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-[var(--primary)] text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                History
              </NavLink>
            </nav>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.name ?? 'Journalist'}</p>
              <p className="text-xs text-slate-500">{user?.email ?? 'No active session'}</p>
            </div>
            <Button variant="secondary" onClick={() => void logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
