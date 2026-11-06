import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PackagePlus,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  MapPin,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../components/listings/ListingFilters';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const CONDITIONS = [
  { value: 'unopened', label: 'Unopened / Factory Sealed' },
  { value: 'new', label: 'Brand New (Original Packaging)' },
  { value: 'like_new', label: 'Like New (Inspected)' },
  { value: 'gently_used', label: 'Gently Used (Clean & Functional)' },
];

const UNITS = ['boxes', 'units', 'packs', 'bottles', 'cases', 'pairs', 'kg', 'kits'];

export const CreateListing = () => {
  const navigate = useNavigate();
  const { user, organisation } = useAuth();

  const verificationStatus =
    organisation?.verificationStatus || organisation?.status || 'pending';
  const isVerified = verificationStatus === 'verified';

  const defaultCity = organisation?.address?.city || organisation?.city || '';
  const defaultStreet = organisation?.address?.street || organisation?.street || '';
  const defaultPostcode = organisation?.address?.postcode || organisation?.postcode || '';

  const [formData, setFormData] = useState({
    title: '',
    category: 'Medical Supplies',
    condition: 'unopened',
    quantity: '',
    unit: 'boxes',
    expiryDate: '',
    description: '',
    street: defaultStreet,
    city: defaultCity,
    postcode: defaultPostcode,
    handoverInstructions: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      errs.quantity = 'Please enter a valid quantity greater than 0';
    }
    if (!formData.city.trim()) errs.city = 'City/Location is required';

    if (formData.expiryDate) {
      const selected = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errs.expiryDate = 'Expiry date cannot be in the past';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error('Your organisation must be verified by an admin before listing items.');
      return;
    }

    if (!validate()) {
      toast.error('Please resolve the errors before submitting.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        title: formData.title,
        category: formData.category,
        condition: formData.condition,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        expiryDate: formData.expiryDate || null,
        description: formData.description,
        pickupLocation: {
          street: formData.street,
          city: formData.city,
          postcode: formData.postcode,
        },
        // also flat fields for backend compatibility
        street: formData.street,
        city: formData.city,
        postcode: formData.postcode,
        handoverInstructions: formData.handoverInstructions,
        status: 'active',
      };

      await api.post('/listings', payload);
      toast.success('Medical supply listing created successfully!');
      navigate('/my-listings');
    } catch (err) {
      console.error('Failed to create listing:', err);
      toast.error(err.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/my-listings"
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Listings
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Supply Listing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Publish excess healthcare products for donation to verified clinics.
          </p>
        </div>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Organisation Pending Verification</span>
            Your account is currently under review. You may prepare listings, but they will not be visible to recipients until approved.
          </div>
        </div>
      )}

      <div className="card p-6 sm:p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="label">Item Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Nitrile Examination Gloves - Size Medium (Blue)"
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field bg-white"
              >
                {CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Package Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="input-field bg-white"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity, Unit & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                min="1"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="50"
                className={`input-field ${errors.quantity ? 'border-red-400' : ''}`}
              />
              {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="label">Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="input-field bg-white"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Expiry Date (Optional)</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className={`input-field bg-white ${errors.expiryDate ? 'border-red-400' : ''}`}
              />
              {errors.expiryDate && (
                <p className="text-xs text-red-600 mt-1">{errors.expiryDate}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Detailed Item Description</label>
            <textarea
              rows="3"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Include brand, lot number, certifications (CE/FDA), storage requirements, or any packaging details..."
              className="input-field text-sm"
            />
          </div>

          {/* Location */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary-600" /> Pickup Facility Location
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Street Address / Facility Building</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Main Medical Warehouse, Gate 3"
                  className="input-field text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Manchester"
                    className={`input-field text-sm ${errors.city ? 'border-red-400' : ''}`}
                  />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="label">Postcode / Zip</label>
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    placeholder="e.g. M1 4BT"
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Handover Instructions */}
          <div>
            <label className="label">Handover & Collection Instructions</label>
            <textarea
              rows="2"
              name="handoverInstructions"
              value={formData.handoverInstructions}
              onChange={handleChange}
              placeholder="e.g. Pickup hours Mon-Fri 9am-4pm. Please ring loading dock intercom upon arrival."
              className="input-field text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link to="/my-listings" className="btn-secondary text-sm">
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              icon={PackagePlus}
            >
              Publish Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
