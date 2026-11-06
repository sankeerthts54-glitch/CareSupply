import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export const Notifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const unreadList = notifications.filter((n) => !n.isRead && !n.read);
  const readList = notifications.filter((n) => n.isRead || n.read);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request_approved':
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'request_rejected':
      case 'rejected':
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'handover_scheduled':
      case 'dispatched':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'admin':
        return <ShieldCheck className="w-5 h-5 text-primary-700" />;
      default:
        return <Package className="w-5 h-5 text-primary-600" />;
    }
  };

  const formatTimestamp = (dateStr) => {
    try {
      if (!dateStr) return 'Recently';
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
      return format(date, 'dd MMM yyyy, HH:mm');
    } catch {
      return 'Recently';
    }
  };

  const renderNotificationItem = (notif) => {
    const id = notif._id || notif.id;
    const isRead = notif.isRead || notif.read;
    const link =
      notif.link ||
      (notif.requestId
        ? `/requests/${notif.requestId}`
        : notif.listingId
        ? `/listings/${notif.listingId}`
        : null);

    return (
      <div
        key={id}
        onClick={() => {
          if (!isRead) markAsRead(id);
        }}
        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
          !isRead
            ? 'bg-primary-50/20 border-primary-200 hover:bg-primary-50/40'
            : 'bg-white border-gray-100 hover:bg-gray-50'
        }`}
      >
        <div className="p-2.5 rounded-xl bg-gray-100 shrink-0 mt-0.5">
          {getNotificationIcon(notif.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm ${!isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
              {notif.title || notif.message}
            </h4>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatTimestamp(notif.createdAt || notif.timestamp || notif.date)}
            </span>
          </div>

          {notif.title && notif.message && (
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {notif.message}
            </p>
          )}

          {link && (
            <div className="mt-2.5">
              <Link
                to={link}
                className="text-xs font-semibold text-primary-600 hover:text-primary-800 inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                View Details <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {!isRead && (
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600 shrink-0 mt-2" />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated on listing requests, verification approvals, and handover events.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            icon={CheckCheck}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {isLoading && notifications.length === 0 ? (
        <LoadingSpinner text="Loading notifications..." className="py-20" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are completely caught up! We will notify you when listings receive requests or updates."
        />
      ) : (
        <div className="space-y-6">
          {/* Unread Section */}
          {unreadList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-800">
                  New Notifications ({unreadList.length})
                </span>
                <span className="w-2 h-2 rounded-full bg-primary-600" />
              </div>
              <div className="space-y-2.5">
                {unreadList.map(renderNotificationItem)}
              </div>
            </div>
          )}

          {/* Read Section */}
          {readList.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                Earlier Notifications
              </span>
              <div className="space-y-2.5">
                {readList.map(renderNotificationItem)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
