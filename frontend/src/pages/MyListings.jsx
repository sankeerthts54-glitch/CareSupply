import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Edit,
  Trash2,
  Inbox,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getCategoryIcon } from '../components/listings/ListingCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Active', 'Reserved', 'Completed'];

export const MyListings = () => {
  const { user, organisation } = useAuth();
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyListings = async () => {
    try {
      setIsLoading(true);
      // Try donor-specific query or general listings
      let data = [];
      try {
        const res = await api.get('/listings/my');
        data = res.data?.data || res.data?.listings || res.data || [];
      } catch {
        const res = await api.get('/listings');
        const allListings = res.data?.data || res.data?.listings || res.data || [];
        // filter for current user or organisation
        data = allListings.filter(
          (item) =>
            (item.donor && (item.donor._id === user?._id || item.donor === user?._id)) ||
            (item.donorOrg &&
              (item.donorOrg._id === organisation?._id || item.donorOrg === organisation?._id)) ||
            (item.organisation &&
              (item.organisation._id === organisation?._id || item.organisation === organisation?._id))
        );
      }
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load my listings:', err);
      toast.error('Failed to load listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [user, organisation]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing deleted successfully');
      setListings((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast.error(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  const filteredListings = listings.filter((item) => {
    if (activeTab === 'All') return true;
    return String(item.status).toLowerCase() === activeTab.toLowerCase();
  });

  const getStatusBadge = (status) => {
    const s = String(status || 'active').toLowerCase();
    switch (s) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'reserved':
        return <Badge variant="warning">Reserved</Badge>;
      case 'completed':
        return <Badge variant="neutral">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            My Supply Listings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organisation's active donation surplus inventory.
          </p>
        </div>

        <Link to="/listings/create" className="btn-primary text-sm shadow-sm flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add New Listing
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === 'All'
              ? listings.length
              : listings.filter(
                  (item) => String(item.status).toLowerCase() === tab.toLowerCase()
                ).length;

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

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner text="Loading your inventory..." className="py-20" />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            activeTab === 'All'
              ? 'You have not listed any supplies yet'
              : `No listings with "${activeTab}" status`
          }
          description="Offer surplus medical consumables, medication, or clinical equipment to local community partners."
          actionLabel="Create First Listing"
          actionIcon={PlusCircle}
          onAction={() => (window.location.href = '/listings/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const id = listing._id || listing.id;
            const CategoryIcon = getCategoryIcon(listing.category);
            const city =
              listing.pickupLocation?.city || listing.city || 'Local pickup';

            return (
              <div
                key={id}
                className="card p-5 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    {getStatusBadge(listing.status)}
                  </div>

                  <h3 className="font-bold text-gray-900 text-base line-clamp-1 mb-1">
                    {listing.title}
                  </h3>

                  <div className="text-xs text-gray-500 space-y-1 mb-4">
                    <p className="font-medium text-gray-700">
                      {listing.quantity} {listing.unit || 'units'} •{' '}
                      <span className="capitalize">{listing.condition || 'Unopened'}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{city}</span>
                    </div>
                    {listing.expiryDate && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Expires {listing.expiryDate.split('T')[0]}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/requests/incoming?listingId=${id}`}
                    className="text-xs text-primary-700 hover:text-primary-900 font-semibold flex items-center gap-1"
                  >
                    <Inbox className="w-3.5 h-3.5" /> Requests
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/listings/${id}/edit`}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/listings/${id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyListings;
