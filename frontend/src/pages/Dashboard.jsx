import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Search,
  Bell,
  Building2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export const Dashboard = () => {
  const { user, organisation } = useAuth();
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingRequests: 0,
    completedHandovers: 0,
    expiringSoon: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const isDonor = user?.role === 'donor';
  const orgName = organisation?.name || user?.organisationName || 'Your Organisation';
  const verificationStatus =
    organisation?.verificationStatus || organisation?.status || 'pending';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch listings
        const listingsRes = await api.get('/listings').catch((e) => ({ data: [] }));
        const rawListings = listingsRes.data?.data || listingsRes.data?.listings || listingsRes.data || [];
        const listings = Array.isArray(rawListings) ? rawListings : [];

        // Fetch requests (received for donor, sent for recipient)
        const requestsEndpoint = isDonor ? '/requests/received' : '/requests/sent';
        let rawRequests = [];
        try {
          const reqRes = await api.get(requestsEndpoint);
          rawRequests = reqRes.data?.data || reqRes.data?.requests || reqRes.data || [];
        } catch {
          // fallback if endpoint differs
          try {
            const reqResFallback = await api.get('/requests');
            rawRequests = reqResFallback.data?.data || reqResFallback.data?.requests || reqResFallback.data || [];
          } catch {
            rawRequests = [];
          }
        }
        const requestsList = Array.isArray(rawRequests) ? rawRequests : [];

        // Count stats
        const activeList = listings.filter((item) => item.status === 'active');
        
        let expiringCount = 0;
        const now = new Date();
        listings.forEach((item) => {
          const exp = item.expiryDate || item.expiry;
          if (exp) {
            try {
              const date = typeof exp === 'string' ? parseISO(exp) : new Date(exp);
              const days = differenceInDays(date, now);
              if (days >= 0 && days <= 30) {
                expiringCount += 1;
              }
            } catch {
              // ignore
            }
          }
        });

        const pendingReqs = requestsList.filter(
          (r) => String(r.status).toLowerCase() === 'requested' || String(r.status).toLowerCase() === 'pending'
        );
        const completedHandovers = requestsList.filter(
          (r) => String(r.status).toLowerCase() === 'completed'
        );

        setStats({
          activeListings: activeList.length,
          pendingRequests: pendingReqs.length,
          completedHandovers: completedHandovers.length,
          expiringSoon: expiringCount,
        });

        setRecentRequests(requestsList.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Unable to load some dashboard metrics. The backend may be offline.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isDonor]);

  const getRequestStatusBadge = (status) => {
    const s = String(status || 'requested').toLowerCase();
    switch (s) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'approved':
      case 'handover_scheduled':
      case 'dispatched':
      case 'received':
        return <Badge variant="info">{s.replace('_', ' ')}</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="danger">{s}</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard metrics..." fullPage={false} className="py-24" />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-primary-800 to-primary-700 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-primary-200 text-xs sm:text-sm font-semibold mb-2">
            <Building2 className="w-4 h-4" />
            <span>{isDonor ? 'Donor Healthcare Partner' : 'Recipient Care Provider'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {orgName}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-primary-100 leading-relaxed">
            {isDonor
              ? 'Manage your excess inventory, approve handover requests, and coordinate transfers to clinic partners.'
              : 'Browse active surplus medical donations, submit allocation requests, and confirm received deliveries.'}
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card p-5 border-l-4 border-l-primary-600 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {isDonor ? 'My Active Listings' : 'Available Listings'}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {stats.activeListings}
            </h3>
            <p className="text-xs text-primary-700 mt-1 font-medium">Ready for allocation</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pending Requests
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {stats.pendingRequests}
            </h3>
            <p className="text-xs text-amber-700 mt-1 font-medium">Awaiting decision</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-600 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Completed Handovers
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {stats.completedHandovers}
            </h3>
            <p className="text-xs text-emerald-700 mt-1 font-medium">Successfully delivered</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Expiring Soon
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              {stats.expiringSoon}
            </h3>
            <p className="text-xs text-red-700 mt-1 font-medium">&lt; 30 days remaining</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isDonor ? (
            <>
              <Link
                to="/listings/create"
                className="card p-5 hover:border-primary-400 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 text-sm">
                    Create New Listing
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Post surplus medical stock for donation
                  </p>
                </div>
              </Link>

              <Link
                to="/requests/incoming"
                className="card p-5 hover:border-primary-400 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 text-sm">
                    Review Incoming Requests
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Approve or manage recipient claims
                  </p>
                </div>
              </Link>

              <Link
                to="/my-listings"
                className="card p-5 hover:border-primary-400 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 text-sm">
                    Manage My Inventory
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Edit, reserve, or mark items as completed
                  </p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/browse"
                className="card p-5 hover:border-primary-400 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 text-sm">
                    Browse Supplies Directory
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Discover available PPE, medicine, and gear
                  </p>
                </div>
              </Link>

              <Link
                to="/requests/sent"
                className="card p-5 hover:border-primary-400 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 text-sm">
                    Track My Requests
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Check handover and dispatch milestones
                  </p>
                </div>
              </Link>

              <Link
                to="/profile"
                className="card p-5 hover:border-primary-400 hover:shadow-md transition-all flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700 text-sm">
                    Facility Profile
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update contact info and delivery address
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card p-6 border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Recent Request Activity</h3>
            <p className="text-xs text-gray-500">Last 5 handover requests</p>
          </div>
          <Link
            to={isDonor ? '/requests/incoming' : '/requests/sent'}
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No recent request activity found.</p>
            <Link
              to={isDonor ? '/listings/create' : '/browse'}
              className="text-xs text-primary-600 font-semibold mt-2 inline-block hover:underline"
            >
              {isDonor ? 'Create your first listing' : 'Browse available supplies'}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentRequests.map((req) => {
              const reqId = req._id || req.id;
              const title = req.listing?.title || req.listingTitle || 'Medical Supply Request';
              const partnerOrg = isDonor
                ? req.recipientOrg?.name || req.recipient?.organisationName || 'Recipient'
                : req.donorOrg?.name || req.donor?.organisationName || 'Donor';
              const rawDate = req.createdAt || req.date;
              const dateDisplay = rawDate
                ? format(typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate), 'dd MMM yyyy')
                : 'Recently';

              return (
                <div
                  key={reqId}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                      <p className="text-xs text-gray-500">
                        {isDonor ? `Requested by ${partnerOrg}` : `Offered by ${partnerOrg}`} •{' '}
                        {req.quantity} units requested • {dateDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {getRequestStatusBadge(req.status)}
                    <Link
                      to={`/requests/${reqId}`}
                      className="p-1 text-gray-400 hover:text-primary-700 transition-colors"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
