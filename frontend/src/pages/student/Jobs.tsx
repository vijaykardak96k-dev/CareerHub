import { useCallback, useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Building2, CalendarClock, MapPin, Search, Sparkles } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDate, formatSalary, humanise } from '../../lib/format';
import type { JobView, PageResponse, SkillGapView } from '../../lib/types';

export function StudentJobsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<JobView> | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applyFor, setApplyFor] = useState<JobView | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gap, setGap] = useState<SkillGapView | null>(null);
  const [gapTitle, setGapTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobs, saved] = await Promise.all([
        api.get<PageResponse<JobView>>('/jobs', {
          params: {
            search: search || undefined,
            location: location || undefined,
            workMode: workMode || undefined,
            page,
            size: 10,
          },
        }),
        api.get<JobView[]>('/students/me/saved-jobs'),
      ]);
      setData(jobs.data);
      setSavedIds(new Set(saved.data.map((job) => job.id)));
    } catch (err) {
      setError(errorMessage(err, 'Could not load the job board.'));
    } finally {
      setLoading(false);
    }
  }, [search, location, workMode, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSaved = async (job: JobView) => {
    try {
      if (savedIds.has(job.id)) {
        await api.delete(`/students/me/saved-jobs/${job.id}`);
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(job.id);
          return next;
        });
        toast.info('Removed from saved jobs.');
      } else {
        await api.post(`/students/me/saved-jobs/${job.id}`);
        setSavedIds((current) => new Set(current).add(job.id));
        toast.success('Saved for later.');
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update your saved jobs.'));
    }
  };

  const showGap = async (job: JobView) => {
    try {
      const { data: result } = await api.get<SkillGapView>(`/skills/gap/job/${job.id}`);
      setGap(result);
      setGapTitle(job.title);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not run the skill gap analysis.'));
    }
  };

  const submitApplication = async () => {
    if (!applyFor) return;
    setSubmitting(true);
    try {
      await api.post('/applications', {
        openingType: 'JOB',
        openingId: applyFor.id,
        coverLetter: coverLetter.trim() === '' ? null : coverLetter.trim(),
      });
      toast.success('Application submitted.');
      setApplyFor(null);
      setCoverLetter('');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not submit this application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Jobs" subtitle="Openings from companies approved by the placement office." />

      <div className="card mb-6">
        <div className="card-body grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="s-search">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input id="s-search" className="input pl-9" placeholder="Role or company" value={search}
                onChange={(e) => { setPage(0); setSearch(e.target.value); }} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="s-location">Location</label>
            <input id="s-location" className="input" value={location}
              onChange={(e) => { setPage(0); setLocation(e.target.value); }} />
          </div>
          <div>
            <label className="label" htmlFor="s-mode">Work mode</label>
            <select id="s-mode" className="input" value={workMode}
              onChange={(e) => { setPage(0); setWorkMode(e.target.value); }}>
              <option value="">Any</option>
              <option value="ONSITE">Onsite</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <Spinner label="Loading jobs" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && data.content.length === 0 && (
        <EmptyState title="No jobs match your filters" description="Try a different search term or location." />
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <div className="space-y-4">
          {data.content.map((job) => (
            <article key={job.id} className="card">
              <div className="card-body">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{job.company.name}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />{job.location || 'Not specified'} - {humanise(job.workMode)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" />Apply by {formatDate(job.deadline)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                    <p className="text-xs text-slate-500">{humanise(job.employmentType)}</p>
                  </div>
                </div>

                {job.description && <p className="mt-3 text-sm text-slate-600">{job.description}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" disabled={!job.openForApplications}
                    onClick={() => { setApplyFor(job); setCoverLetter(''); }}>
                    {job.openForApplications ? 'Apply' : 'Closed'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => showGap(job)}>
                    <Sparkles className="h-4 w-4" /> Skill match
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => toggleSaved(job)}>
                    {savedIds.has(job.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {savedIds.has(job.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </article>
          ))}
          <div className="card">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        </div>
      )}

      <Modal
        open={applyFor !== null}
        title={applyFor ? `Apply to ${applyFor.title}` : 'Apply'}
        onClose={() => setApplyFor(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setApplyFor(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={submitApplication} disabled={submitting}>
              Submit application
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Your profile, skills and verified certificates are shared with the recruiter automatically.
        </p>
        <label className="label" htmlFor="cover">Cover letter (optional)</label>
        <textarea id="cover" rows={6} className="input" maxLength={3000} value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Explain briefly why you are a good fit for this role." />
      </Modal>

      <Modal open={gap !== null} title={`Skill match: ${gapTitle}`} onClose={() => setGap(null)}>
        {gap && (
          <div className="space-y-4">
            <p className="text-3xl font-semibold text-slate-900">{gap.matchPercentage}%</p>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Skills you already have</h3>
              {gap.matchedSkills.length === 0 ? (
                <p className="text-sm text-slate-500">None of the required skills are on your profile yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {gap.matchedSkills.map((skill) => (
                    <span key={skill} className="badge bg-emerald-100 text-emerald-800">{skill}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Skills to work on</h3>
              {gap.missingSkills.length === 0 ? (
                <p className="text-sm text-slate-500">You match every skill this role asks for.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {gap.missingSkills.map((skill) => (
                    <span key={skill} className="badge bg-amber-100 text-amber-800">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
