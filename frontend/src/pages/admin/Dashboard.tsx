import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Award, Briefcase, Building2, GraduationCap, Megaphone, Send, Trophy, Users } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ErrorState, PageHeader, Spinner, StatCard } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import type { AdminOverview } from '../../lib/types';

export function AdminDashboardPage() {
  const toast = useToast();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AdminOverview>('/admin/overview');
      setOverview(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the overview.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const announce = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post<{ recipients: number }>('/admin/announcements', {
        title,
        message,
        audience,
      });
      toast.success(`Announcement sent to ${data.recipients} account(s).`);
      setOpen(false);
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not send the announcement.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner label="Loading the overview" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!overview) return null;

  return (
    <>
      <PageHeader
        title="College dashboard"
        subtitle="Placement activity across students, recruiters and openings."
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            <Megaphone className="h-4 w-4" /> Send announcement
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={overview.totalStudents} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Companies" value={overview.totalCompanies}
          hint={`${overview.pendingCompanies} awaiting approval`} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Published jobs" value={overview.activeJobs} icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Published internships" value={overview.activeInternships}
          icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Applications" value={overview.totalApplications} icon={<Send className="h-5 w-5" />} />
        <StatCard label="Students selected" value={overview.selectedStudents} icon={<Trophy className="h-5 w-5" />} />
        <StatCard label="Certificates to review" value={overview.pendingCertificates}
          icon={<Award className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/companies" className="card transition-shadow hover:shadow-md">
          <div className="card-body">
            <h2 className="font-semibold text-slate-900">Approve companies</h2>
            <p className="mt-1 text-sm text-slate-500">
              {overview.pendingCompanies} recruiter account(s) are waiting for verification.
            </p>
          </div>
        </Link>
        <Link to="/admin/certificates" className="card transition-shadow hover:shadow-md">
          <div className="card-body">
            <h2 className="font-semibold text-slate-900">Verify certificates</h2>
            <p className="mt-1 text-sm text-slate-500">
              {overview.pendingCertificates} certificate(s) submitted by students need review.
            </p>
          </div>
        </Link>
        <Link to="/admin/analytics" className="card transition-shadow hover:shadow-md">
          <div className="card-body">
            <h2 className="font-semibold text-slate-900">Placement analytics</h2>
            <p className="mt-1 text-sm text-slate-500">Applications by stage, hiring trend and in-demand skills.</p>
          </div>
        </Link>
      </div>

      <Modal
        open={open}
        title="Send an announcement"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="announce-form" className="btn-primary" disabled={sending}>Send</button>
          </>
        }
      >
        <form id="announce-form" className="space-y-4" onSubmit={announce}>
          <div>
            <label className="label">Audience</label>
            <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="ALL">Everyone</option>
              <option value="STUDENTS">Students only</option>
              <option value="COMPANIES">Companies only</option>
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input" required maxLength={180} value={title}
              onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea rows={4} className="input" required maxLength={1000} value={message}
              onChange={(e) => setMessage(e.target.value)} />
          </div>
        </form>
      </Modal>
    </>
  );
}
