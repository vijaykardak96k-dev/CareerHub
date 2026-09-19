import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/Ui';
import { formatDate, formatSalary, humanise } from '../../lib/format';
import type { JobView, PageResponse } from '../../lib/types';

export function CompanyJobsPage() {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<JobView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<JobView>>('/jobs/mine', {
        params: { page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your jobs.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const close = async (job: JobView) => {
    if (!window.confirm(`Close ${job.title}? Students will no longer be able to apply.`)) return;
    try {
      await api.patch(`/jobs/${job.id}/close`);
      toast.success('Job closed.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not close this job.'));
    }
  };

  const remove = async (job: JobView) => {
    if (!window.confirm(`Delete the draft "${job.title}"?`)) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      toast.success('Job deleted.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this job. Jobs with applications cannot be removed.'));
    }
  };

  return (
    <>
      <PageHeader
        title="Jobs"
        subtitle="Draft, publish and close the roles your company is hiring for."
        actions={
          <Link to="/company/jobs/create" className="btn-primary">
            <Plus className="h-4 w-4" /> Post a job
          </Link>
        }
      />

      {loading && <Spinner label="Loading jobs" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState
              title="You have not posted any jobs"
              description="Create your first opening to start receiving applications."
              action={<Link to="/company/jobs/create" className="btn-primary">Post a job</Link>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Compensation</th>
                      <th>Deadline</th>
                      <th>Vacancies</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((job) => (
                      <tr key={job.id}>
                        <td className="font-medium text-slate-800">{job.title}</td>
                        <td>{job.location || '-'} <span className="text-xs text-slate-400">{humanise(job.workMode)}</span></td>
                        <td>{formatSalary(job.salaryMin, job.salaryMax)}</td>
                        <td>{formatDate(job.deadline)}</td>
                        <td>{job.vacancies}</td>
                        <td><StatusBadge status={job.status} /></td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <Link to={`/company/applications?jobId=${job.id}`} className="btn-secondary px-3 py-1">
                              Applicants
                            </Link>
                            {job.status !== 'CLOSED' && (
                              <button type="button" className="btn-secondary px-3 py-1" onClick={() => close(job)}>
                                Close
                              </button>
                            )}
                            {job.status === 'DRAFT' && (
                              <button type="button" className="btn-ghost px-2 py-1 text-rose-600" onClick={() => remove(job)}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
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
