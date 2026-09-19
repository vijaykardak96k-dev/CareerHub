import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Spinner } from '../../components/Ui';
import type { CategoryView, OpeningStatus } from '../../lib/types';

export function CompanyJobCreatePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<CategoryView[] | null>(null);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    workMode: 'ONSITE',
    employmentType: 'FULL_TIME',
    salaryMin: '',
    salaryMax: '',
    minCgpa: '',
    graduationYear: '',
    deadline: '',
    vacancies: '1',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<CategoryView[]>('/skills/catalog');
        setCatalog(data);
      } catch {
        setCatalog([]);
      }
    };
    void load();
  }, []);

  const submit = async (status: OpeningStatus) => {
    setSaving(true);
    try {
      const number = (value: string) => (value.trim() === '' ? null : Number(value));
      await api.post('/jobs', {
        title: form.title,
        description: form.description,
        location: form.location.trim() === '' ? null : form.location.trim(),
        workMode: form.workMode,
        employmentType: form.employmentType,
        salaryMin: number(form.salaryMin),
        salaryMax: number(form.salaryMax),
        minCgpa: number(form.minCgpa),
        graduationYear: number(form.graduationYear),
        deadline: form.deadline === '' ? null : form.deadline,
        vacancies: Number(form.vacancies || 1),
        status,
        skillIds,
      });
      toast.success(status === 'PUBLISHED' ? 'Job published.' : 'Draft saved.');
      navigate('/company/jobs');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this job.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (id: string) => {
    setSkillIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  return (
    <>
      <PageHeader title="Post a job" subtitle="Save it as a draft first, or publish it straight to the job board." />

      <form className="card" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit('PUBLISHED'); }}>
        <div className="card-body grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Role title</label>
            <input className="input" required maxLength={150} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Junior Java Developer" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea rows={6} className="input" required maxLength={5000} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Responsibilities, tech stack, what the team works on." />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Pune" />
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
            <label className="label">Employment type</label>
            <select className="input" value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>
          <div>
            <label className="label">Vacancies</label>
            <input type="number" min={1} max={1000} className="input" required value={form.vacancies}
              onChange={(e) => setForm({ ...form, vacancies: e.target.value })} />
          </div>
          <div>
            <label className="label">Salary minimum (per year)</label>
            <input type="number" min={0} className="input" value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} />
          </div>
          <div>
            <label className="label">Salary maximum (per year)</label>
            <input type="number" min={0} className="input" value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} />
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
          <div>
            <label className="label">Application deadline</label>
            <input type="date" className="input" value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Skills required</label>
            {catalog === null ? (
              <Spinner label="Loading skills" />
            ) : catalog.length === 0 ? (
              <p className="text-sm text-slate-500">The college has not published a skill catalogue yet.</p>
            ) : (
              <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-slate-200 p-3">
                {catalog.map((category) => (
                  <div key={category.id}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{category.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.filter((skill) => skill.active).map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          className={`badge border ${
                            skillIds.includes(skill.id)
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {skill.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button type="button" className="btn-secondary" disabled={saving}
            onClick={() => { void submit('DRAFT'); }}>
            Save as draft
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            Publish job
          </button>
        </div>
      </form>
    </>
  );
}
