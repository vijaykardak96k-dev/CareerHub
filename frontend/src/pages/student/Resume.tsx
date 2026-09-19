import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ErrorState, PageHeader, Spinner } from '../../components/Ui';
import { formatDate } from '../../lib/format';
import type { ResumeView } from '../../lib/types';

export function StudentResumePage() {
  const toast = useToast();
  const [resume, setResume] = useState<ResumeView | null>(null);
  const [summary, setSummary] = useState('');
  const [objective, setObjective] = useState('');
  const [template, setTemplate] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ResumeView>('/resume');
      setResume(data);
      setSummary(data.summary ?? '');
      setObjective(data.careerObjective ?? '');
      setTemplate(data.template ?? 'classic');
    } catch (err) {
      setError(errorMessage(err, 'Could not load your resume.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put<ResumeView>('/resume', {
        summary: summary.trim() === '' ? null : summary.trim(),
        careerObjective: objective.trim() === '' ? null : objective.trim(),
        template,
      });
      setResume(data);
      toast.success('Resume updated.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save your resume.'));
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/resume/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'careerhub-resume.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not generate the PDF.'));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Spinner label="Loading your resume" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!resume) return null;

  return (
    <>
      <PageHeader
        title="Resume builder"
        subtitle="The resume is generated from your profile. Edit the summary here and download a PDF."
        actions={
          <button type="button" className="btn-primary" onClick={download} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </button>
        }
      />

      <form className="card mb-6" onSubmit={save}>
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Resume content</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="label" htmlFor="objective">Career objective</label>
            <textarea id="objective" rows={3} className="input" maxLength={1000} value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="A short statement about the kind of role you are looking for." />
          </div>
          <div>
            <label className="label" htmlFor="summary">Professional summary</label>
            <textarea id="summary" rows={5} className="input" maxLength={2000} value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Two or three sentences about your strengths and what you have built." />
          </div>
          <div className="max-w-xs">
            <label className="label" htmlFor="template">Template</label>
            <select id="template" className="input" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="classic">Classic</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 px-5 py-3">
          <button type="submit" className="btn-primary" disabled={saving}>Save resume</button>
        </div>
      </form>

      <div className="card">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Preview</h2>
        </div>
        <div className="card-body space-y-6">
          <header>
            <h3 className="text-xl font-semibold text-slate-900">{resume.personal.fullName}</h3>
            <p className="text-sm text-slate-500">
              {[resume.personal.email, resume.personal.phone, resume.personal.location].filter(Boolean).join(' - ')}
            </p>
            <p className="text-sm text-slate-500">
              {[resume.personal.githubUrl, resume.personal.linkedinUrl, resume.personal.portfolioUrl]
                .filter(Boolean)
                .join(' - ')}
            </p>
          </header>

          {objective && (
            <section>
              <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Objective</h4>
              <p className="text-sm text-slate-700">{objective}</p>
            </section>
          )}

          {summary && (
            <section>
              <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h4>
              <p className="text-sm text-slate-700">{summary}</p>
            </section>
          )}

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Education</h4>
            {resume.education.length === 0 ? (
              <p className="text-sm text-slate-500">Add education on your profile page.</p>
            ) : (
              <ul className="space-y-2">
                {resume.education.map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="font-medium text-slate-800">{item.degree}{item.specialization ? ` - ${item.specialization}` : ''}</p>
                    <p className="text-slate-500">
                      {item.institution} - {item.startYear ?? '?'} to {item.endYear ?? 'present'}
                      {item.grade ? ` - ${item.grade}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Skills</h4>
            {resume.skills.length === 0 ? (
              <p className="text-sm text-slate-500">Add skills on the skills page.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span key={skill.id} className="badge bg-brand-50 text-brand-700">
                    {skill.skillName} ({skill.proficiency.charAt(0) + skill.proficiency.slice(1).toLowerCase()})
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Projects</h4>
            {resume.projects.length === 0 ? (
              <p className="text-sm text-slate-500">Add projects on your profile page.</p>
            ) : (
              <ul className="space-y-2">
                {resume.projects.map((project) => (
                  <li key={project.id} className="text-sm">
                    <p className="font-medium text-slate-800">{project.title}</p>
                    {project.techStack && <p className="text-slate-500">{project.techStack}</p>}
                    {project.description && <p className="text-slate-600">{project.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Experience</h4>
            {resume.experience.length === 0 ? (
              <p className="text-sm text-slate-500">No experience recorded.</p>
            ) : (
              <ul className="space-y-2">
                {resume.experience.map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="font-medium text-slate-800">{item.roleTitle} at {item.companyName}</p>
                    <p className="text-slate-500">
                      {formatDate(item.startDate)} - {item.currentlyWorking ? 'present' : formatDate(item.endDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Certificates</h4>
            {resume.certificates.length === 0 ? (
              <p className="text-sm text-slate-500">Only verified certificates appear on the PDF.</p>
            ) : (
              <ul className="space-y-1">
                {resume.certificates.map((certificate) => (
                  <li key={certificate.id} className="text-sm text-slate-700">
                    {certificate.name} - {certificate.issuingOrganization} ({formatDate(certificate.issueDate)})
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
