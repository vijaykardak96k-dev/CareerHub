import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import type { AdminQuestionView, AssessmentView, CategoryView, SkillView } from '../../lib/types';

interface OptionDraft {
  optionText: string;
  correct: boolean;
}

interface QuestionDraft {
  questionText: string;
  marks: number;
  options: OptionDraft[];
}

function emptyQuestion(): QuestionDraft {
  return {
    questionText: '',
    marks: 1,
    options: [
      { optionText: '', correct: true },
      { optionText: '', correct: false },
    ],
  };
}

export function AdminAssessmentsPage() {
  const toast = useToast();
  const [assessments, setAssessments] = useState<AssessmentView[]>([]);
  const [skills, setSkills] = useState<SkillView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState({
    title: '',
    description: '',
    skillId: '',
    durationMinutes: '15',
    passingPercentage: '50',
    active: true,
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);

  const [viewing, setViewing] = useState<AdminQuestionView[] | null>(null);
  const [viewingTitle, setViewingTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, catalog] = await Promise.all([
        api.get<AssessmentView[]>('/admin/assessments'),
        api.get<CategoryView[]>('/admin/skills'),
      ]);
      setAssessments(list.data);
      setSkills(catalog.data.flatMap((category) => category.skills));
    } catch (err) {
      setError(errorMessage(err, 'Could not load assessments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setCorrect = (questionIndex: number, optionIndex: number) => {
    setQuestions((current) =>
      current.map((question, index) =>
        index !== questionIndex
          ? question
          : {
              ...question,
              options: question.options.map((option, oIndex) => ({ ...option, correct: oIndex === optionIndex })),
            },
      ),
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = questions.find((question) => !question.options.some((option) => option.correct));
    if (invalid) {
      toast.error('Every question needs exactly one option marked as correct.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/assessments', {
        title: meta.title,
        description: meta.description.trim() === '' ? null : meta.description.trim(),
        skillId: meta.skillId,
        durationMinutes: Number(meta.durationMinutes),
        passingPercentage: Number(meta.passingPercentage),
        active: meta.active,
        questions,
      });
      toast.success('Assessment published.');
      setOpen(false);
      setQuestions([emptyQuestion()]);
      setMeta({ title: '', description: '', skillId: '', durationMinutes: '15', passingPercentage: '50', active: true });
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this assessment.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (assessment: AssessmentView) => {
    if (!window.confirm(`Delete "${assessment.title}"?`)) return;
    try {
      await api.delete(`/admin/assessments/${assessment.id}`);
      toast.success('Assessment deleted.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this assessment.'));
    }
  };

  const viewQuestions = async (assessment: AssessmentView) => {
    try {
      const { data } = await api.get<AdminQuestionView[]>(`/admin/assessments/${assessment.id}/questions`);
      setViewing(data);
      setViewingTitle(assessment.title);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load the questions.'));
    }
  };

  if (loading) return <Spinner label="Loading assessments" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle="Multiple choice tests per skill. Attempts are scored on the server."
        actions={
          <button type="button" className="btn-primary" disabled={skills.length === 0}
            onClick={() => { setMeta({ ...meta, skillId: skills[0]?.id ?? '' }); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New assessment
          </button>
        }
      />

      <div className="card">
        {assessments.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description={
              skills.length === 0
                ? 'Add skills to the catalogue first; every assessment belongs to a skill.'
                : 'Create an assessment so students can prove what they know.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Skill</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Pass mark</th>
                  <th>Visible</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td className="font-medium text-slate-800">{assessment.title}</td>
                    <td>{assessment.skillName}</td>
                    <td>{assessment.questionCount}</td>
                    <td>{assessment.durationMinutes} min</td>
                    <td>{assessment.passingPercentage}%</td>
                    <td>
                      <span className={`badge ${assessment.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {assessment.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button type="button" className="btn-ghost px-2 py-1" onClick={() => viewQuestions(assessment)}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" className="btn-ghost px-2 py-1 text-rose-600"
                          onClick={() => remove(assessment)}>
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
        title="New assessment"
        width="max-w-3xl"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="assessment-form" className="btn-primary" disabled={saving}>Save</button>
          </>
        }
      >
        <form id="assessment-form" className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input className="input" required maxLength={150} value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <input className="input" maxLength={1000} value={meta.description}
                onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Skill</label>
              <select className="input" required value={meta.skillId}
                onChange={(e) => setMeta({ ...meta, skillId: e.target.value })}>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name} ({skill.categoryName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" min={1} max={180} className="input" required value={meta.durationMinutes}
                onChange={(e) => setMeta({ ...meta, durationMinutes: e.target.value })} />
            </div>
            <div>
              <label className="label">Passing percentage</label>
              <input type="number" min={1} max={100} className="input" required value={meta.passingPercentage}
                onChange={(e) => setMeta({ ...meta, passingPercentage: e.target.value })} />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
              <input type="checkbox" checked={meta.active}
                onChange={(e) => setMeta({ ...meta, active: e.target.checked })} />
              Visible to students
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Questions</h3>
              <button type="button" className="btn-secondary px-3 py-1.5"
                onClick={() => setQuestions([...questions, emptyQuestion()])}>
                <Plus className="h-4 w-4" /> Add question
              </button>
            </div>

            {questions.map((question, questionIndex) => (
              <fieldset key={questionIndex} className="rounded-md border border-slate-200 p-4">
                <legend className="px-1 text-sm font-medium text-slate-700">Question {questionIndex + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="sm:col-span-3">
                    <label className="label">Question text</label>
                    <input className="input" required maxLength={1000} value={question.questionText}
                      onChange={(e) =>
                        setQuestions(questions.map((item, index) =>
                          index === questionIndex ? { ...item, questionText: e.target.value } : item))} />
                  </div>
                  <div>
                    <label className="label">Marks</label>
                    <input type="number" min={1} max={20} className="input" required value={question.marks}
                      onChange={(e) =>
                        setQuestions(questions.map((item, index) =>
                          index === questionIndex ? { ...item, marks: Number(e.target.value) } : item))} />
                  </div>
                </div>

                <p className="mt-3 text-sm font-medium text-slate-700">Options (select the correct one)</p>
                <div className="mt-2 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${questionIndex}`} checked={option.correct}
                        onChange={() => setCorrect(questionIndex, optionIndex)} />
                      <input className="input flex-1" required maxLength={500} value={option.optionText}
                        onChange={(e) =>
                          setQuestions(questions.map((item, index) =>
                            index !== questionIndex
                              ? item
                              : {
                                  ...item,
                                  options: item.options.map((o, oIndex) =>
                                    oIndex === optionIndex ? { ...o, optionText: e.target.value } : o),
                                }))} />
                      {question.options.length > 2 && (
                        <button type="button" className="btn-ghost px-2 py-1 text-rose-600"
                          onClick={() =>
                            setQuestions(questions.map((item, index) =>
                              index !== questionIndex
                                ? item
                                : { ...item, options: item.options.filter((_, oIndex) => oIndex !== optionIndex) }))}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  {question.options.length < 6 && (
                    <button type="button" className="btn-secondary px-3 py-1"
                      onClick={() =>
                        setQuestions(questions.map((item, index) =>
                          index !== questionIndex
                            ? item
                            : { ...item, options: [...item.options, { optionText: '', correct: false }] }))}>
                      Add option
                    </button>
                  )}
                  {questions.length > 1 && (
                    <button type="button" className="btn-ghost px-3 py-1 text-rose-600"
                      onClick={() => setQuestions(questions.filter((_, index) => index !== questionIndex))}>
                      Remove question
                    </button>
                  )}
                </div>
              </fieldset>
            ))}
          </div>
        </form>
      </Modal>

      <Modal open={viewing !== null} title={`Questions: ${viewingTitle}`} width="max-w-2xl"
        onClose={() => setViewing(null)}>
        {viewing && (
          <ol className="space-y-4">
            {viewing.map((question, index) => (
              <li key={question.id}>
                <p className="font-medium text-slate-800">
                  {index + 1}. {question.questionText}{' '}
                  <span className="text-xs text-slate-400">({question.marks} marks)</span>
                </p>
                <ul className="mt-1 space-y-1 pl-4">
                  {question.options.map((option) => (
                    <li key={option.id}
                      className={`text-sm ${option.correct ? 'font-medium text-emerald-700' : 'text-slate-600'}`}>
                      {option.optionText}
                      {option.correct ? ' (correct)' : ''}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </Modal>
    </>
  );
}
