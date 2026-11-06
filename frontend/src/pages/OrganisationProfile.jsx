import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Save,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ORG_TYPES = [
  'Hospital / Medical Center',
  'Community Health Clinic',
  'Care / Nursing Home',
  'Hospice / Palliative Care',
  'Charity / NGO',
  'Disaster Relief Organization',
  'Pharmacy / Medical Supplier',
  'Other Healthcare Organization',
];

export const OrganisationProfile = () => {
  const { user, organisation, updateOrganisationState, fetchMe } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    type: 'Community Health Clinic',
    email: '',
    phone: '',
    street: '',
    city: '',
    postcode: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organisation || user) {
      const org = organisation || {};
      const addr = org.address || {};
      setFormData({
        name: org.name || user?.organisationName || '',
        type: org.type || org.organisationType || 'Community Health Clinic',
        email: org.email || user?.email || '',
        phone: org.phone || user?.phone || '',
        street: addr.street || org.street || '',
        city: addr.city || org.city || '',
        postcode: addr.postcode || org.postcode || '',
      });
    }
  }, [organisation, user]);

  const verificationStatus =
    organisation?.verificationStatus || organisation?.status || 'pending';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name: formData.name,
        type: formData.type,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          postcode: formData.postcode,
        },
        street: formData.street,
        city: formData.city,
        postcode: formData.postcode,
      };

      const orgId = organisation?._id || organisation?.id;
      let res;
      try {
        res = await api.put('/organisations/profile', payload);
      } catch {
        if (orgId) {
          res = await api.put(`/organisations/${orgId}`, payload);
        } else {
          res = await api.put('/auth/profile', payload);
        }
      }

      const updated = res.data?.data || res.data?.organisation || res.data;
      if (updated && updateOrganisationState) {
        updateOrganisationState(updated);
      }
      toast.success('Organisation profile updated successfully!');
      fetchMe();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update organisation details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Organisation Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review verification status and keep your facility's contact details up to date.
        </p>
      </div>

      {/* Verification Status Card */}
      <div className="card p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Verification Status
              </span>
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {verificationStatus}
              </h3>
            </div>
          </div>

          <div>
            {verificationStatus === 'verified' && (
              <Badge variant="success" size="lg">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Verified Provider
              </Badge>
            )}
            {verificationStatus === 'pending' && (
              <Badge variant="warning" size="lg">
                <Clock className="w-4 h-4 mr-1.5" /> Pending Review
              </Badge>
            )}
            {verificationStatus === 'rejected' && (
              <Badge variant="danger" size="lg">
                <XCircle className="w-4 h-4 mr-1.5" /> Verification Declined
              </Badge>
            )}
            {verificationStatus === 'suspended' && (
              <Badge variant="danger" size="lg">
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Suspended
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
          {verificationStatus === 'verified' ? (
            <p className="text-emerald-800 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
              Your healthcare organisation has been successfully verified by the system administrator. You have full privileges to list surplus medical supplies, approve requests, and request items.
            </p>
          ) : verificationStatus === 'pending' ? (
            <p className="text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
              Your organisation is awaiting verification. You can browse but cannot create listings or requests until verified. Our compliance team verifies facility licenses within 24-48 hours.
            </p>
          ) : (
            <div className="text-red-800 bg-red-50 p-3.5 rounded-xl border border-red-200 space-y-1">
              <p className="font-semibold">Verification was not approved.</p>
              <p>
                Reason: {organisation?.rejectionReason || 'Organisation documentation did not meet registration criteria.'} Please verify your facility details and submit for re-review.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-6 sm:p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900">Facility Information</h3>
            <p className="text-xs text-gray-500">Contact and registration credentials</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Organisation / Facility Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="label">Facility Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field bg-white text-sm"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Organisation Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="label">Official Contact Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" /> Physical Address
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Street and unit number"
                  className="input-field text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="label">Postcode / ZIP</label>
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              icon={Save}
              className="shadow-sm"
            >
              Save Profile Updates
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganisationProfile;
