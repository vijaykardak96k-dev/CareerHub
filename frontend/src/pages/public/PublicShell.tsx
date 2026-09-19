import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { homeRouteFor, useAuth } from '../../context/AuthContext';

/** Header and footer shared by the public job and internship boards. */
export function PublicShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 text-sm text-white">CH</span>
            CareerHub
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/jobs" className="btn-ghost">
              Jobs
            </Link>
            <Link to="/internships" className="btn-ghost">
              Internships
            </Link>
            {user ? (
              <Link to={homeRouteFor(user.role)} className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <p className="mx-auto max-w-6xl px-4 text-sm text-slate-500">
          CareerHub - Student Career, Internship &amp; Skill Management System
        </p>
      </footer>
    </div>
  );
}
