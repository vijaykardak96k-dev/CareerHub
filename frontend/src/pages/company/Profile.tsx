import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ErrorState, PageHeader, Spinner, StatusBadge } from '../../components/Ui';
import { formatDate } from '../../lib/format';
import type { CompanyView } from '../../lib/types';

export function CompanyProfilePage() {
  const toast = useToast();
  const [company, setCompany] = useState<CompanyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<CompanyView>('/companies/me');
      setCompany(data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your company profile.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      const blank = (value: string | null) => (value && value.trim() !== '' ? value.trim() : null);
      const { data } = await api.put<CompanyView>('/companies/me', {
        name: company.name,
        logoUrl: blank(company.logoUrl),
        description: blank(company.description),
        industry: blank(company.industry),
        website: blank(company.website),
        location: blank(company.location),
        contactEmail: blank(company.contactEmail),
      });
      setCompany(data);
      toast.success('Company profile saved.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save the company profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading company profile" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!company) return null;

  const update = (patch: Partial<CompanyView>) => setCompany({ ...company, ...patch });

  return (
    <>
      <PageHeader title="Company profile" subtitle="Students see this information on every opening you publish." />

      <div className="card mb-6">
        <div className="card-body flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Verification status</p>
            <div className="mt-1"><StatusBadge status={company.status} /></div>
            {company.reviewNote && <p className="mt-2 text-sm text-slate-600">Note from the college: {company.reviewNote}</p>}
          </div>
          <p className="text-sm text-slate-500">Registered {formatDate(company.createdAt)}</p>
        </div>
      </div>

      <form className="card" onSubmit={save}>
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">Details</h2>
        </div>
        <div className="card-body grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Company name</label>
            <input className="input" required value={company.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div>
            <label className="label">Login email</label>
            <input className="input bg-slate-100" value={company.email} readOnly />
          </div>
          <div>
            <label className="label">Industry</label>
            <input className="input" value={company.industry ?? ''} onChange={(e) => update({ industry: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={company.location ?? ''} onChange={(e) => update({ location: e.target.value })} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" placeholder="https://" value={company.website ?? ''}
              onChange={(e) => update({ website: e.target.value })} />
          </div>
          <div>
            <label className="label">Contact email</label>
            <input type="email" className="input" value={company.contactEmail ?? ''}
              onChange={(e) => update({ contactEmail: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Logo URL</label>
            <input className="input" value={company.logoUrl ?? ''} onChange={(e) => update({ logoUrl: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">About the company</label>
            <textarea rows={5} className="input" maxLength={2000} value={company.description ?? ''}
              onChange={(e) => update({ description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 px-5 py-3">
          <button type="submit" className="btn-primary" disabled={saving}>Save profile</button>
        </div>
      </form>
    </>
  );
}
