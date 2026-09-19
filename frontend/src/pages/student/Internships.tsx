import { useCallback, useEffect, useState } from 'react';
import { Building2, CalendarClock, Clock, MapPin, Search, Sparkles } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDate, humanise } from '../../lib/format';
import type { InternshipView, PageResponse, SkillGapView } from '../../lib/types';

export function StudentInternshipsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<InternshipView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyFor, setApplyFor] = useState<InternshipView | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gap, setGap] = useState<SkillGapView | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<InternshipView>>('/internships', {
        params: { search: search || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load internships.'));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitApplication = async () => {
    if (!applyFor) return;
    setSubmitting(true);
    try {
      await api.post('/applications', {
        openingType: 'INTERNSHIP',
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

  const showGap = async (internship: InternshipView) => {
    try {
      const { data: result } = await api.get<SkillGapView>(`/skills/gap/internship/${internship.id}`);
      setGap(result);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not run the skill gap analysis.'));
    }
  };

  return (
    <>
      <PageHeader title="Internships" subtitle="Short term roles you can take while still studying." />

      <div className="card mb-6">
        <div className="card-body">
          <label className="label" htmlFor="i-search">Search</label>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input id="i-search" className="input pl-9" placeholder="Role or company" value={search}
              onChange={(e) => { setPage(0); setSearch(e.target.value); }} />
          </div>
        </div>
      </div>

      {loading && <Spinner label="Loading internships" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && data.content.length === 0 && <EmptyState title="No internships found" />}

      {!loading && !error && data && data.content.length > 0 && (
        <div className="space-y-4">
          {data.content.map((internship) => (
            <article key={internship.id} className="card">
              <div className="card-body">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">{internship.title}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />{internship.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />{internship.location || 'Not specified'} - {humanise(internship.workMode)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />{internship.durationMonths} months
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" />Apply by {formatDate(internship.deadline)}
                      </span>
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {internship.stipend != null ? `Stipend ${internship.stipend.toLocaleString()}` : 'Unpaid'}
                  </p>
                </div>

                {internship.description && <p className="mt-3 text-sm text-slate-600">{internship.description}</p>}
                {internship.eligibility && (
                  <p className="mt-2 text-sm text-slate-500">Eligibility: {internship.eligibility}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" disabled={!internship.openForApplications}
                    onClick={() => { setApplyFor(internship); setCoverLetter(''); }}>
                    {internship.openForApplications ? 'Apply' : 'Closed'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => showGap(internship)}>
                    <Sparkles className="h-4 w-4" /> Skill match
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
        <label className="label" htmlFor="i-cover">Cover letter (optional)</label>
        <textarea id="i-cover" rows={6} className="input" maxLength={3000} value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)} />
      </Modal>

      <Modal open={gap !== null} title="Skill match" onClose={() => setGap(null)}>
        {gap && (
          <div className="space-y-4">
            <p className="text-3xl font-semibold text-slate-900">{gap.matchPercentage}%</p>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Matched</h3>
              <div className="flex flex-wrap gap-2">
                {gap.matchedSkills.length === 0 && <p className="text-sm text-slate-500">None yet.</p>}
                {gap.matchedSkills.map((skill) => (
                  <span key={skill} className="badge bg-emerald-100 text-emerald-800">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Missing</h3>
              <div className="flex flex-wrap gap-2">
                {gap.missingSkills.length === 0 && <p className="text-sm text-slate-500">Nothing missing.</p>}
                {gap.missingSkills.map((skill) => (
                  <span key={skill} className="badge bg-amber-100 text-amber-800">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
