import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, MapPin, Users } from 'lucide-react';
import { PublicShell } from './PublicShell';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatSalary, humanise } from '../../lib/format';
import { ErrorState, Spinner, StatusBadge } from '../../components/Ui';
import { useAuth } from '../../context/AuthContext';
import type { JobView } from '../../lib/types';

export function PublicJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<JobView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<JobView>(`/jobs/public/${id}`);
      setJob(data);
    } catch (err) {
      setError(errorMessage(err, 'This job could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PublicShell>
      <Link to="/jobs" className="btn-ghost mb-4 px-0">
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {loading && <Spinner label="Loading job" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && job && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-body">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {job.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location || 'Not specified'} - {humanise(job.workMode)}
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={job.openForApplications ? 'PUBLISHED' : 'CLOSED'} />
                </div>

                <h2 className="mt-6 font-semibold text-slate-900">Role description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>

                {job.skills.length > 0 && (
                  <>
                    <h2 className="mt-6 font-semibold text-slate-900">Skills required</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <span key={skill} className="badge bg-brand-50 text-brand-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card">
              <div className="card-body space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Compensation</span>
                  <span className="font-medium text-slate-800">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employment</span>
                  <span className="font-medium text-slate-800">{humanise(job.employmentType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vacancies</span>
                  <span className="flex items-center gap-1 font-medium text-slate-800">
                    <Users className="h-4 w-4" />
                    {job.vacancies}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Minimum CGPA</span>
                  <span className="font-medium text-slate-800">{job.minCgpa ?? 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Graduation year</span>
                  <span className="font-medium text-slate-800">{job.graduationYear ?? 'Any'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Apply by</span>
                  <span className="flex items-center gap-1 font-medium text-slate-800">
                    <CalendarClock className="h-4 w-4" />
                    {formatDate(job.deadline)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                {user?.role === 'STUDENT' ? (
                  <Link to="/student/jobs" className="btn-primary w-full">
                    Apply from your dashboard
                  </Link>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-slate-600">
                      Sign in with a student account to apply and track this application.
                    </p>
                    <Link to="/login" className="btn-primary w-full">
                      Sign in to apply
                    </Link>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </PublicShell>
  );
}
