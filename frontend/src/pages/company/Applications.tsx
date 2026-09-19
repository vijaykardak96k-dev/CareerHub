import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDateTime, humanise } from '../../lib/format';
import type {
  ApplicationStatus,
  ApplicationView,
  PageResponse,
  StatusHistoryView,
  StudentProfile,
} from '../../lib/types';

/** Statuses a recruiter can move an application to. Students own WITHDRAWN. */
const RECRUITER_STATUSES: ApplicationStatus[] = [
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'REJECTED',
];

export function CompanyApplicationsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<ApplicationView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [changing, setChanging] = useState<ApplicationView | null>(null);
  const [nextStatus, setNextStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [candidate, setCandidate] = useState<StudentProfile | null>(null);
  const [history, setHistory] = useState<StatusHistoryView[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<ApplicationView>>('/applications/company', {
        params: { status: status || undefined, jobId: jobId || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load applicants.'));
    } finally {
      setLoading(false);
    }
  }, [status, jobId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCandidate = async (application: ApplicationView) => {
    try {
      const { data: profile } = await api.get<StudentProfile>(`/students/${application.studentId}`);
      setCandidate(profile);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load this candidate.'));
    }
  };

  const openHistory = async (application: ApplicationView) => {
    try {
      const { data: entries } = await api.get<StatusHistoryView[]>(`/applications/${application.id}/history`);
      setHistory(entries);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load the status history.'));
    }
  };

  const changeStatus = async () => {
    if (!changing) return;
    setSaving(true);
    try {
      await api.patch(`/applications/${changing.id}/status`, {
        status: nextStatus,
        note: note.trim() === '' ? null : note.trim(),
      });
      toast.success('Status updated and the student has been notified.');
      setChanging(null);
      setNote('');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this application.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Applicants"
        subtitle="Move candidates through your pipeline. Every change is recorded and the student is notified."
      />

      <div className="card mb-6">
        <div className="card-body max-w-xs">
          <label className="label" htmlFor="c-status">Filter by status</label>
          <select id="c-status" className="input" value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {['APPLIED', ...RECRUITER_STATUSES, 'WITHDRAWN'].map((value) => (
              <option key={value} value={value}>{humanise(value)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Spinner label="Loading applicants" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="No applicants yet" description="Applications to your published openings appear here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Opening</th>
                      <th>Type</th>
                      <th>Applied</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((application) => (
                      <tr key={application.id}>
                        <td>
                          <button type="button" className="font-medium text-brand-700 hover:underline"
                            onClick={() => openCandidate(application)}>
                            {application.studentName}
                          </button>
                          <p className="text-xs text-slate-500">{application.studentEmail}</p>
                        </td>
                        <td>{application.openingTitle}</td>
                        <td>{humanise(application.openingType)}</td>
                        <td>{formatDateTime(application.appliedAt)}</td>
                        <td><StatusBadge status={application.status} /></td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button type="button" className="btn-secondary px-3 py-1"
                              onClick={() => openHistory(application)}>
                              History
                            </button>
                            <button
                              type="button"
                              className="btn-primary px-3 py-1"
                              disabled={application.status === 'WITHDRAWN'}
                              onClick={() => {
                                setChanging(application);
                                setNextStatus('UNDER_REVIEW');
                                setNote('');
                              }}
                            >
                              Change status
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
        open={changing !== null}
        title={changing ? `Update ${changing.studentName}` : 'Update application'}
        onClose={() => setChanging(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setChanging(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={changeStatus} disabled={saving}>
              Save status
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="next-status">New status</label>
            <select id="next-status" className="input" value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as ApplicationStatus)}>
              {RECRUITER_STATUSES.map((value) => (
                <option key={value} value={value}>{humanise(value)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status-note">Note for the student (optional)</label>
            <textarea id="status-note" rows={3} className="input" maxLength={500} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Interview scheduled for Friday at 11am." />
          </div>
        </div>
      </Modal>

      <Modal open={candidate !== null} title="Candidate profile" onClose={() => setCandidate(null)}>
        {candidate && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-800">{candidate.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Contact</dt>
              <dd className="text-slate-700">{[candidate.email, candidate.phone].filter(Boolean).join(' - ')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">College</dt>
              <dd className="text-slate-700">
                {[candidate.college, candidate.department, candidate.course].filter(Boolean).join(' - ') || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Graduation / CGPA</dt>
              <dd className="text-slate-700">
                {candidate.graduationYear ?? '-'} / {candidate.cgpa ?? '-'}
              </dd>
            </div>
            {candidate.bio && (
              <div>
                <dt className="text-slate-500">About</dt>
                <dd className="text-slate-700">{candidate.bio}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">Links</dt>
              <dd className="flex flex-col gap-1">
                {[candidate.githubUrl, candidate.linkedinUrl, candidate.portfolioUrl]
                  .filter(Boolean)
                  .map((link) => (
                    <a key={link as string} href={link as string} target="_blank" rel="noreferrer"
                      className="text-brand-600 hover:underline">
                      {link}
                    </a>
                  ))}
                {!candidate.githubUrl && !candidate.linkedinUrl && !candidate.portfolioUrl && (
                  <span className="text-slate-500">None provided</span>
                )}
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <Modal open={history !== null} title="Status history" onClose={() => setHistory(null)}>
        {history && history.length === 0 && <p className="text-sm text-slate-500">No history recorded.</p>}
        {history && history.length > 0 && (
          <ol className="space-y-4">
            {history.map((entry) => (
              <li key={entry.id} className="border-l-2 border-brand-200 pl-4">
                <p className="text-sm font-medium text-slate-800">
                  {entry.fromStatus ? `${humanise(entry.fromStatus)} -> ` : ''}
                  {humanise(entry.toStatus)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(entry.changedAt)}
                  {entry.changedBy ? ` by ${entry.changedBy}` : ''}
                </p>
                {entry.note && <p className="mt-1 text-sm text-slate-600">{entry.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </>
  );
}
