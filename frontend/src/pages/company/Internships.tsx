import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, StatusBadge } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDate, humanise } from '../../lib/format';
import type { CategoryView, InternshipView, OpeningStatus, PageResponse } from '../../lib/types';

const EMPTY = {
  title: '',
  description: '',
  location: '',
  workMode: 'ONSITE',
  durationMonths: '3',
  stipend: '',
  eligibility: '',
  minCgpa: '',
  graduationYear: '',
  deadline: '',
  vacancies: '1',
};

export function CompanyInternshipsPage() {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<InternshipView> | null>(null);
  const [catalog, setCatalog] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, skills] = await Promise.all([
        api.get<PageResponse<InternshipView>>('/internships/mine', { params: { page, size: 10 } }),
        api.get<CategoryView[]>('/skills/catalog'),
      ]);
      setData(mine.data);
      setCatalog(skills.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your internships.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (status: OpeningStatus) => {
    setSaving(true);
    try {
      const number = (value: string) => (value.trim() === '' ? null : Number(value));
      await api.post('/internships', {
        title: form.title,
        description: form.description,
        location: form.location.trim() === '' ? null : form.location.trim(),
        workMode: form.workMode,
        durationMonths: Number(form.durationMonths || 1),
        stipend: number(form.stipend),
        eligibility: form.eligibility.trim() === '' ? null : form.eligibility.trim(),
        minCgpa: number(form.minCgpa),
        graduationYear: number(form.graduationYear),
        deadline: form.deadline === '' ? null : form.deadline,
        vacancies: Number(form.vacancies || 1),
        status,
        skillIds,
      });
      toast.success(status === 'PUBLISHED' ? 'Internship published.' : 'Draft saved.');
      setOpen(false);
      setForm({ ...EMPTY });
      setSkillIds([]);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this internship.'));
    } finally {
      setSaving(false);
    }
  };

  const close = async (internship: InternshipView) => {
    if (!window.confirm(`Close ${internship.title}?`)) return;
    try {
      await api.patch(`/internships/${internship.id}/close`);
      toast.success('Internship closed.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not close this internship.'));
    }
  };

  const remove = async (internship: InternshipView) => {
    if (!window.confirm(`Delete the draft "${internship.title}"?`)) return;
    try {
      await api.delete(`/internships/${internship.id}`);
      toast.success('Internship deleted.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this internship.'));
    }
  };

  const toggleSkill = (id: string) => {
    setSkillIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  return (
    <>
      <PageHeader
        title="Internships"
        subtitle="Short term openings for students who have not graduated yet."
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Post an internship
          </button>
        }
      />

      {loading && <Spinner label="Loading internships" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState
              title="No internships posted"
              action={
                <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
                  Post an internship
                </button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Location</th>
                      <th>Duration</th>
                      <th>Stipend</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((internship) => (
                      <tr key={internship.id}>
                        <td className="font-medium text-slate-800">{internship.title}</td>
                        <td>
                          {internship.location || '-'}{' '}
                          <span className="text-xs text-slate-400">{humanise(internship.workMode)}</span>
                        </td>
                        <td>{internship.durationMonths} months</td>
                        <td>{internship.stipend != null ? internship.stipend.toLocaleString() : 'Unpaid'}</td>
                        <td>{formatDate(internship.deadline)}</td>
                        <td><StatusBadge status={internship.status} /></td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {internship.status !== 'CLOSED' && (
                              <button type="button" className="btn-secondary px-3 py-1" onClick={() => close(internship)}>
                                Close
                              </button>
                            )}
                            {internship.status === 'DRAFT' && (
                              <button type="button" className="btn-ghost px-2 py-1 text-rose-600"
                                onClick={() => remove(internship)}>
                                <Trash2 className="h-4 w-4" />
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
        open={open}
        title="Post an internship"
        width="max-w-3xl"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" disabled={saving} onClick={() => { void submit('DRAFT'); }}>
              Save as draft
            </button>
            <button type="submit" form="internship-form" className="btn-primary" disabled={saving}>
              Publish
            </button>
          </>
        }
      >
        <form
          id="internship-form"
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit('PUBLISHED');
          }}
        >
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input className="input" required maxLength={150} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea rows={5} className="input" required maxLength={5000} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Work mode</label>
            <select className="input" value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })}>
              <option value="ONSITE">Onsite</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="label">Duration (months)</label>
            <input type="number" min={1} max={24} className="input" required value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} />
          </div>
          <div>
            <label className="label">Monthly stipend</label>
            <input type="number" min={0} className="input" value={form.stipend}
              onChange={(e) => setForm({ ...form, stipend: e.target.value })} />
          </div>
          <div>
            <label className="label">Vacancies</label>
            <input type="number" min={1} max={1000} className="input" required value={form.vacancies}
              onChange={(e) => setForm({ ...form, vacancies: e.target.value })} />
          </div>
          <div>
            <label className="label">Application deadline</label>
            <input type="date" className="input" value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="label">Minimum CGPA</label>
            <input type="number" step="0.01" min={0} max={10} className="input" value={form.minCgpa}
              onChange={(e) => setForm({ ...form, minCgpa: e.target.value })} />
          </div>
          <div>
            <label className="label">Graduation year</label>
            <input type="number" min={1990} max={2100} className="input" value={form.graduationYear}
              onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Eligibility</label>
            <input className="input" maxLength={500} value={form.eligibility}
              onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
              placeholder="Final year BCA or BSc students" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Skills required</label>
            <div className="max-h-56 space-y-3 overflow-y-auto rounded-md border border-slate-200 p-3">
              {catalog.length === 0 && <p className="text-sm text-slate-500">No skill catalogue available.</p>}
              {catalog.map((category) => (
                <div key={category.id}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{category.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.filter((skill) => skill.active).map((skill) => (
                      <button key={skill.id} type="button" onClick={() => toggleSkill(skill.id)}
                        className={`badge border ${
                          skillIds.includes(skill.id)
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}>
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
