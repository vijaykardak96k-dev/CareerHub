import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, ListChecks, XCircle } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDateTime } from '../../lib/format';
import type { AssessmentView, AttemptResult, AttemptStart } from '../../lib/types';

export function StudentAssessmentsPage() {
  const toast = useToast();
  const [assessments, setAssessments] = useState<AssessmentView[]>([]);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<AttemptStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, attempts] = await Promise.all([
        api.get<AssessmentView[]>('/assessments'),
        api.get<AttemptResult[]>('/assessments/results'),
      ]);
      setAssessments(list.data);
      setResults(attempts.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load assessments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const start = async (assessment: AssessmentView) => {
    try {
      const { data } = await api.get<AttemptStart>(`/assessments/${assessment.id}/start`);
      setAttempt(data);
      setAnswers({});
    } catch (err) {
      toast.error(errorMessage(err, 'Could not start this assessment.'));
    }
  };

  const submit = async () => {
    if (!attempt) return;
    const unanswered = attempt.questions.filter((question) => !answers[question.id]);
    if (unanswered.length > 0 && !window.confirm(`${unanswered.length} question(s) are unanswered. Submit anyway?`)) {
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        answers: attempt.questions.map((question) => ({
          questionId: question.id,
          optionId: answers[question.id] ?? null,
        })),
      };
      const { data } = await api.post<AttemptResult>(`/assessments/${attempt.assessmentId}/submit`, payload);
      setAttempt(null);
      setResult(data);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not submit this attempt.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading assessments" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Skill assessments"
        subtitle="Multiple choice tests. Answers are checked and scored on the server, never in the browser."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assessments.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <div className="card">
              <EmptyState title="No assessments published yet" description="The college adds assessments per skill." />
            </div>
          </div>
        )}
        {assessments.map((assessment) => (
          <div key={assessment.id} className="card flex flex-col">
            <div className="card-body flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{assessment.title}</h2>
                <span className="badge bg-brand-50 text-brand-700">{assessment.skillName}</span>
              </div>
              {assessment.description && <p className="mt-2 text-sm text-slate-600">{assessment.description}</p>}
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <ListChecks className="h-4 w-4" />{assessment.questionCount} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />{assessment.durationMinutes} minutes
                </span>
                <span>Pass at {assessment.passingPercentage}%</span>
              </p>
            </div>
            <div className="border-t border-slate-200 px-5 py-3">
              <button type="button" className="btn-primary w-full" onClick={() => start(assessment)}>
                Start assessment
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Your results</h2>
        </div>
        {results.length === 0 ? (
          <EmptyState title="No attempts yet" description="Take an assessment above to record your first score." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Skill</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Outcome</th>
                  <th>Taken</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-slate-800">{item.assessmentTitle}</td>
                    <td>{item.skillName}</td>
                    <td>{item.score} / {item.totalMarks}</td>
                    <td>{item.percentage}%</td>
                    <td>
                      <span className={`badge ${item.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {item.passed ? 'Passed' : 'Not passed'}
                      </span>
                    </td>
                    <td>{formatDateTime(item.attemptedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={attempt !== null}
        title={attempt ? attempt.title : 'Assessment'}
        width="max-w-3xl"
        onClose={() => setAttempt(null)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setAttempt(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={submit} disabled={submitting}>
              Submit answers
            </button>
          </>
        }
      >
        {attempt && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500">
              {attempt.questions.length} questions - {attempt.totalMarks} marks - suggested time {attempt.durationMinutes} minutes
            </p>
            {attempt.questions.map((question, index) => (
              <fieldset key={question.id} className="rounded-md border border-slate-200 p-4">
                <legend className="px-1 text-sm font-medium text-slate-700">
                  Question {index + 1} ({question.marks} marks)
                </legend>
                <p className="mb-3 text-slate-800">{question.questionText}</p>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-50">
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={answers[question.id] === option.id}
                        onChange={() => setAnswers({ ...answers, [question.id]: option.id })}
                      />
                      <span className="text-sm text-slate-700">{option.optionText}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={result !== null} title="Your result" onClose={() => setResult(null)}>
        {result && (
          <div className="space-y-3 text-center">
            {result.passed ? (
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            ) : (
              <XCircle className="mx-auto h-10 w-10 text-rose-600" />
            )}
            <p className="text-3xl font-semibold text-slate-900">{result.percentage}%</p>
            <p className="text-sm text-slate-600">
              {result.score} of {result.totalMarks} marks - {result.correctAnswers} of {result.totalQuestions} correct
            </p>
            <p className="text-sm font-medium text-slate-700">
              {result.passed ? 'You passed this assessment.' : 'You did not reach the passing score this time.'}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
