import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarClock, Clock, MapPin, Search } from 'lucide-react';
import { PublicShell } from './PublicShell';
import { api, errorMessage } from '../../lib/api';
import { formatDate, humanise } from '../../lib/format';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/Ui';
import type { InternshipView, PageResponse } from '../../lib/types';

export function PublicInternships() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<InternshipView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<InternshipView>>('/internships/public', {
        params: { search: search || undefined, location: location || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load internships.'));
    } finally {
      setLoading(false);
    }
  }, [search, location, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PublicShell>
      <PageHeader title="Open internships" subtitle="Short term roles for students still completing their degree." />

      <div className="card mb-6">
        <div className="card-body grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="int-search">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="int-search"
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
            <label className="label" htmlFor="int-location">
              Location
            </label>
            <input
              id="int-location"
              className="input"
              placeholder="Pune"
              value={location}
              onChange={(event) => {
                setPage(0);
                setLocation(event.target.value);
              }}
            />
          </div>
        </div>
      </div>

      {loading && <Spinner label="Loading internships" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && data.content.length === 0 && (
        <EmptyState title="No internships match your filters" />
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <div className="space-y-4">
          {data.content.map((internship) => (
            <article key={internship.id} className="card">
              <div className="card-body">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">{internship.title}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {internship.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {internship.location || 'Not specified'} - {humanise(internship.workMode)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {internship.durationMonths} month{internship.durationMonths === 1 ? '' : 's'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" />
                        Apply by {formatDate(internship.deadline)}
                      </span>
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {internship.stipend != null ? `Stipend ${internship.stipend.toLocaleString()}` : 'Unpaid'}
                  </p>
                </div>
                {internship.description && <p className="mt-3 text-sm text-slate-600">{internship.description}</p>}
                <p className="mt-4 text-sm text-slate-500">
                  <Link to="/login" className="font-medium text-brand-600 hover:underline">
                    Sign in
                  </Link>{' '}
                  with a student account to apply.
                </p>
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
