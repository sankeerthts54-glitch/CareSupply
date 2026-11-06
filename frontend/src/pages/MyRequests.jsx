import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Send,
  Building2,
  Package,
  Calendar,
  ExternalLink,
  Search,
  Clock,
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Requested', 'Approved', 'Completed', 'Rejected'];

export const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyRequests = async () => {
    try {
      setIsLoading(true);
      let data = [];
      try {
        const res = await api.get('/requests/sent');
        data = res.data?.data || res.data?.requests || res.data || [];
      } catch {
        const res = await api.get('/requests');
        data = res.data?.data || res.data?.requests || res.data || [];
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load my requests:', err);
      toast.error('Failed to load requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

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
            My Supply Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track allocations requested by your healthcare organisation and monitor delivery handovers.
          </p>
        </div>

        <Link to="/browse" className="btn-primary text-sm shadow-sm flex items-center gap-2">
          <Search className="w-4 h-4" /> Browse More Supplies
        </Link>
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
        <LoadingSpinner text="Loading your requests..." className="py-20" />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No requests sent yet"
          description={
            activeTab === 'All'
              ? "You haven't requested any medical supplies yet. Browse available surplus inventory to find what your clinic needs."
              : `No requests with status "${activeTab}".`
          }
          actionLabel="Browse Available Supplies"
          actionIcon={Search}
          onAction={() => (window.location.href = '/browse')}
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const reqId = req._id || req.id;
            const listing = req.listing || {};
            const listingTitle = listing.title || req.listingTitle || 'Medical Supply Item';
            const donorOrg =
              req.donorOrg?.name ||
              req.donor?.organisationName ||
              listing.donorOrg?.name ||
              'Donor Partner';
            const rawDate = req.createdAt || req.date;
            const dateStr = rawDate
              ? format(typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate), 'dd MMM yyyy, HH:mm')
              : 'Recently';

            return (
              <div
                key={reqId}
                className="card p-5 sm:p-6 border border-gray-100 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{listingTitle}</h3>
                        {getStatusBadge(req.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          Donor: <strong className="text-gray-700">{donorOrg}</strong>
                        </span>
                        <span>
                          Quantity: <strong className="text-gray-700">{req.quantity} units</strong>
                        </span>
                        <span>Requested on {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/requests/${reqId}`}
                    className="btn-primary text-xs py-2 px-4 self-end sm:self-center shadow-xs flex items-center gap-1.5"
                  >
                    View Status & Handover <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
