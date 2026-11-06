import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusTimeline from '../components/ui/StatusTimeline';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, organisation } = useAuth();

  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handover date schedule state (for donor)
  const [handoverDate, setHandoverDate] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');

  const fetchRequest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get(`/requests/${id}`);
      const data = res.data?.data || res.data;
      setRequest(data);

      if (data.handoverDate) {
        setHandoverDate(data.handoverDate.split('T')[0]);
      }
      if (data.handoverNotes) {
        setHandoverNotes(data.handoverNotes);
      }
    } catch (err) {
      console.error('Failed to load request detail:', err);
      setError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  // Determine user role relative to this request
  const currentUserId = user?._id || user?.id;
  const currentOrgId = organisation?._id || organisation?.id;

  const isDonorUser =
    user?.role === 'donor' ||
    (request?.donor && (request.donor._id === currentUserId || request.donor === currentUserId)) ||
    (request?.donorOrg && (request.donorOrg._id === currentOrgId || request.donorOrg === currentOrgId));

  const isRecipientUser =
    user?.role === 'recipient' ||
    (request?.recipient && (request.recipient._id === currentUserId || request.recipient === currentUserId)) ||
    (request?.recipientOrg && (request.recipientOrg._id === currentOrgId || request.recipientOrg === currentOrgId));

  // Handover Action Handlers
  const handleScheduleHandover = async (e) => {
    e.preventDefault();
    if (!handoverDate) {
      toast.error('Please pick a handover target date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        handoverDate,
        handoverNotes,
        status: 'handover_scheduled',
      };

      try {
        await api.patch(`/requests/${id}/handover`, payload);
      } catch {
        await api.patch(`/requests/${id}/status`, payload);
      }

      toast.success('Handover scheduled successfully!');
      fetchRequest();
    } catch (err) {
      console.error('Failed to schedule handover:', err);
      toast.error(err.response?.data?.message || 'Failed to schedule handover.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDispatch = async () => {
    try {
      setIsSubmitting(true);
      try {
        await api.patch(`/requests/${id}/dispatch`);
      } catch {
        await api.patch(`/requests/${id}/status`, { status: 'dispatched' });
      }

      toast.success('Dispatched confirmed! Recipient has been notified.');
      fetchRequest();
    } catch (err) {
      console.error('Failed to confirm dispatch:', err);
      toast.error(err.response?.data?.message || 'Failed to update dispatch status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      setIsSubmitting(true);
      try {
        await api.patch(`/requests/${id}/receive`);
      } catch {
        await api.patch(`/requests/${id}/status`, { status: 'completed' });
      }

      toast.success('Delivery received! Handover is now officially completed. Thank you!');
      fetchRequest();
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to confirm receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading request status..." className="py-24" />;
  }

  if (error || !request) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Request Not Found</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">{error || 'This request does not exist.'}</p>
        <Button
          variant="primary"
          onClick={() => navigate(-1)}
          icon={ArrowLeft}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const listing = request.listing || {};
  const status = String(request.status || 'requested').toLowerCase();

  const donorName =
    request.donorOrg?.name ||
    request.donor?.organisationName ||
    listing.donorOrg?.name ||
    'Donor Facility';

  const recipientName =
    request.recipientOrg?.name ||
    request.recipient?.organisationName ||
    request.recipient?.name ||
    'Recipient Care Clinic';

  const isApproved = status === 'approved';
  const isHandoverSet =
    status === 'handover_scheduled' || status === 'handover_set' || status === 'scheduled';
  const isDispatched = status === 'dispatched' || status === 'donor_confirmed';
  const isReceivedOrCompleted =
    status === 'received' || status === 'recipient_confirmed' || status === 'completed';

  const rawCreatedAt = request.createdAt || request.date;
  const createdAtFormatted = rawCreatedAt
    ? format(typeof rawCreatedAt === 'string' ? parseISO(rawCreatedAt) : new Date(rawCreatedAt), 'dd MMM yyyy, HH:mm')
    : 'Unknown date';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <span className="text-xs text-gray-400 font-mono">
          Ref ID: #{String(request._id || request.id).slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Timeline Card */}
      <div className="card p-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-900 text-lg mb-1">Redistribution Handover Status</h2>
        <p className="text-xs text-gray-500 mb-6">
          Track each milestone from verified request approval to final receipt on site.
        </p>

        <StatusTimeline currentStatus={request.status} />
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Handover Actions & Execution */}
        <div className="md:col-span-7 space-y-6">
          {/* Handover Scheduling / Dispatch Actions */}
          <div className="card p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary-600" />
              Handover Coordination
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Pickup scheduling, tracking notes, and chain of custody confirmation.
            </p>

            {status === 'requested' || status === 'pending' ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <Clock className="w-4 h-4 text-amber-600 inline mr-1.5 -mt-0.5" />
                This request is currently awaiting approval from <strong>{donorName}</strong>. Once approved, pickup logistics will unlock.
              </div>
            ) : status === 'rejected' ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                <strong>Request Declined:</strong> {request.rejectionReason || 'No reason provided.'}
              </div>
            ) : isReceivedOrCompleted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-900">Handover Complete</span>
                  These supplies have been safely received and confirmed by {recipientName}. Thank you for supporting community healthcare!
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Step 1: Donor Schedules Date */}
                {isDonorUser && (isApproved || isHandoverSet) && !isDispatched && (
                  <form onSubmit={handleScheduleHandover} className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <h4 className="font-semibold text-gray-900 text-xs">Set Scheduled Handover Date</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Date of Handover *</label>
                        <input
                          type="date"
                          required
                          value={handoverDate}
                          onChange={(e) => setHandoverDate(e.target.value)}
                          className="input-field text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Logistics Notes (Optional)</label>
                        <input
                          type="text"
                          value={handoverNotes}
                          onChange={(e) => setHandoverNotes(e.target.value)}
                          placeholder="e.g. Courier: DHL / Dock B"
                          className="input-field text-xs bg-white"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      isLoading={isSubmitting}
                      className="w-full text-xs"
                    >
                      {isHandoverSet ? 'Update Handover Schedule' : 'Schedule Handover Date'}
                    </Button>
                  </form>
                )}

                {/* Display Scheduled Date if exists */}
                {request.handoverDate && (
                  <div className="p-3 bg-primary-50/60 rounded-xl border border-primary-100 flex items-center justify-between text-xs text-primary-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-700" />
                      <span>
                        Handover target:{' '}
                        <strong>
                          {format(
                            typeof request.handoverDate === 'string'
                              ? parseISO(request.handoverDate)
                              : new Date(request.handoverDate),
                            'EEEE, dd MMMM yyyy'
                          )}
                        </strong>
                      </span>
                    </div>
                    {request.handoverNotes && (
                      <span className="text-[11px] text-primary-700 bg-white/80 px-2 py-0.5 rounded-md border border-primary-200">
                        {request.handoverNotes}
                      </span>
                    )}
                  </div>
                )}

                {/* Step 2: Donor Confirms Dispatch */}
                {isDonorUser && (isApproved || isHandoverSet) && !isDispatched && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-3">
                      When items have been packed and handed over to courier or recipient driver, click below:
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleConfirmDispatch}
                      isLoading={isSubmitting}
                      icon={Truck}
                      className="w-full shadow-sm"
                    >
                      Confirm Items Dispatched / Released
                    </Button>
                  </div>
                )}

                {/* Step 3: Recipient Confirms Receipt */}
                {isRecipientUser && isDispatched && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      Donor Has Dispatched This Shipment
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Please inspect the packages upon delivery. Once verified, confirm receipt to close this redistribution request.
                    </p>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleConfirmReceipt}
                      isLoading={isSubmitting}
                      icon={CheckCircle2}
                      className="w-full shadow-md bg-emerald-600 hover:bg-emerald-700"
                    >
                      Confirm Receipt of Supplies
                    </Button>
                  </div>
                )}

                {/* Waiting indicator */}
                {isRecipientUser && !isDispatched && isHandoverSet && (
                  <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1 text-gray-400" />
                    Awaiting dispatch confirmation from {donorName}.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Request Message */}
          {request.message && (
            <div className="card p-6 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" /> Clinical Need Statement
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl">
                {request.message}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Listing & Organization Information */}
        <div className="md:col-span-5 space-y-6">
          {/* Item Summary Card */}
          <div className="card p-6 border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">
              Supply Item Details
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-500 block">Item Name</span>
                <Link
                  to={`/listings/${listing._id || listing.id || request.listingId}`}
                  className="font-bold text-primary-700 hover:underline text-sm block"
                >
                  {listing.title || request.listingTitle || 'Medical Supply Item'}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-500 block">Quantity Requested</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {request.quantity} units
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Condition</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {listing.condition || 'Unopened'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-500 block">Requested On</span>
                <span className="font-medium text-gray-800">{createdAtFormatted}</span>
              </div>
            </div>
          </div>

          {/* Partner Facilities */}
          <div className="card p-6 border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
              Participating Facilities
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Donor Facility</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{donorName}</p>
                {listing.pickupLocation && (
                  <p className="text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {typeof listing.pickupLocation === 'object'
                        ? listing.pickupLocation.city
                        : listing.pickupLocation}
                    </span>
                  </p>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Recipient Facility</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{recipientName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
