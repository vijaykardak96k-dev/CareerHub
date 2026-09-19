import { useCallback, useEffect, useState } from 'react';
import { BellRing, CheckCheck } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../components/Ui';
import { formatDateTime, humanise } from '../lib/format';
import type { NotificationView, PageResponse } from '../lib/types';

/** Shared by the student and company notification pages; the API is the same. */
export function NotificationsPage() {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<NotificationView> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get<PageResponse<NotificationView>>('/notifications', {
        params: { page, size: 15 },
      });
      setData(response);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your notifications.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (notification: NotificationView) => {
    if (notification.read) return;
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not mark this as read.'));
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update your notifications.'));
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Application updates, approvals and college announcements."
        actions={
          <button type="button" className="btn-secondary" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      {loading && <Spinner label="Loading notifications" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="card">
          {data.content.length === 0 ? (
            <EmptyState title="Nothing here yet" description="You will see updates as your applications progress." />
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {data.content.map((notification) => (
                  <li
                    key={notification.id}
                    className={`flex items-start gap-3 px-5 py-4 ${notification.read ? '' : 'bg-brand-50/40'}`}
                  >
                    <BellRing className={`mt-0.5 h-4 w-4 shrink-0 ${notification.read ? 'text-slate-300' : 'text-brand-600'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-800">{notification.title}</p>
                        <span className="badge bg-slate-100 text-slate-600">{humanise(notification.type)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(notification.createdAt)}</p>
                    </div>
                    {!notification.read && (
                      <button type="button" className="btn-secondary shrink-0 px-3 py-1"
                        onClick={() => markRead(notification)}>
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}
    </>
  );
}
