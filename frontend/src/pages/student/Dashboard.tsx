import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Bell, Briefcase, ListChecks, Send, Sparkles, Trophy } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { ErrorState, PageHeader, ProgressBar, Spinner, StatCard, EmptyState } from '../../components/Ui';
import { formatDate } from '../../lib/format';
import type { ApplicationView, JobView, PageResponse, StudentDashboard } from '../../lib/types';

export function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [recommended, setRecommended] = useState<JobView[]>([]);
  const [recent, setRecent] = useState<ApplicationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, jobs, applications] = await Promise.all([
        api.get<StudentDashboard>('/students/me/dashboard'),
        api.get<JobView[]>('/students/me/recommended-jobs', { params: { limit: 4 } }),
        api.get<PageResponse<ApplicationView>>('/applications/mine', { params: { page: 0, size: 5 } }),
      ]);
      setDashboard(summary.data);
      setRecommended(jobs.data);
      setRecent(applications.data.content);
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
  if (!dashboard) return null;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Everything below is calculated from your saved records." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active applications"
          value={dashboard.activeApplications}
          hint={`${dashboard.shortlistedApplications} shortlisted`}
          icon={<Send className="h-5 w-5" />}
        />
        <StatCard
          label="Offers received"
          value={dashboard.selectedApplications}
          icon={<Trophy className="h-5 w-5" />}
        />
        <StatCard
          label="Skills on profile"
          value={dashboard.skillCount}
          icon={<Sparkles className="h-5 w-5" />}
        />
        <StatCard
          label="Assessments taken"
          value={dashboard.assessmentCount}
          hint={`Average ${dashboard.averageAssessmentScore}%`}
          icon={<ListChecks className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <div className="card-body">
            <h2 className="font-semibold text-slate-900">Profile strength</h2>
            <p className="mt-1 text-sm text-slate-500">
              A complete profile makes your resume and applications far stronger.
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{dashboard.profileCompletion}%</p>
            <div className="mt-2">
              <ProgressBar value={dashboard.profileCompletion} />
            </div>
            <Link to="/student/profile" className="btn-secondary mt-4 w-full">
              Complete your profile
            </Link>

            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Award className="h-4 w-4" />
                  Certificates verified
                </dt>
                <dd className="font-medium text-slate-800">
                  {dashboard.verifiedCertificateCount} / {dashboard.certificateCount}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Bell className="h-4 w-4" />
                  Unread notifications
                </dt>
                <dd className="font-medium text-slate-800">{dashboard.unreadNotifications}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-900">Recommended for your skills</h2>
            <Link to="/student/jobs" className="text-sm font-medium text-brand-600 hover:underline">
              Browse all jobs
            </Link>
          </div>
          <div className="card-body">
            {recommended.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                description="Add skills to your profile and matching jobs will appear here."
                action={
                  <Link to="/student/skills" className="btn-secondary">
                    Add skills
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recommended.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{job.title}</p>
                      <p className="truncate text-sm text-slate-500">
                        {job.company.name} - {job.location || 'Location not specified'}
                      </p>
                    </div>
                    <Link to="/student/jobs" className="btn-secondary shrink-0 px-3 py-1.5">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Recent applications</h2>
          <Link to="/student/applications" className="text-sm font-medium text-brand-600 hover:underline">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="You have not applied anywhere yet"
            description="Open the job board to find a role that matches your profile."
            action={
              <Link to="/student/jobs" className="btn-primary">
                <Briefcase className="h-4 w-4" />
                Find a job
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Opening</th>
                  <th>Company</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((application) => (
                  <tr key={application.id}>
                    <td className="font-medium text-slate-800">{application.openingTitle}</td>
                    <td>{application.companyName}</td>
                    <td>{formatDate(application.appliedAt)}</td>
                    <td>{application.status.replace(/_/g, ' ')}</td>
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
