import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, Send, Trophy } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { EmptyState, ErrorState, PageHeader, Spinner, StatCard, StatusBadge } from '../../components/Ui';
import { formatDateTime } from '../../lib/format';
import type { ApplicationView, CompanyDashboard, PageResponse } from '../../lib/types';

export function CompanyDashboardPage() {
  const [summary, setSummary] = useState<CompanyDashboard | null>(null);
  const [recent, setRecent] = useState<ApplicationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await api.get<CompanyDashboard>('/companies/me/dashboard');
      setSummary(dashboard.data);
      if (dashboard.data.status === 'APPROVED') {
        const applications = await api.get<PageResponse<ApplicationView>>('/applications/company', {
          params: { page: 0, size: 5 },
        });
        setRecent(applications.data.content);
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not load your dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading your dashboard" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!summary) return null;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your hiring activity on CareerHub." />

      {summary.status !== 'APPROVED' && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your company account is <strong>{summary.status.toLowerCase()}</strong>. You can update your profile now, but
          publishing jobs and internships is only possible once the placement office approves your company.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published jobs" value={summary.publishedJobs} hint={`${summary.totalJobs} total`}
          icon={<Briefcase className="h-5 w-5" />} />
        <StatCard label="Published internships" value={summary.publishedInternships}
          hint={`${summary.totalInternships} total`} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Applications received" value={summary.totalApplications}
          hint={`${summary.shortlisted} shortlisted`} icon={<Send className="h-5 w-5" />} />
        <StatCard label="Candidates selected" value={summary.selected} icon={<Trophy className="h-5 w-5" />} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Latest applicants</h2>
          <Link to="/company/applications" className="text-sm font-medium text-brand-600 hover:underline">
            See all applicants
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description={
              summary.status === 'APPROVED'
                ? 'Publish a job or internship and applications will appear here.'
                : 'Applications start arriving once your company is approved and you publish an opening.'
            }
            action={
              summary.status === 'APPROVED' ? (
                <Link to="/company/jobs/create" className="btn-primary">Post a job</Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Opening</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <p className="font-medium text-slate-800">{application.studentName}</p>
                      <p className="text-xs text-slate-500">{application.studentEmail}</p>
                    </td>
                    <td>{application.openingTitle}</td>
                    <td>{formatDateTime(application.appliedAt)}</td>
                    <td><StatusBadge status={application.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
