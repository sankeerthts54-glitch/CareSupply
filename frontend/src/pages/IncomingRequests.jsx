import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Inbox,
  Check,
  X,
  Clock,
  Building2,
  Package,
  Calendar,
  AlertCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Requested', 'Approved', 'Completed', 'Rejected'];

export const IncomingRequests = () => {
  const [searchParams] = useSearchParams();
  const listingIdFilter = searchParams.get('listingId');

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Reject modal state
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIncomingRequests = async () => {
    try {
      setIsLoading(true);
      let data = [];
      try {
        const url = listingIdFilter
          ? `/requests/received?listingId=${listingIdFilter}`
          : '/requests/received';
        const res = await api.get(url);
        data = res.data?.data || res.data?.requests || res.data || [];
      } catch {
        const res = await api.get('/requests');
        data = res.data?.data || res.data?.requests || res.data || [];
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load incoming requests:', err);
      toast.error('Failed to load requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingRequests();
  }, [listingIdFilter]);

  const handleApprove = async (id) => {
    try {
      setIsUpdating(true);
      try {
        await api.patch(`/requests/${id}/status`, { status: 'approved' });
      } catch {
        await api.patch(`/requests/${id}/approve`);
      }

      toast.success('Request approved! You can now coordinate handover.');
      setRequests((prev) =>
        prev.map((r) => ((r._id || r.id) === id ? { ...r, status: 'approved' } : r))
      );
    } catch (err) {
      console.error('Failed to approve request:', err);
      toast.error(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModalReq) return;

    try {
      setIsUpdating(true);
      const id = rejectModalReq._id || rejectModalReq.id;
      try {
        await api.patch(`/requests/${id}/status`, {
          status: 'rejected',
          reason: rejectReason,
        });
      } catch {
        await api.patch(`/requests/${id}/reject`, { reason: rejectReason });
      }

      toast.success('Request rejected.');
      setRequests((prev) =>
        prev.map((r) =>
          (r._id || r.id) === id
            ? { ...r, status: 'rejected', rejectionReason: rejectReason }
            : r
        )
      );
      setRejectModalReq(null);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject request:', err);
      toast.error(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'requested').toLowerCase();
    switch (s) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'approved':
        return <Badge variant="info">Approved</Badge>;
      case 'handover_scheduled':
      case 'dispatched':
      case 'received':
        return <Badge variant="primary">{s.replace('_', ' ')}</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="danger">{s}</Badge>;
      default:
        return <Badge variant="warning">Requested (Pending)</Badge>;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'All') return true;
    const s = String(r.status || 'requested').toLowerCase();
    if (activeTab === 'Requested') return s === 'requested' || s === 'pending';
    return s === activeTab.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Incoming Supply Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve requests from recipient clinics seeking your listed supplies.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === 'All'
              ? requests.length
              : requests.filter((r) => {
                  const s = String(r.status || 'requested').toLowerCase();
                  if (tab === 'Requested') return s === 'requested' || s === 'pending';
                  return s === tab.toLowerCase();
                }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-3 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab
                  ? 'text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner text="Loading incoming requests..." className="py-20" />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests to show"
          description={
            activeTab === 'All'
              ? 'No healthcare partners have requested items from your listings yet.'
              : `There are no requests matching the "${activeTab}" filter.`
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const reqId = req._id || req.id;
            const listingTitle =
              req.listing?.title || req.listingTitle || 'Medical Supplies';
            const recipientOrg =
              req.recipientOrg?.name ||
              req.recipient?.organisationName ||
              req.recipient?.name ||
              'Community Clinic';
            const status = String(req.status || 'requested').toLowerCase();
            const isPending = status === 'requested' || status === 'pending';
            const rawDate = req.createdAt || req.date;
            const dateStr = rawDate
              ? format(typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate), 'dd MMM yyyy, HH:mm')
              : 'Recently';

            return (
              <div
                key={reqId}
                className="card p-5 sm:p-6 border border-gray-100 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{recipientOrg}</h3>
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Requested {req.quantity} units for{' '}
                        <strong className="text-gray-800 font-semibold">{listingTitle}</strong> • {dateStr}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/requests/${reqId}`}
                    className="btn-secondary text-xs py-1.5 px-3 self-start md:self-auto flex items-center gap-1.5"
                  >
                    View Timeline <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Message body */}
                {req.message && (
                  <div className="mt-3.5 p-3.5 bg-gray-50 rounded-xl text-xs text-gray-700 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 block mb-0.5">Recipient's Clinical Statement:</span>
                      <p className="leading-relaxed text-gray-600">{req.message}</p>
                    </div>
                  </div>
                )}

                {/* Actions for Pending */}
                {isPending && (
                  <div className="mt-4 pt-3 flex items-center justify-end gap-3 border-t border-gray-50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectModalReq(req);
                        setRejectReason('');
                      }}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                      icon={X}
                    >
                      Reject Request
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(reqId)}
                      isLoading={isUpdating}
                      icon={Check}
                    >
                      Approve Request
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-gray-900">Decline Request</h3>
            <p className="text-xs text-gray-500 mt-1">
              Please specify a reason for rejecting this allocation request so the recipient is informed.
            </p>

            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label className="label">Reason for Rejection *</label>
                <textarea
                  rows="3"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Items already committed to another clinic or logistics unable to service location."
                  className="input-field text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectModalReq(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isUpdating}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomingRequests;
