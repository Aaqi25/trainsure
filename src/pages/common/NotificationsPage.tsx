import React, { useState, useEffect } from 'react';
import { notificationApi } from '../../services/api.ts';
import { Bell, CheckCheck, Clock, ExternalLink, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.data?.success) setNotifications(res.data.data?.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const handleItemClick = async (notif: any) => {
    try {
      if (!notif.read) {
        await notificationApi.markAsRead(notif._id);
        setNotifications(prev =>
          prev.map(n => (n._id === notif._id ? { ...n, read: true } : n))
        );
      }
      if (notif.link) {
        navigate(notif.link);
      }
    } catch {
      // ignore
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Notification Center & System Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time notifications for assigned coursework, certification expirations, and compliance risks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filter === 'UNREAD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications found matching your view
          </div>
        ) : (
          filtered.map(n => (
            <div
              key={n._id}
              onClick={() => handleItemClick(n)}
              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3.5 ${
                !n.read ? 'bg-indigo-50/30' : ''
              }`}
            >
              <span
                className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                  !n.read ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-300'
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-xs ${
                      !n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                    }`}
                  >
                    {n.title}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                {n.link && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-2 hover:underline">
                    <span>Open linked page</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
