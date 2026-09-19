import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Spinner, StatusBadge } from '../../components/Ui';
import { Modal } from '../../components/Modal';
import { formatDate } from '../../lib/format';
import type { CertificateView } from '../../lib/types';

const EMPTY = { name: '', issuingOrganization: '', issueDate: '', credentialId: '', credentialUrl: '' };

export function StudentCertificatesPage() {
  const toast = useToast();
  const [items, setItems] = useState<CertificateView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<CertificateView[]>('/certificates/mine');
      setItems(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your certificates.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEdit = (item: CertificateView) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      issuingOrganization: item.issuingOrganization,
      issueDate: item.issueDate ?? '',
      credentialId: item.credentialId ?? '',
      credentialUrl: item.credentialUrl ?? '',
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        issuingOrganization: form.issuingOrganization,
        issueDate: form.issueDate === '' ? null : form.issueDate,
        credentialId: form.credentialId === '' ? null : form.credentialId,
        credentialUrl: form.credentialUrl === '' ? null : form.credentialUrl,
      };
      if (editingId) {
        await api.put(`/certificates/${editingId}`, payload);
      } else {
        await api.post('/certificates', payload);
      }
      toast.success('Certificate saved. The college will review it.');
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this certificate.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: CertificateView) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await api.delete(`/certificates/${item.id}`);
      toast.success('Certificate deleted.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete this certificate.'));
    }
  };

  if (loading) return <Spinner label="Loading certificates" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Certificates"
        subtitle="Added certificates stay pending until the placement office verifies them."
        actions={
          <button type="button" className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add certificate
          </button>
        }
      />

      <div className="card">
        {items.length === 0 ? (
          <EmptyState
            title="No certificates yet"
            description="Add your course and platform certificates so they appear on your resume."
            action={
              <button type="button" className="btn-primary" onClick={openAdd}>
                Add your first certificate
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Certificate</th>
                  <th>Issued by</th>
                  <th>Issue date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      {item.credentialUrl && (
                        <a href={item.credentialUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                          View credential <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {item.reviewNote && <p className="mt-1 text-xs text-slate-500">Note: {item.reviewNote}</p>}
                    </td>
                    <td>{item.issuingOrganization}</td>
                    <td>{formatDate(item.issueDate)}</td>
                    <td><StatusBadge status={item.status} /></td>
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
        title={editingId ? 'Edit certificate' : 'Add certificate'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="cert-form" className="btn-primary" disabled={saving}>Save</button>
          </>
        }
      >
        <form id="cert-form" className="space-y-4" onSubmit={submit}>
          <div>
            <label className="label">Certificate name</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Issuing organisation</label>
            <input className="input" required value={form.issuingOrganization}
              onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Issue date</label>
              <input type="date" className="input" value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Credential ID</label>
              <input className="input" value={form.credentialId}
                onChange={(e) => setForm({ ...form, credentialId: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Credential URL</label>
            <input className="input" placeholder="https://" value={form.credentialUrl}
              onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })} />
          </div>
        </form>
      </Modal>
    </>
  );
}
