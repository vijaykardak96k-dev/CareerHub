import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarClock, MapPin, Search } from 'lucide-react';
import { PublicShell } from './PublicShell';
import { api, errorMessage } from '../../lib/api';
import { formatDate, formatSalary, humanise } from '../../lib/format';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/Ui';
import type { JobView, PageResponse } from '../../lib/types';

export function PublicJobs() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<JobView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<JobView>>('/jobs/public', {
        params: {
          search: search || undefined,
          location: location || undefined,
          workMode: workMode || undefined,
          page,
          size: 10,
        },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the job board.'));
    } finally {
      setLoading(false);
    }
  }, [search, location, workMode, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PublicShell>
      <PageHeader title="Open jobs" subtitle="Roles published by companies verified by the placement office." />

      <div className="card mb-6">
        <div className="card-body grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="job-search">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="job-search"
                className="input pl-9"
                placeholder="Role or company"
                value={search}
                onChange={(event) => {
                  setPage(0);
                  setSearch(event.target.value);
                }}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="job-location">
              Location
            </label>
            <input
              id="job-location"
              className="input"
              placeholder="Pune"
              value={location}
              onChange={(event) => {
                setPage(0);
                setLocation(event.target.value);
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="job-mode">
              Work mode
            </label>
            <select
              id="job-mode"
              className="input"
              value={workMode}
              onChange={(event) => {
                setPage(0);
                setWorkMode(event.target.value);
              }}
            >
              <option value="">Any</option>
              <option value="ONSITE">Onsite</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <Spinner label="Loading jobs" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && data.content.length === 0 && (
        <EmptyState title="No jobs match your filters" description="Try clearing the search or location filter." />
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <div className="space-y-4">
          {data.content.map((job) => (
            <article key={job.id} className="card">
              <div className="card-body">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/jobs/${job.id}`} className="text-lg font-semibold text-slate-900 hover:text-brand-700">
                      {job.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {job.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location || 'Not specified'} - {humanise(job.workMode)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" />
                        Apply by {formatDate(job.deadline)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                    <p className="text-xs text-slate-500">{humanise(job.employmentType)}</p>
                  </div>
                </div>
                {job.description && <p className="mt-3 text-sm text-slate-600">{job.description}</p>}
                <div className="mt-4">
                  <Link to={`/jobs/${job.id}`} className="btn-secondary">
                    View details
                  </Link>
                </div>
              </div>
            </article>
          ))}
          <div className="card">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        </div>
      )}
    </PublicShell>
  );
}
