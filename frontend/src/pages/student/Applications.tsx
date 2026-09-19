import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDateTime, humanise } from '../../lib/format';
import type { ApplicationStatus, ApplicationView, PageResponse, StatusHistoryView } from '../../lib/types';

const STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'REJECTED',
  'WITHDRAWN',
];

const FINAL: ApplicationStatus[] = ['SELECTED', 'REJECTED', 'WITHDRAWN'];

export function StudentApplicationsPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<ApplicationView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StatusHistoryView[] | null>(null);
  const [historyTitle, setHistoryTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<ApplicationView>>('/applications/mine', {
        params: { status: status || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your applications.'));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openHistory = async (application: ApplicationView) => {
    try {
      const { data: entries } = await api.get<StatusHistoryView[]>(`/applications/${application.id}/history`);
      setHistory(entries);
      setHistoryTitle(application.openingTitle);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load the status history.'));
    }
  };

  const withdraw = async (application: ApplicationView) => {
    if (!window.confirm(`Withdraw your application for ${application.openingTitle}?`)) return;
    try {
      await api.patch(`/applications/${application.id}/withdraw`);
      toast.success('Application withdrawn.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not withdraw this application.'));
    }
  };

  return (
    <>
      <PageHeader title="My applications" subtitle="Every status change made by a recruiter is recorded here." />

      <div className="card mb-6">
        <div className="card-body max-w-xs">
          <label className="label" htmlFor="app-status">Filter by status</label>
          <select id="app-status" className="input" value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
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
            <EmptyState title="No applications yet" description="Apply to a job or internship to see it here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Opening</th>
                      <th>Type</th>
                      <th>Company</th>
                      <th>Applied</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((application) => (
                      <tr key={application.id}>
                        <td className="font-medium text-slate-800">{application.openingTitle}</td>
                        <td>{humanise(application.openingType)}</td>
                        <td>{application.companyName}</td>
                        <td>{formatDateTime(application.appliedAt)}</td>
                        <td><StatusBadge status={application.status} /></td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button type="button" className="btn-secondary px-3 py-1"
                              onClick={() => openHistory(application)}>
                              History
                            </button>
                            {!FINAL.includes(application.status) && (
                              <button type="button" className="btn-danger px-3 py-1"
                                onClick={() => withdraw(application)}>
                                Withdraw
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

      <Modal open={history !== null} title={`Status history: ${historyTitle}`} onClose={() => setHistory(null)}>
        {history && history.length === 0 && <p className="text-sm text-slate-500">No history recorded.</p>}
        {history && history.length > 0 && (
          <ol className="space-y-4">
            {history.map((entry) => (
              <li key={entry.id} className="border-l-2 border-brand-200 pl-4">
                <p className="text-sm font-medium text-slate-800">
                  {entry.fromStatus ? `${humanise(entry.fromStatus)} -> ` : ''}
                  {humanise(entry.toStatus)}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(entry.changedAt)}</p>
                {entry.note && <p className="mt-1 text-sm text-slate-600">{entry.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </>
  );
}
