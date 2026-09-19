import { Link } from 'react-router-dom';
import { Award, Briefcase, Building2, GraduationCap, LineChart, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth, homeRouteFor } from '../../context/AuthContext';

const FEATURES = [
  {
    icon: Briefcase,
    title: 'One place for every opening',
    body: 'Jobs and internships published by verified recruiters, with deadlines, vacancies and eligibility shown up front.',
  },
  {
    icon: Sparkles,
    title: 'Skill gap analysis',
    body: 'Compare your skill profile with what a role asks for and see exactly which skills are missing before you apply.',
  },
  {
    icon: Award,
    title: 'Verified certificates',
    body: 'Upload certificate details once; the placement office verifies them and they flow straight into your resume.',
  },
  {
    icon: LineChart,
    title: 'Placement analytics',
    body: 'The college sees live numbers on applications, selections and in-demand skills rather than chasing spreadsheets.',
  },
];

const ROLES = [
  {
    icon: GraduationCap,
    title: 'Students',
    body: 'Build a profile, take skill assessments, generate a resume and track every application through to the result.',
  },
  {
    icon: Building2,
    title: 'Recruiters',
    body: 'Register your company, get verified by the college, publish openings and move applicants through your pipeline.',
  },
  {
    icon: ShieldCheck,
    title: 'College administrators',
    body: 'Approve companies, moderate the skill catalogue, verify certificates and monitor placement performance.',
  },
];

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
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
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-brand-600">
            Student career, internship and skill management
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            The placement process for your whole college, in one system
          </h1>
          <p className="mt-5 text-lg text-slate-600">
            CareerHub brings students, recruiters and the placement office onto a single platform: verified companies,
            real openings, skill assessments scored on the server, and a complete audit trail for every application.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary px-6 py-3">
              Get started
            </Link>
            <Link to="/jobs" className="btn-secondary px-6 py-3">
              Browse open roles
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold text-slate-900">What CareerHub does</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card h-full">
                <div className="card-body">
                  <feature.icon className="h-6 w-6 text-brand-600" />
                  <h3 className="mt-3 font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-semibold text-slate-900">Built for three roles</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {ROLES.map((role) => (
              <div key={role.title} className="card h-full">
                <div className="card-body">
                  <role.icon className="h-6 w-6 text-brand-600" />
                  <h3 className="mt-3 font-semibold text-slate-900">{role.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{role.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>CareerHub - Student Career, Internship &amp; Skill Management System</p>
          <div className="flex gap-4">
            <Link to="/jobs" className="hover:text-slate-700">
              Jobs
            </Link>
            <Link to="/internships" className="hover:text-slate-700">
              Internships
            </Link>
            <Link to="/login" className="hover:text-slate-700">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
