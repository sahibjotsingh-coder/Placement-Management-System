import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import api from '../api/axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get('/notifications/me');
      setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    try {
      await api.put('/notifications/me/read-all');
      load();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <Loading />
      ) : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" message="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.notification_id}
              className={`bg-white rounded-xl border p-4 flex justify-between items-start transition ${
                n.is_read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <div>
                <p className={`font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.notification_id)}
                  className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap ml-4"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}