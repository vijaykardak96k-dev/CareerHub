import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import type { CategoryView, Proficiency, StudentSkillView } from '../../lib/types';

const LEVELS: Proficiency[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const LEVEL_COLOURS: Record<Proficiency, string> = {
  BEGINNER: 'bg-slate-100 text-slate-700',
  INTERMEDIATE: 'bg-sky-100 text-sky-800',
  ADVANCED: 'bg-indigo-100 text-indigo-800',
  EXPERT: 'bg-emerald-100 text-emerald-800',
};

export function StudentSkillsPage() {
  const toast = useToast();
  const [catalog, setCatalog] = useState<CategoryView[]>([]);
  const [mine, setMine] = useState<StudentSkillView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudentSkillView | null>(null);
  const [skillId, setSkillId] = useState('');
  const [proficiency, setProficiency] = useState<Proficiency>('BEGINNER');
  const [years, setYears] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, own] = await Promise.all([
        api.get<CategoryView[]>('/skills/catalog'),
        api.get<StudentSkillView[]>('/skills/mine'),
      ]);
      setCatalog(cat.data);
      setMine(own.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the skill catalogue.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ownedIds = useMemo(() => new Set(mine.map((item) => item.skillId)), [mine]);

  const openAdd = () => {
    setEditing(null);
    setSkillId('');
    setProficiency('BEGINNER');
    setYears('');
    setOpen(true);
  };

  const openEdit = (item: StudentSkillView) => {
    setEditing(item);
    setSkillId(item.skillId);
    setProficiency(item.proficiency);
    setYears(item.yearsExperience != null ? String(item.yearsExperience) : '');
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        skillId,
        proficiency,
        yearsExperience: years === '' ? null : Number(years),
      };
      if (editing) {
        await api.put(`/skills/mine/${editing.id}`, payload);
      } else {
        await api.post('/skills/mine', payload);
      }
      toast.success('Skill saved.');
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this skill.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: StudentSkillView) => {
    if (!window.confirm(`Remove ${item.skillName} from your profile?`)) return;
    try {
      await api.delete(`/skills/mine/${item.id}`);
      toast.success('Skill removed.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove this skill.'));
    }
  };

  if (loading) return <Spinner label="Loading skills" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="My skills"
        subtitle="Skill gap analysis and job recommendations are both driven by this list."
        actions={
          <button type="button" className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add skill
          </button>
        }
      />

      <div className="card">
        {mine.length === 0 ? (
          <EmptyState
            title="No skills added yet"
            description="Add the technologies you know so recruiters and the matching engine can find you."
            action={
              <button type="button" className="btn-primary" onClick={openAdd}>
                Add your first skill
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Category</th>
                  <th>Proficiency</th>
                  <th>Years</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-slate-800">{item.skillName}</td>
                    <td>{item.categoryName}</td>
                    <td>
                      <span className={`badge ${LEVEL_COLOURS[item.proficiency]}`}>
                        {item.proficiency.charAt(0) + item.proficiency.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td>{item.yearsExperience ?? '-'}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button type="button" className="btn-ghost px-2 py-1" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="btn-ghost px-2 py-1 text-rose-600" onClick={() => remove(item)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        title={editing ? 'Edit skill' : 'Add a skill'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="skill-form" className="btn-primary" disabled={saving}>Save</button>
          </>
        }
      >
        <form id="skill-form" className="space-y-4" onSubmit={submit}>
          <div>
            <label className="label" htmlFor="skill">Skill</label>
            <select id="skill" className="input" required value={skillId} disabled={editing !== null}
              onChange={(e) => setSkillId(e.target.value)}>
              <option value="">Select a skill</option>
              {catalog.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {category.skills
                    .filter((skill) => skill.active && (editing?.skillId === skill.id || !ownedIds.has(skill.id)))
                    .map((skill) => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="level">Proficiency</label>
            <select id="level" className="input" value={proficiency}
              onChange={(e) => setProficiency(e.target.value as Proficiency)}>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="years">Years of experience (optional)</label>
            <input id="years" type="number" step="0.5" min={0} max={50} className="input" value={years}
              onChange={(e) => setYears(e.target.value)} />
          </div>
        </form>
      </Modal>
    </>
  );
}
