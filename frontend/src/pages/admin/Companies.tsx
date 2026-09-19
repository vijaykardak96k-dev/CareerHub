import { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/format';
import type { CompanyStatus, CompanyView, PageResponse } from '../../lib/types';

export function AdminCompaniesPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<CompanyView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewing, setReviewing] = useState<CompanyView | null>(null);
  const [decision, setDecision] = useState<CompanyStatus>('APPROVED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<CompanyView>>('/admin/companies', {
        params: { status: status || undefined, search: search || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load companies.'));
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitDecision = async () => {
    if (!reviewing) return;
    setSaving(true);
    try {
      await api.patch(`/admin/companies/${reviewing.id}/status`, {
        status: decision,
        note: note.trim() === '' ? null : note.trim(),
      });
      toast.success(`Company ${decision.toLowerCase()}.`);
      setReviewing(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this company.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Only approved companies can publish jobs and internships to your students."
      />

      <div className="card mb-6">
        <div className="card-body grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="co-search">Search</label>
            <input id="co-search" className="input" placeholder="Company name" value={search}
              onChange={(e) => { setPage(0); setSearch(e.target.value); }} />
          </div>
          <div>
            <label className="label" htmlFor="co-status">Status</label>
            <select id="co-status" className="input" value={status}
              onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <Spinner label="Loading companies" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="No companies found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Industry</th>
                      <th>Location</th>
                      <th>Registered</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((company) => (
                      <tr key={company.id}>
                        <td>
                          <p className="font-medium text-slate-800">{company.name}</p>
                          <p className="text-xs text-slate-500">{company.email}</p>
                          {company.website && (
                            <a href={company.website} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                              Website <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </td>
                        <td>{company.industry || '-'}</td>
                        <td>{company.location || '-'}</td>
                        <td>{formatDate(company.createdAt)}</td>
                        <td>
                          <StatusBadge status={company.status} />
                          {company.reviewNote && <p className="mt-1 text-xs text-slate-500">{company.reviewNote}</p>}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {company.status === 'PENDING' && (
                              <>
                                <button type="button" className="btn-primary px-3 py-1"
                                  onClick={() => { setReviewing(company); setDecision('APPROVED'); setNote(''); }}>
                                  Approve
                                </button>
                                <button type="button" className="btn-danger px-3 py-1"
                                  onClick={() => { setReviewing(company); setDecision('REJECTED'); setNote(''); }}>
                                  Reject
                                </button>
                              </>
                            )}
                            {company.status === 'APPROVED' && (
                              <button type="button" className="btn-danger px-3 py-1"
                                onClick={() => { setReviewing(company); setDecision('SUSPENDED'); setNote(''); }}>
                                Suspend
                              </button>
                            )}
                            {(company.status === 'REJECTED' || company.status === 'SUSPENDED') && (
                              <button type="button" className="btn-secondary px-3 py-1"
                                onClick={() => { setReviewing(company); setDecision('APPROVED'); setNote(''); }}>
                                Reinstate
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

      <Modal
        open={reviewing !== null}
        title={reviewing ? `${decision.charAt(0) + decision.slice(1).toLowerCase()} ${reviewing.name}` : 'Review'}
        onClose={() => setReviewing(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setReviewing(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={submitDecision} disabled={saving}>Confirm</button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          The company is notified in the app as soon as you confirm this decision.
        </p>
        <label className="label" htmlFor="review-note">Note (optional)</label>
        <textarea id="review-note" rows={3} className="input" maxLength={500} value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Verified the GST certificate and the recruiter contact." />
      </Modal>
    </>
  );
}
