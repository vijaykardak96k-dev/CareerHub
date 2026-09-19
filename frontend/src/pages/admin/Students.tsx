import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, ProgressBar, Spinner } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import type { PageResponse, StudentProfile } from '../../lib/types';

export function AdminStudentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<StudentProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudentProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<StudentProfile>>('/admin/students', {
        params: { search: search || undefined, page, size: 10 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load students.'));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (student: StudentProfile) => {
    const action = student.active ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${action} ${student.fullName}?`)) return;
    try {
      await api.patch(`/admin/users/${student.id}/active`, { active: !student.active });
      toast.success(`${action}d.`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not change this account.'));
    }
  };

  return (
    <>
      <PageHeader title="Students" subtitle="Registered student accounts and their profile completeness." />

      <div className="card mb-6">
        <div className="card-body max-w-md">
          <label className="label" htmlFor="student-search">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input id="student-search" className="input pl-9" placeholder="Name, email or college" value={search}
              onChange={(e) => { setPage(0); setSearch(e.target.value); }} />
          </div>
        </div>
      </div>

      {loading && <Spinner label="Loading students" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="No students found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>College</th>
                      <th>Graduation</th>
                      <th>CGPA</th>
                      <th>Profile</th>
                      <th>Account</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <button type="button" className="font-medium text-brand-700 hover:underline"
                            onClick={() => setSelected(student)}>
                            {student.fullName}
                          </button>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </td>
                        <td>{student.college || '-'}</td>
                        <td>{student.graduationYear ?? '-'}</td>
                        <td>{student.cgpa ?? '-'}</td>
                        <td className="w-40">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={student.profileCompletion} />
                            <span className="text-xs text-slate-500">{student.profileCompletion}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${student.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {student.active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-end">
                            <button type="button" className={student.active ? 'btn-danger px-3 py-1' : 'btn-secondary px-3 py-1'}
                              onClick={() => toggleActive(student)}>
                              {student.active ? 'Deactivate' : 'Activate'}
                            </button>
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

      <Modal open={selected !== null} title="Student profile" onClose={() => setSelected(null)}>
        {selected && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-800">{selected.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Contact</dt>
              <dd className="text-slate-700">{[selected.email, selected.phone].filter(Boolean).join(' - ')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Course</dt>
              <dd className="text-slate-700">
                {[selected.college, selected.department, selected.course].filter(Boolean).join(' - ') || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="text-slate-700">{selected.location || '-'}</dd>
            </div>
            {selected.bio && (
              <div>
                <dt className="text-slate-500">About</dt>
                <dd className="text-slate-700">{selected.bio}</dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </>
  );
}
