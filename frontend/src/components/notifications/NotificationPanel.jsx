import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const NotificationPanel = ({
  notifications = [],
  unreadCount = 0,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const topNotifications = notifications.slice(0, 5);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request_approved':
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'request_rejected':
      case 'rejected':
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'handover_scheduled':
      case 'dispatched':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Package className="w-4 h-4 text-primary-600" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    try {
      if (!dateStr) return '';
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-700" />
          <h4 className="font-semibold text-gray-900 text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
        {topNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          topNotifications.map((notif) => {
            const id = notif._id || notif.id;
            const isRead = notif.isRead || notif.read;
            const link = notif.link || (notif.requestId ? `/requests/${notif.requestId}` : notif.listingId ? `/listings/${notif.listingId}` : null);

            return (
              <div
                key={id}
                onClick={() => {
                  if (!isRead) onMarkAsRead(id);
                }}
                className={`p-3.5 transition-colors cursor-pointer hover:bg-gray-50 flex gap-3 items-start ${
                  !isRead ? 'bg-primary-50/30' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-gray-100">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notif.title || notif.message}
                  </p>
                  {notif.title && notif.message && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">
                      {formatTimestamp(notif.createdAt || notif.timestamp || notif.date)}
                    </span>
                    {link && (
                      <Link
                        to={link}
                        onClick={onClose}
                        className="text-[11px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5 font-medium"
                      >
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
                {!isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1" />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 border-t border-gray-100 text-center bg-gray-50/50">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-medium text-primary-700 hover:text-primary-800 inline-flex items-center gap-1"
        >
          View all notifications <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default NotificationPanel;
