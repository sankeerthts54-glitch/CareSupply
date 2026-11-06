import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Check,
  X,
  Users,
  Package,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Search,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const ADMIN_TABS = ['Pending Verification', 'All Organisations', 'System Stats'];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Pending Verification');
  const [organisations, setOrganisations] = useState([]);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalListings: 0,
    totalRequests: 0,
    completedHandovers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Search in all orgs
  const [searchQuery, setSearchQuery] = useState('');

  // Reject modal
  const [rejectModalOrg, setRejectModalOrg] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      // Fetch organisations
      const orgsRes = await api.get('/admin/organisations');
      const orgsList = orgsRes.data?.data || orgsRes.data?.organisations || orgsRes.data || [];
      const orgsArray = Array.isArray(orgsList) ? orgsList : [];
      setOrganisations(orgsArray);

      // Fetch stats
      try {
        const statsRes = await api.get('/admin/stats');
        const s = statsRes.data?.data || statsRes.data;
        if (s) {
          setStats({
            totalOrgs: s.totalOrgs || orgsArray.length,
            totalListings: s.totalListings || 0,
            totalRequests: s.totalRequests || 0,
            completedHandovers: s.completedHandovers || 0,
          });
        }
      } catch {
        // fallback calculate stats
        const listingsRes = await api.get('/listings').catch(() => ({ data: [] }));
        const listData = listingsRes.data?.data || listingsRes.data || [];
        const reqsRes = await api.get('/requests').catch(() => ({ data: [] }));
        const reqData = reqsRes.data?.data || reqsRes.data || [];

        setStats({
          totalOrgs: orgsArray.length,
          totalListings: Array.isArray(listData) ? listData.length : 0,
          totalRequests: Array.isArray(reqData) ? reqData.length : 0,
          completedHandovers: Array.isArray(reqData)
            ? reqData.filter((r) => r.status === 'completed').length
            : 0,
        });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load admin records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerify = async (orgId) => {
    try {
      setIsUpdating(true);
      await api.patch(`/admin/organisations/${orgId}/verification`, {
        status: 'verified',
      });
      toast.success('Organisation verified successfully!');
      setOrganisations((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orgId ? { ...o, verificationStatus: 'verified', status: 'verified' } : o
        )
      );
    } catch (err) {
      console.error('Failed to verify organisation:', err);
      toast.error(err.response?.data?.message || 'Failed to verify organisation.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectModalOrg) return;
    const orgId = rejectModalOrg._id || rejectModalOrg.id;

    try {
      setIsUpdating(true);
      await api.patch(`/admin/organisations/${orgId}/verification`, {
        status: 'rejected',
        reason: rejectReason,
      });
      toast.success('Organisation verification rejected.');
      setOrganisations((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orgId
            ? { ...o, verificationStatus: 'rejected', status: 'rejected', rejectionReason: rejectReason }
            : o
        )
      );
      setRejectModalOrg(null);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject organisation:', err);
      toast.error(err.response?.data?.message || 'Failed to reject organisation.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSuspend = async (orgId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'verified' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'suspend' : 'reinstate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this organisation?`)) return;

    try {
      setIsUpdating(true);
      await api.patch(`/admin/organisations/${orgId}/verification`, {
        status: newStatus,
      });
      toast.success(`Organisation ${newStatus}.`);
      setOrganisations((prev) =>
        prev.map((o) =>
          (o._id || o.id) === orgId ? { ...o, verificationStatus: newStatus, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingOrgs = organisations.filter(
    (o) =>
      (o.verificationStatus || o.status || 'pending').toLowerCase() === 'pending'
  );

  const filteredAllOrgs = organisations.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = o.name || o.organisationName || '';
    const email = o.email || o.user?.email || '';
    const type = o.type || o.organisationType || '';
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || type.toLowerCase().includes(q);
  });

  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'verified':
        return <Badge variant="success">Verified</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="warning">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Administrative Console
            </h1>
            <Badge variant="primary" size="sm">Admin</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Review pending healthcare facility credentials and monitor platform activity.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchAdminData}
          isLoading={isLoading}
        >
          Refresh Data
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {ADMIN_TABS.map((tab) => {
          let count = null;
          if (tab === 'Pending Verification') count = pendingOrgs.length;
          if (tab === 'All Organisations') count = organisations.length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
                activeTab === tab
                  ? 'text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab}</span>
              {count !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner text="Loading administrative records..." className="py-24" />
      ) : activeTab === 'Pending Verification' ? (
        /* Tab 1: Pending Verification */
        pendingOrgs.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All clear! No pending verifications"
            description="Every registered organisation has been processed by an administrator."
          />
        ) : (
          <div className="space-y-4">
            {pendingOrgs.map((org) => {
              const orgId = org._id || org.id;
              const orgName = org.name || org.organisationName || 'Healthcare Facility';
              const orgType = org.type || org.organisationType || 'Clinic';
              const email = org.email || org.user?.email || 'N/A';
              const phone = org.phone || 'N/A';
              const city = org.address?.city || org.city || 'N/A';

              return (
                <div
                  key={orgId}
                  className="card p-5 sm:p-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{orgName}</h3>
                        <Badge variant="warning" size="sm">Pending</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {orgType} • {city}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>Email: <strong className="text-gray-700">{email}</strong></span>
                        <span>Phone: <strong className="text-gray-700">{phone}</strong></span>
                        <span>Role: <strong className="text-primary-700 capitalize">{org.user?.role || org.role || 'Member'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectModalOrg(org);
                        setRejectReason('');
                      }}
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      icon={X}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleVerify(orgId)}
                      isLoading={isUpdating}
                      icon={Check}
                    >
                      Approve & Verify
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'All Organisations' ? (
        /* Tab 2: All Organisations */
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by organisation name, email or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-sm bg-white"
            />
          </div>

          <div className="card overflow-x-auto border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Organisation</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAllOrgs.map((org) => {
                  const orgId = org._id || org.id;
                  const status = org.verificationStatus || org.status || 'pending';
                  const isSuspended = status === 'suspended';

                  return (
                    <tr key={orgId} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {org.name || org.organisationName || 'Facility'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {org.type || org.organisationType || 'Clinic'}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {org.email || org.user?.email || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {status === 'pending' ? (
                          <div className="inline-flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRejectModalOrg(org);
                                setRejectReason('');
                              }}
                              className="text-red-600 hover:bg-red-50 py-1 px-2 text-xs"
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleVerify(orgId)}
                              className="py-1 px-2 text-xs"
                            >
                              Verify
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSuspend(orgId, status)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {isSuspended ? 'Reinstate' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 3: System Stats */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 border-l-4 border-l-primary-600">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Organisations
            </span>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalOrgs}</h3>
            <p className="text-xs text-primary-700 mt-1">Verified & Pending Facilities</p>
          </div>

          <div className="card p-6 border-l-4 border-l-teal-500">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Listed Supplies
            </span>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalListings}</h3>
            <p className="text-xs text-teal-700 mt-1">Surplus Inventory Catalog</p>
          </div>

          <div className="card p-6 border-l-4 border-l-amber-500">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Supply Requests
            </span>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.totalRequests}</h3>
            <p className="text-xs text-amber-700 mt-1">Claims submitted by clinics</p>
          </div>

          <div className="card p-6 border-l-4 border-l-emerald-600">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Completed Handovers
            </span>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.completedHandovers}</h3>
            <p className="text-xs text-emerald-700 mt-1">Successfully transferred care items</p>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOrg && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-xl animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-gray-900">Decline Verification</h3>
            <p className="text-xs text-gray-500 mt-1">
              Provide feedback on why {rejectModalOrg.name || rejectModalOrg.organisationName} cannot be verified.
            </p>

            <form onSubmit={handleRejectConfirm} className="mt-4 space-y-4">
              <div>
                <label className="label">Rejection Reason *</label>
                <textarea
                  rows="3"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Unverifiable healthcare license or mismatched non-profit registry ID."
                  className="input-field text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectModalOrg(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isUpdating}
                >
                  Decline Verification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
