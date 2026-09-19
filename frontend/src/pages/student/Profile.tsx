import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, ProgressBar, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/format';
import type { EducationView, ExperienceView, ProjectView, StudentProfile } from '../../lib/types';

type Section = 'education' | 'projects' | 'experience';

const EMPTY_EDUCATION = {
  degree: '',
  institution: '',
  specialization: '',
  startYear: '',
  endYear: '',
  grade: '',
};
const EMPTY_PROJECT = {
  title: '',
  description: '',
  techStack: '',
  projectUrl: '',
  repoUrl: '',
  startDate: '',
  endDate: '',
};
const EMPTY_EXPERIENCE = {
  companyName: '',
  roleTitle: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
};

function blankToNull(value: string) {
  return value.trim() === '' ? null : value.trim();
}

export function StudentProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [education, setEducation] = useState<EducationView[]>([]);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [experience, setExperience] = useState<ExperienceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState<Section | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [educationForm, setEducationForm] = useState({ ...EMPTY_EDUCATION });
  const [projectForm, setProjectForm] = useState({ ...EMPTY_PROJECT });
  const [experienceForm, setExperienceForm] = useState({ ...EMPTY_EXPERIENCE });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, edu, proj, exp] = await Promise.all([
        api.get<StudentProfile>('/students/me'),
        api.get<EducationView[]>('/students/me/education'),
        api.get<ProjectView[]>('/students/me/projects'),
        api.get<ExperienceView[]>('/students/me/experience'),
      ]);
      setProfile(me.data);
      setEducation(edu.data);
      setProjects(proj.data);
      setExperience(exp.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your profile.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { data } = await api.put<StudentProfile>('/students/me', {
        fullName: profile.fullName,
        phone: blankToNull(profile.phone ?? ''),
        college: blankToNull(profile.college ?? ''),
        department: blankToNull(profile.department ?? ''),
        course: blankToNull(profile.course ?? ''),
        graduationYear: profile.graduationYear ? Number(profile.graduationYear) : null,
        cgpa: profile.cgpa != null && String(profile.cgpa) !== '' ? Number(profile.cgpa) : null,
        location: blankToNull(profile.location ?? ''),
        photoUrl: blankToNull(profile.photoUrl ?? ''),
        bio: blankToNull(profile.bio ?? ''),
        githubUrl: blankToNull(profile.githubUrl ?? ''),
        linkedinUrl: blankToNull(profile.linkedinUrl ?? ''),
        portfolioUrl: blankToNull(profile.portfolioUrl ?? ''),
      });
      setProfile(data);
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  };

  const openModal = (section: Section, item?: EducationView | ProjectView | ExperienceView) => {
    setModal(section);
    setEditingId(item ? item.id : null);
    if (section === 'education') {
      const value = item as EducationView | undefined;
      setEducationForm(
        value
          ? {
              degree: value.degree,
              institution: value.institution,
              specialization: value.specialization ?? '',
              startYear: value.startYear ? String(value.startYear) : '',
              endYear: value.endYear ? String(value.endYear) : '',
              grade: value.grade ?? '',
            }
          : { ...EMPTY_EDUCATION },
      );
    } else if (section === 'projects') {
      const value = item as ProjectView | undefined;
      setProjectForm(
        value
          ? {
              title: value.title,
              description: value.description ?? '',
              techStack: value.techStack ?? '',
              projectUrl: value.projectUrl ?? '',
              repoUrl: value.repoUrl ?? '',
              startDate: value.startDate ?? '',
              endDate: value.endDate ?? '',
            }
          : { ...EMPTY_PROJECT },
      );
    } else {
      const value = item as ExperienceView | undefined;
      setExperienceForm(
        value
          ? {
              companyName: value.companyName,
              roleTitle: value.roleTitle,
              description: value.description ?? '',
              location: value.location ?? '',
              startDate: value.startDate ?? '',
              endDate: value.endDate ?? '',
              currentlyWorking: value.currentlyWorking,
            }
          : { ...EMPTY_EXPERIENCE },
      );
    }
  };

  const submitSection = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      let payload: Record<string, unknown>;
      if (modal === 'education') {
        payload = {
          degree: educationForm.degree,
          institution: educationForm.institution,
          specialization: blankToNull(educationForm.specialization),
          startYear: educationForm.startYear ? Number(educationForm.startYear) : null,
          endYear: educationForm.endYear ? Number(educationForm.endYear) : null,
          grade: blankToNull(educationForm.grade),
        };
      } else if (modal === 'projects') {
        payload = {
          title: projectForm.title,
          description: blankToNull(projectForm.description),
          techStack: blankToNull(projectForm.techStack),
          projectUrl: blankToNull(projectForm.projectUrl),
          repoUrl: blankToNull(projectForm.repoUrl),
          startDate: blankToNull(projectForm.startDate),
          endDate: blankToNull(projectForm.endDate),
        };
      } else {
        payload = {
          companyName: experienceForm.companyName,
          roleTitle: experienceForm.roleTitle,
          description: blankToNull(experienceForm.description),
          location: blankToNull(experienceForm.location),
          startDate: blankToNull(experienceForm.startDate),
          endDate: experienceForm.currentlyWorking ? null : blankToNull(experienceForm.endDate),
          currentlyWorking: experienceForm.currentlyWorking,
        };
      }

      const base = `/students/me/${modal}`;
      if (editingId) {
        await api.put(`${base}/${editingId}`, payload);
      } else {
        await api.post(base, payload);
      }
      toast.success('Saved.');
      setModal(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this entry.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (section: Section, id: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/students/me/${section}/${id}`);
      toast.success('Deleted.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this entry.'));
    }
  };

  if (loading) return <Spinner label="Loading your profile" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!profile) return null;

  const update = (patch: Partial<StudentProfile>) => setProfile({ ...profile, ...patch });

  return (
    <>
      <PageHeader title="My profile" subtitle="Keep this up to date; your resume and applications are built from it." />

      <div className="mb-6 card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Profile completion</p>
            <p className="text-sm font-semibold text-slate-900">{profile.profileCompletion}%</p>
          </div>
          <div className="mt-2">
            <ProgressBar value={profile.profileCompletion} />
          </div>
        </div>
      </div>

      <form className="card mb-6" onSubmit={saveProfile}>
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Personal details</h2>
        </div>
        <div className="card-body grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="fullName">Full name</label>
            <input id="fullName" className="input" required value={profile.fullName}
              onChange={(e) => update({ fullName: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input bg-slate-100" value={profile.email} readOnly />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" className="input" value={profile.phone ?? ''}
              onChange={(e) => update({ phone: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" className="input" value={profile.location ?? ''}
              onChange={(e) => update({ location: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="college">College</label>
            <input id="college" className="input" value={profile.college ?? ''}
              onChange={(e) => update({ college: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="department">Department</label>
            <input id="department" className="input" value={profile.department ?? ''}
              onChange={(e) => update({ department: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="course">Course</label>
            <input id="course" className="input" placeholder="BCA" value={profile.course ?? ''}
              onChange={(e) => update({ course: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="graduationYear">Graduation year</label>
            <input id="graduationYear" type="number" min={1990} max={2100} className="input"
              value={profile.graduationYear ?? ''}
              onChange={(e) => update({ graduationYear: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>
          <div>
            <label className="label" htmlFor="cgpa">CGPA</label>
            <input id="cgpa" type="number" step="0.01" min={0} max={10} className="input" value={profile.cgpa ?? ''}
              onChange={(e) => update({ cgpa: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>
          <div>
            <label className="label" htmlFor="photoUrl">Photo URL</label>
            <input id="photoUrl" className="input" value={profile.photoUrl ?? ''}
              onChange={(e) => update({ photoUrl: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="bio">Short bio</label>
            <textarea id="bio" rows={3} className="input" value={profile.bio ?? ''}
              onChange={(e) => update({ bio: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="githubUrl">GitHub</label>
            <input id="githubUrl" className="input" value={profile.githubUrl ?? ''}
              onChange={(e) => update({ githubUrl: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="linkedinUrl">LinkedIn</label>
            <input id="linkedinUrl" className="input" value={profile.linkedinUrl ?? ''}
              onChange={(e) => update({ linkedinUrl: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="portfolioUrl">Portfolio</label>
            <input id="portfolioUrl" className="input" value={profile.portfolioUrl ?? ''}
              onChange={(e) => update({ portfolioUrl: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 px-5 py-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            Save profile
          </button>
        </div>
      </form>

      <section className="card mb-6">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Education</h2>
          <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => openModal('education')}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {education.length === 0 ? (
          <EmptyState title="No education added yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {education.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-slate-800">
                    {item.degree}
                    {item.specialization ? ` - ${item.specialization}` : ''}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.institution} - {item.startYear ?? '?'} to {item.endYear ?? 'present'}
                    {item.grade ? ` - ${item.grade}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className="btn-ghost px-2 py-1" onClick={() => openModal('education', item)}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="btn-ghost px-2 py-1 text-rose-600"
                    onClick={() => remove('education', item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mb-6">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Projects</h2>
          <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => openModal('projects')}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {projects.length === 0 ? (
          <EmptyState title="No projects added yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {projects.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{item.title}</p>
                  {item.techStack && <p className="text-sm text-slate-500">{item.techStack}</p>}
                  {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(item.startDate)} - {item.endDate ? formatDate(item.endDate) : 'ongoing'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className="btn-ghost px-2 py-1" onClick={() => openModal('projects', item)}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="btn-ghost px-2 py-1 text-rose-600"
                    onClick={() => remove('projects', item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Experience</h2>
          <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => openModal('experience')}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {experience.length === 0 ? (
          <EmptyState title="No experience added yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {experience.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">
                    {item.roleTitle} at {item.companyName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(item.startDate)} - {item.currentlyWorking ? 'present' : formatDate(item.endDate)}
                    {item.location ? ` - ${item.location}` : ''}
                  </p>
                  {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className="btn-ghost px-2 py-1" onClick={() => openModal('experience', item)}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="btn-ghost px-2 py-1 text-rose-600"
                    onClick={() => remove('experience', item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={modal !== null}
        title={`${editingId ? 'Edit' : 'Add'} ${modal ?? ''}`}
        onClose={() => setModal(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="submit" form="section-form" className="btn-primary" disabled={saving}>
              Save
            </button>
          </>
        }
      >
        <form id="section-form" className="space-y-4" onSubmit={submitSection}>
          {modal === 'education' && (
            <>
              <div>
                <label className="label">Degree</label>
                <input className="input" required value={educationForm.degree}
                  onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })} />
              </div>
              <div>
                <label className="label">Institution</label>
                <input className="input" required value={educationForm.institution}
                  onChange={(e) => setEducationForm({ ...educationForm, institution: e.target.value })} />
              </div>
              <div>
                <label className="label">Specialization</label>
                <input className="input" value={educationForm.specialization}
                  onChange={(e) => setEducationForm({ ...educationForm, specialization: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Start year</label>
                  <input type="number" className="input" value={educationForm.startYear}
                    onChange={(e) => setEducationForm({ ...educationForm, startYear: e.target.value })} />
                </div>
                <div>
                  <label className="label">End year</label>
                  <input type="number" className="input" value={educationForm.endYear}
                    onChange={(e) => setEducationForm({ ...educationForm, endYear: e.target.value })} />
                </div>
                <div>
                  <label className="label">Grade</label>
                  <input className="input" value={educationForm.grade}
                    onChange={(e) => setEducationForm({ ...educationForm, grade: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {modal === 'projects' && (
            <>
              <div>
                <label className="label">Title</label>
                <input className="input" required value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows={3} className="input" value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Tech stack</label>
                <input className="input" value={projectForm.techStack}
                  onChange={(e) => setProjectForm({ ...projectForm, techStack: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Live URL</label>
                  <input className="input" value={projectForm.projectUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, projectUrl: e.target.value })} />
                </div>
                <div>
                  <label className="label">Repository URL</label>
                  <input className="input" value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })} />
                </div>
                <div>
                  <label className="label">Start date</label>
                  <input type="date" className="input" value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">End date</label>
                  <input type="date" className="input" value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {modal === 'experience' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Company</label>
                  <input className="input" required value={experienceForm.companyName}
                    onChange={(e) => setExperienceForm({ ...experienceForm, companyName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input className="input" required value={experienceForm.roleTitle}
                    onChange={(e) => setExperienceForm({ ...experienceForm, roleTitle: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows={3} className="input" value={experienceForm.description}
                  onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Location</label>
                  <input className="input" value={experienceForm.location}
                    onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })} />
                </div>
                <div>
                  <label className="label">Start date</label>
                  <input type="date" className="input" value={experienceForm.startDate}
                    onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">End date</label>
                  <input type="date" className="input" disabled={experienceForm.currentlyWorking}
                    value={experienceForm.endDate}
                    onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={experienceForm.currentlyWorking}
                  onChange={(e) => setExperienceForm({ ...experienceForm, currentlyWorking: e.target.checked })} />
                I currently work here
              </label>
            </>
          )}
        </form>
      </Modal>
    </>
  );
}
