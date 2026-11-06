import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import {
  Package,
  Calendar,
  MapPin,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  Truck,
  Layers,
  Edit,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getCategoryIcon } from '../components/listings/ListingCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, organisation } = useAuth();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request form state (recipient)
  const [reqQuantity, setReqQuantity] = useState(1);
  const [reqMessage, setReqMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incomingCount, setIncomingCount] = useState(0);

  const isDonor = user?.role === 'donor';
  const isRecipient = user?.role === 'recipient';
  const verificationStatus =
    organisation?.verificationStatus || organisation?.status || 'pending';
  const isVerified = verificationStatus === 'verified';

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get(`/listings/${id}`);
        const data = res.data?.data || res.data;
        setListing(data);
        if (data.quantity) {
          setReqQuantity(Math.min(1, Number(data.quantity)));
        }

        // If donor owns this, get incoming requests count
        const isOwner =
          (data.donor && (data.donor._id === user?._id || data.donor === user?._id)) ||
          (data.organisation &&
            (data.organisation._id === organisation?._id || data.organisation === organisation?._id));

        if (isOwner) {
          try {
            const reqRes = await api.get(`/requests/received?listingId=${id}`);
            const reqs = reqRes.data?.data || reqRes.data || [];
            setIncomingCount(Array.isArray(reqs) ? reqs.length : 0);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('Failed to load listing:', err);
        setError(err.response?.data?.message || 'Listing could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id, user, organisation]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Your organisation must be verified by an admin before submitting requests.');
      return;
    }

    if (Number(reqQuantity) <= 0 || Number(reqQuantity) > Number(listing.quantity)) {
      toast.error(`Please enter a valid quantity between 1 and ${listing.quantity}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        listingId: id,
        quantity: Number(reqQuantity),
        message: reqMessage,
      };

      try {
        await api.post('/requests', payload);
      } catch (postErr) {
        // fallback to /listings/:id/requests
        await api.post(`/listings/${id}/requests`, payload);
      }

      toast.success('Supply request submitted successfully!');
      navigate('/requests/sent');
    } catch (err) {
      console.error('Failed to submit request:', err);
      toast.error(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading listing details..." className="py-24" />;
  }

  if (error || !listing) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Listing Not Found</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">{error || 'This listing may have been removed or does not exist.'}</p>
        <Button variant="primary" onClick={() => navigate('/browse')} icon={ArrowLeft}>
          Back to Browse
        </Button>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(listing.category);
  const isOwner =
    (listing.donor && (listing.donor._id === user?._id || listing.donor === user?._id)) ||
    (listing.donorOrg && (listing.donorOrg._id === organisation?._id || listing.donorOrg === organisation?._id)) ||
    (listing.organisation && (listing.organisation._id === organisation?._id || listing.organisation === organisation?._id));

  // Expiry details
  let daysUntilExpiry = null;
  let formattedExpiry = null;
  let isExpiringSoon = false;
  let isExpired = false;

  const rawExpiry = listing.expiryDate || listing.expiry;
  if (rawExpiry) {
    try {
      const expDate = typeof rawExpiry === 'string' ? parseISO(rawExpiry) : new Date(rawExpiry);
      daysUntilExpiry = differenceInDays(expDate, new Date());
      formattedExpiry = format(expDate, 'dd MMMM yyyy');
      if (daysUntilExpiry < 0) {
        isExpired = true;
      } else if (daysUntilExpiry <= 30) {
        isExpiringSoon = true;
      }
    } catch {
      // ignore
    }
  }

  const donorName =
    listing.donorOrg?.name ||
    listing.donor?.organisationName ||
    listing.donor?.name ||
    listing.organisationName ||
    'Healthcare Partner';

  const pickupLocation =
    typeof listing.pickupLocation === 'object'
      ? `${listing.pickupLocation?.street ? listing.pickupLocation.street + ', ' : ''}${listing.pickupLocation?.city || ''} ${listing.pickupLocation?.postcode || ''}`
      : listing.pickupLocation || listing.location || 'Local pickup';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/browse"
          className="text-xs font-semibold text-gray-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Browse
        </Link>

        {isOwner && (
          <Link
            to={`/listings/${id}/edit`}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Listing
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 sm:p-8 border border-gray-100">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <CategoryIcon className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="primary" size="sm">{listing.category || 'General Supplies'}</Badge>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {listing.title}
                  </h1>
                </div>
              </div>

              <Badge
                variant={
                  listing.status === 'active'
                    ? 'success'
                    : listing.status === 'reserved'
                    ? 'warning'
                    : 'neutral'
                }
                size="md"
              >
                {listing.status || 'Active'}
              </Badge>
            </div>

            {/* Donor org info banner */}
            <div className="p-3.5 bg-gray-50 rounded-xl flex items-center gap-3 text-xs text-gray-700 mb-6">
              <Building2 className="w-4 h-4 text-primary-600 shrink-0" />
              <div>
                <span className="font-semibold text-gray-900">{donorName}</span>
                <span className="text-gray-500 block">Verified Healthcare Donor Facility</span>
              </div>
            </div>

            {/* Expiry Warning Callout */}
            {formattedExpiry && (
              <div
                className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-xs sm:text-sm ${
                  isExpired
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : isExpiringSoon
                    ? 'bg-amber-50 border border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {isExpiringSoon || isExpired ? (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {isExpired
                      ? 'Item Expiration Notice: Expired'
                      : isExpiringSoon
                      ? 'Urgent Expiration Window: Under 30 Days'
                      : 'Verified Expiry Window Valid'}
                  </p>
                  <p className="mt-0.5 text-xs opacity-90">
                    Expiry Date: <strong>{formattedExpiry}</strong>{' '}
                    {daysUntilExpiry !== null && `(${daysUntilExpiry} days remaining)`}
                  </p>
                </div>
              </div>
            )}

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50/70 rounded-xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-500 block">Available Quantity</span>
                <span className="font-bold text-gray-900 text-sm">
                  {listing.quantity} {listing.unit || 'units'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Packaging Condition</span>
                <span className="font-bold text-gray-900 text-sm capitalize">
                  {listing.condition ? listing.condition.replace('_', ' ') : 'Unopened'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Cost to Recipient</span>
                <span className="font-bold text-primary-700 text-sm">100% Free / Donation</span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-bold text-gray-900">Item Description & Scope</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {listing.description || 'No detailed description provided by the donor.'}
              </p>
            </div>

            {/* Location & Handover */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Collection & Handover Guidelines</h3>
              <div className="flex items-start gap-2.5 text-xs text-gray-600">
                <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-800">Pickup Facility:</span>
                  <p className="mt-0.5">{pickupLocation}</p>
                </div>
              </div>

              {listing.handoverInstructions && (
                <div className="flex items-start gap-2.5 text-xs text-gray-600 bg-primary-50/30 p-3.5 rounded-lg border border-primary-100">
                  <Truck className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary-900">Instructions:</span>
                    <p className="mt-0.5 text-primary-800">{listing.handoverInstructions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Action / Request Form */}
        <div className="lg:col-span-5 space-y-6">
          {isOwner ? (
            <div className="card p-6 border border-primary-200 bg-primary-50/20">
              <h3 className="font-bold text-gray-900 text-base mb-2">Donor Management</h3>
              <p className="text-xs text-gray-600 mb-4">
                You are the donor organisation for this inventory item.
              </p>

              <div className="p-4 bg-white rounded-xl border border-gray-100 mb-4">
                <span className="text-xs text-gray-500">Incoming Requests</span>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{incomingCount}</p>
              </div>

              <Link
                to="/requests/incoming"
                className="btn-primary w-full text-center block text-sm py-2.5"
              >
                Review Incoming Claims
              </Link>
            </div>
          ) : (
            <div className="card p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Request This Supply</h3>
              <p className="text-xs text-gray-500 mb-5">
                Submit an allocation request to {donorName} for your clinic or patient facility.
              </p>

              {!isVerified ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Verification Required</span>
                  </div>
                  <p>
                    Your organisation is currently <strong>awaiting administrator approval</strong>. Once verified, you will be able to submit allocation requests immediately.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-block text-amber-900 font-bold underline mt-1"
                  >
                    Check verification status
                  </Link>
                </div>
              ) : listing.status !== 'active' ? (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-xs">
                  This item is currently <strong>{listing.status}</strong> and cannot accept new requests.
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div>
                    <label className="label">
                      Quantity Needed (Max: {listing.quantity} {listing.unit || 'units'}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={listing.quantity}
                      required
                      value={reqQuantity}
                      onChange={(e) => setReqQuantity(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="label">Clinical Purpose & Message *</label>
                    <textarea
                      rows="4"
                      required
                      value={reqMessage}
                      onChange={(e) => setReqMessage(e.target.value)}
                      placeholder="Briefly explain how your organization will use these items (e.g. for emergency outpatient clinic)..."
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-[11px] text-gray-500 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                      CareSupply Redistribution Agreement
                    </div>
                    <p>
                      By requesting, you certify that these items will be distributed free of charge to care recipients and not resold.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    icon={Send}
                    className="w-full shadow-md py-3 text-sm"
                  >
                    Submit Supply Request
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
