import { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/format';
import type { CertificateStatus, CertificateView, PageResponse } from '../../lib/types';

export function AdminCertificatesPage() {
  const toast = useToast();
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<CertificateView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewing, setReviewing] = useState<CertificateView | null>(null);
  const [decision, setDecision] = useState<CertificateStatus>('VERIFIED');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<CertificateView>>('/admin/certificates', {
        params: { status: status || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load certificates.'));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async () => {
    if (!reviewing) return;
    setSaving(true);
    try {
      await api.patch(`/admin/certificates/${reviewing.id}/review`, {
        status: decision,
        note: note.trim() === '' ? null : note.trim(),
      });
      toast.success(`Certificate ${decision.toLowerCase()}.`);
      setReviewing(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not review this certificate.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Certificates"
        subtitle="Verified certificates appear on a student's resume; the student is notified either way."
      />

      <div className="card mb-6">
        <div className="card-body max-w-xs">
          <label className="label" htmlFor="cert-status">Status</label>
          <select id="cert-status" className="input" value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
            <option value="PENDING">Pending review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {loading && <Spinner label="Loading certificates" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="Nothing to review" description="Certificates submitted by students appear here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Certificate</th>
                      <th>Issued by</th>
                      <th>Issue date</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((certificate) => (
                      <tr key={certificate.id}>
                        <td className="font-medium text-slate-800">{certificate.studentName}</td>
                        <td>
                          <p>{certificate.name}</p>
                          {certificate.credentialUrl && (
                            <a href={certificate.credentialUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                              Open credential <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {certificate.credentialId && (
                            <p className="text-xs text-slate-500">ID: {certificate.credentialId}</p>
                          )}
                        </td>
                        <td>{certificate.issuingOrganization}</td>
                        <td>{formatDate(certificate.issueDate)}</td>
                        <td><StatusBadge status={certificate.status} /></td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button type="button" className="btn-primary px-3 py-1"
                              onClick={() => { setReviewing(certificate); setDecision('VERIFIED'); setNote(''); }}>
                              Verify
                            </button>
                            <button type="button" className="btn-danger px-3 py-1"
                              onClick={() => { setReviewing(certificate); setDecision('REJECTED'); setNote(''); }}>
                              Reject
                            </button>
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
        title={decision === 'VERIFIED' ? 'Verify certificate' : 'Reject certificate'}
        onClose={() => setReviewing(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setReviewing(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={review} disabled={saving}>Confirm</button>
          </>
        }
      >
        {reviewing && (
          <>
            <p className="mb-3 text-sm text-slate-600">
              {reviewing.name} from {reviewing.issuingOrganization}, submitted by {reviewing.studentName}.
            </p>
            <label className="label" htmlFor="cert-note">Note for the student (optional)</label>
            <textarea id="cert-note" rows={3} className="input" maxLength={500} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Credential URL did not resolve; please re-upload." />
          </>
        )}
      </Modal>
    </>
  );
}
