import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';

interface NotificationResponse {
  id: number;
  type: string;
  status: string;
  message: string;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  APPOINTMENT_CONFIRMATION: 'ti-calendar-check',
  APPOINTMENT_CANCELLATION: 'ti-calendar-x',
  APPOINTMENT_REMINDER: 'ti-bell',
  PRESCRIPTION_READY: 'ti-pill',
  ANALYSIS_READY: 'ti-microscope',
  WELCOME_EMAIL: 'ti-heart',
};

const typeColors: Record<string, string> = {
  APPOINTMENT_CONFIRMATION: 'text-emerald-500 bg-emerald-50',
  APPOINTMENT_CANCELLATION: 'text-red-500 bg-red-50',
  APPOINTMENT_REMINDER: 'text-blue-500 bg-blue-50',
  PRESCRIPTION_READY: 'text-purple-500 bg-purple-50',
  ANALYSIS_READY: 'text-orange-500 bg-orange-50',
  WELCOME_EMAIL: 'text-pink-500 bg-pink-50',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const res = await api.get(`/api/notifications/user/${user!.id}`);
      return res.data.data as NotificationResponse[];
    },
    enabled: !!user?.id,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => n.status !== 'READ');
      await Promise.all(unread.map(n => api.patch(`/api/notifications/${n.id}/read`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
  });

  const unreadCount = notifications.filter(n => n.status !== 'READ').length;

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-sm text-blue-500 hover:underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="ti ti-bell text-slate-300 text-2xl" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">No notifications</h2>
          <p className="text-sm text-slate-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map(n => {
            const isRead = n.status === 'READ';
            const iconClass = typeColors[n.type] || 'text-slate-500 bg-slate-100';
            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-all ${
                  isRead
                    ? 'border-slate-100 opacity-60'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {/* Dot indicator */}
                <div className="relative flex-shrink-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconClass}`}>
                    <i className={`ti ${typeIcons[n.type] || 'ti-bell'} text-sm`} aria-hidden="true" />
                  </div>
                  {!isRead && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isRead ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                    {isRead && (
                      <span className="text-xs text-slate-300 flex items-center gap-0.5">
                        <i className="ti ti-checks text-xs" aria-hidden="true" />
                        Read
                      </span>
                    )}
                  </div>
                </div>

                {!isRead && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 border border-blue-100 hover:border-blue-300 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    title="Mark as read"
                  >
                    <i className="ti ti-check text-xs" aria-hidden="true" />
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}