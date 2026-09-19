import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { CountBarChart, CountLineChart } from '../../components/Charts';
import { ErrorState, PageHeader, Spinner, StatCard } from '../../components/Ui';
import { humanise } from '../../lib/format';
import type { AnalyticsSummary } from '../../lib/types';

export function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AnalyticsSummary>('/analytics/summary');
      setSummary(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load analytics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner label="Loading analytics" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!summary) return null;

  const conversion =
    summary.totalApplications === 0
      ? 0
      : Math.round((summary.selectedStudents / summary.totalApplications) * 1000) / 10;

  const byStatus = summary.applicationsByStatus.map((point) => ({
    label: humanise(point.label),
    value: point.value,
  }));

  return (
    <>
      <PageHeader title="Placement analytics" subtitle="Read directly from application, job and skill records." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total applications" value={summary.totalApplications} />
        <StatCard label="Students selected" value={summary.selectedStudents} />
        <StatCard label="Selection rate" value={`${conversion}%`} hint="Selected out of all applications" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-900">Applications by stage</h2>
          </div>
          <div className="card-body">
            <CountBarChart data={byStatus} name="Applications" />
          </div>
        </div>

        <div className="card">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-900">Jobs posted per month</h2>
          </div>
          <div className="card-body">
            <CountLineChart data={summary.jobsByMonth} name="Jobs posted" />
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="font-semibold text-slate-900">Most common student skills</h2>
          </div>
          <div className="card-body">
            <CountBarChart data={summary.topSkills} name="Students" colour="#0f766e" />
          </div>
        </div>
      </div>
    </>
  );
}
