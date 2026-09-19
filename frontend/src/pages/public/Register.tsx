import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, Loader2 } from 'lucide-react';
import { homeRouteFor, useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';
import type { Role } from '../../lib/types';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({
        email: email.trim(),
        password,
        role,
        fullName: role === 'STUDENT' ? fullName.trim() : undefined,
        companyName: role === 'COMPANY' ? companyName.trim() : undefined,
      });
      navigate(homeRouteFor(user.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not create the account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-600 text-sm text-white">CH</span>
          CareerHub
        </Link>
        <div className="card">
          <div className="card-body">
            <h1 className="text-lg font-semibold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">
              College administrator accounts are created by the placement office, not here.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`flex flex-col items-center gap-1 rounded-md border px-3 py-3 text-sm ${
                  role === 'STUDENT'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('COMPANY')}
                className={`flex flex-col items-center gap-1 rounded-md border px-3 py-3 text-sm ${
                  role === 'COMPANY'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-5 w-5" />
                Recruiter
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              {role === 'STUDENT' ? (
                <div>
                  <label className="label" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    className="input"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Riya Sharma"
                  />
                </div>
              ) : (
                <div>
                  <label className="label" htmlFor="companyName">
                    Company name
                  </label>
                  <input
                    id="companyName"
                    className="input"
                    required
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="NovaSoft Technologies"
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="reg-email">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="input"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="reg-password">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    className="input"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="reg-confirm">
                    Confirm password
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    className="input"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </div>
              </div>

              {role === 'COMPANY' && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Recruiter accounts start as pending. You can publish openings once the placement office approves your
                  company.
                </p>
              )}

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
