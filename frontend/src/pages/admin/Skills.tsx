import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import type { CategoryView, SkillView } from '../../lib/types';

export function AdminSkillsPage() {
  const toast = useToast();
  const [catalog, setCatalog] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [skillModal, setSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillView | null>(null);
  const [skillForm, setSkillForm] = useState({ name: '', description: '', categoryId: '', active: true });

  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<CategoryView[]>('/admin/skills');
      setCatalog(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the skill catalogue.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openAddSkill = (categoryId?: string) => {
    setEditingSkill(null);
    setSkillForm({ name: '', description: '', categoryId: categoryId ?? catalog[0]?.id ?? '', active: true });
    setSkillModal(true);
  };

  const openEditSkill = (skill: SkillView) => {
    setEditingSkill(skill);
    setSkillForm({
      name: skill.name,
      description: skill.description ?? '',
      categoryId: skill.categoryId,
      active: skill.active,
    });
    setSkillModal(true);
  };

  const submitSkill = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: skillForm.name,
        description: skillForm.description.trim() === '' ? null : skillForm.description.trim(),
        categoryId: skillForm.categoryId,
        active: skillForm.active,
      };
      if (editingSkill) {
        await api.put(`/admin/skills/${editingSkill.id}`, payload);
      } else {
        await api.post('/admin/skills', payload);
      }
      toast.success('Skill saved.');
      setSkillModal(false);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this skill.'));
    } finally {
      setSaving(false);
    }
  };

  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/skill-categories', {
        name: categoryForm.name,
        description: categoryForm.description.trim() === '' ? null : categoryForm.description.trim(),
      });
      toast.success('Category created.');
      setCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create this category.'));
    } finally {
      setSaving(false);
    }
  };

  const removeSkill = async (skill: SkillView) => {
    if (!window.confirm(`Delete ${skill.name} from the catalogue?`)) return;
    try {
      await api.delete(`/admin/skills/${skill.id}`);
      toast.success('Skill deleted.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this skill. It may already be in use.'));
    }
  };

  if (loading) return <Spinner label="Loading the skill catalogue" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Skill catalogue"
        subtitle="Students pick from this list, and recruiters tag openings with it."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCategoryModal(true)}>
              <FolderPlus className="h-4 w-4" /> New category
            </button>
            <button type="button" className="btn-primary" disabled={catalog.length === 0}
              onClick={() => openAddSkill()}>
              <Plus className="h-4 w-4" /> New skill
            </button>
          </>
        }
      />

      {catalog.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No categories yet"
            description="Create a category such as Programming or Cloud before adding skills."
            action={
              <button type="button" className="btn-primary" onClick={() => setCategoryModal(true)}>
                Create a category
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {catalog.map((category) => (
            <section key={category.id} className="card">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{category.name}</h2>
                  {category.description && <p className="text-sm text-slate-500">{category.description}</p>}
                </div>
                <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => openAddSkill(category.id)}>
                  <Plus className="h-4 w-4" /> Add skill
                </button>
              </div>
              {category.skills.length === 0 ? (
                <EmptyState title="No skills in this category" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Skill</th>
                        <th>Description</th>
                        <th>Visible</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.skills.map((skill) => (
                        <tr key={skill.id}>
                          <td className="font-medium text-slate-800">{skill.name}</td>
                          <td className="text-slate-600">{skill.description || '-'}</td>
                          <td>
                            <span className={`badge ${skill.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                              {skill.active ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button type="button" className="btn-ghost px-2 py-1" onClick={() => openEditSkill(skill)}>
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" className="btn-ghost px-2 py-1 text-rose-600"
                                onClick={() => removeSkill(skill)}>
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
            </section>
          ))}
        </div>
      )}

      <Modal
        open={skillModal}
        title={editingSkill ? 'Edit skill' : 'New skill'}
        onClose={() => setSkillModal(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setSkillModal(false)}>Cancel</button>
            <button type="submit" form="admin-skill-form" className="btn-primary" disabled={saving}>Save</button>
          </>
        }
      >
        <form id="admin-skill-form" className="space-y-4" onSubmit={submitSkill}>
          <div>
            <label className="label">Name</label>
            <input className="input" required maxLength={80} value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" required value={skillForm.categoryId}
              onChange={(e) => setSkillForm({ ...skillForm, categoryId: e.target.value })}>
              {catalog.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" maxLength={255} value={skillForm.description}
              onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={skillForm.active}
              onChange={(e) => setSkillForm({ ...skillForm, active: e.target.checked })} />
            Visible to students and recruiters
          </label>
        </form>
      </Modal>

      <Modal
        open={categoryModal}
        title="New skill category"
        onClose={() => setCategoryModal(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCategoryModal(false)}>Cancel</button>
            <button type="submit" form="admin-category-form" className="btn-primary" disabled={saving}>Save</button>
          </>
        }
      >
        <form id="admin-category-form" className="space-y-4" onSubmit={submitCategory}>
          <div>
            <label className="label">Name</label>
            <input className="input" required maxLength={80} value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" maxLength={255} value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
          </div>
        </form>
      </Modal>
    </>
  );
}
