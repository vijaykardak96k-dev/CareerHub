import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/Ui';
import { formatDate, formatSalary, humanise } from '../../lib/format';
import type { ApplicationView, InternshipView, JobView, PageResponse } from '../../lib/types';

export function AdminJobsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<JobView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<JobView>>('/admin/jobs', {
        params: { status: status || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load jobs.'));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Jobs" subtitle="Every job posted by a recruiter, including drafts and closed roles." />

      <div className="card mb-6">
        <div className="card-body max-w-xs">
          <label className="label" htmlFor="aj-status">Status</label>
          <select id="aj-status" className="input" value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading && <Spinner label="Loading jobs" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="No jobs found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Compensation</th>
                      <th>Deadline</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((job) => (
                      <tr key={job.id}>
                        <td className="font-medium text-slate-800">{job.title}</td>
                        <td>{job.company.name}</td>
                        <td>
                          {job.location || '-'}{' '}
                          <span className="text-xs text-slate-400">{humanise(job.workMode)}</span>
                        </td>
                        <td>{formatSalary(job.salaryMin, job.salaryMax)}</td>
                        <td>{formatDate(job.deadline)}</td>
                        <td><StatusBadge status={job.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}
    </>
  );
}

export function AdminInternshipsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<InternshipView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<InternshipView>>('/admin/internships', {
        params: { status: status || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load internships.'));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Internships" subtitle="All internships posted across your recruiter accounts." />

      <div className="card mb-6">
        <div className="card-body max-w-xs">
          <label className="label" htmlFor="ai-status">Status</label>
          <select id="ai-status" className="input" value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading && <Spinner label="Loading internships" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="No internships found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Company</th>
                      <th>Duration</th>
                      <th>Stipend</th>
                      <th>Deadline</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((internship) => (
                      <tr key={internship.id}>
                        <td className="font-medium text-slate-800">{internship.title}</td>
                        <td>{internship.company.name}</td>
                        <td>{internship.durationMonths} months</td>
                        <td>{internship.stipend != null ? internship.stipend.toLocaleString() : 'Unpaid'}</td>
                        <td>{formatDate(internship.deadline)}</td>
                        <td><StatusBadge status={internship.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}
    </>
  );
}

export function AdminApplicationsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<ApplicationView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<ApplicationView>>(
        '/admin/applications',
        { params: { status: status || undefined, page, size: 10 } },
      );
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load applications.'));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Applications" subtitle="Every application submitted by your students." />

      <div className="card mb-6">
        <div className="card-body max-w-xs">
          <label className="label" htmlFor="aa-status">Status</label>
          <select id="aa-status" className="input" value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
            <option value="">All</option>
            {['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'].map((value) => (
              <option key={value} value={value}>{humanise(value)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Spinner label="Loading applications" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="No applications found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Opening</th>
                      <th>Company</th>
                      <th>Applied</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((application) => (
                      <tr key={application.id}>
                        <td>
                          <p className="font-medium text-slate-800">{application.studentName}</p>
                          <p className="text-xs text-slate-500">{application.studentEmail}</p>
                        </td>
                        <td>{application.openingTitle}</td>
                        <td>{application.companyName}</td>
                        <td>{formatDate(application.appliedAt)}</td>
                        <td><StatusBadge status={application.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}
    </>
  );
}
