import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  Briefcase,
  Building2,
  ChartNoAxesColumn,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Send,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { initials } from '../lib/format';
import type { Role } from '../lib/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const STUDENT_NAV: NavItem[] = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/profile', label: 'My profile', icon: User },
  { to: '/student/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/student/internships', label: 'Internships', icon: GraduationCap },
  { to: '/student/applications', label: 'Applications', icon: Send },
  { to: '/student/skills', label: 'Skills', icon: Sparkles },
  { to: '/student/assessments', label: 'Assessments', icon: ListChecks },
  { to: '/student/certificates', label: 'Certificates', icon: Award },
  { to: '/student/resume', label: 'Resume', icon: FileText },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
];

const COMPANY_NAV: NavItem[] = [
  { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/company/profile', label: 'Company profile', icon: Building2 },
  { to: '/company/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/company/internships', label: 'Internships', icon: GraduationCap },
  { to: '/company/applications', label: 'Applicants', icon: ClipboardList },
  { to: '/company/notifications', label: 'Notifications', icon: Bell },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/internships', label: 'Internships', icon: GraduationCap },
  { to: '/admin/applications', label: 'Applications', icon: Send },
  { to: '/admin/skills', label: 'Skills', icon: Sparkles },
  { to: '/admin/assessments', label: 'Assessments', icon: ListChecks },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartNoAxesColumn },
];

function navFor(role: Role): NavItem[] {
  if (role === 'STUDENT') return STUDENT_NAV;
  if (role === 'COMPANY') return COMPANY_NAV;
  return ADMIN_NAV;
}

function roleLabel(role: Role): string {
  if (role === 'STUDENT') return 'Student';
  if (role === 'COMPANY') return 'Recruiter';
  return 'College administrator';
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get<{ count: number }>('/notifications/unread-count');
        if (!cancelled) setUnread(data.count ?? 0);
      } catch {
        // A failed badge refresh should never break the page.
      }
    };
    void load();
    const timer = window.setInterval(load, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [location.pathname]);

  if (!user) return null;
  const items = navFor(user.role);
  const notificationsPath =
    user.role === 'COMPANY' ? '/company/notifications' : user.role === 'STUDENT' ? '/student/notifications' : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand-600 text-sm text-white">CH</span>
            CareerHub
          </Link>
          <button type="button" className="btn-ghost px-2 py-1 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <button type="button" className="btn-ghost px-2 py-1 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">{roleLabel(user.role)} workspace</div>
          <div className="flex items-center gap-3">
            {notificationsPath && (
              <Link to={notificationsPath} className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                {initials(user.displayName || user.email)}
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight text-slate-800">{user.displayName || user.email}</p>
                <p className="text-xs leading-tight text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary px-3 py-1.5"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
