import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Save,
  MapPin,
  Clock,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { CATEGORIES } from '../components/listings/ListingFilters';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const CONDITIONS = [
  { value: 'unopened', label: 'Unopened / Factory Sealed' },
  { value: 'new', label: 'Brand New (Original Packaging)' },
  { value: 'like_new', label: 'Like New (Inspected)' },
  { value: 'gently_used', label: 'Gently Used (Clean & Functional)' },
];

const STATUSES = [
  { value: 'active', label: 'Active (Available)' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const UNITS = ['boxes', 'units', 'packs', 'bottles', 'cases', 'pairs', 'kg', 'kits'];

export const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Medical Supplies',
    condition: 'unopened',
    quantity: '',
    unit: 'boxes',
    expiryDate: '',
    description: '',
    street: '',
    city: '',
    postcode: '',
    handoverInstructions: '',
    status: 'active',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/listings/${id}`);
        const data = res.data?.data || res.data;

        // format expiry date for input type="date"
        let formattedDate = '';
        if (data.expiryDate || data.expiry) {
          const raw = data.expiryDate || data.expiry;
          formattedDate = raw.split('T')[0];
        }

        const street =
          data.pickupLocation?.street || data.street || '';
        const city =
          data.pickupLocation?.city || data.city || '';
        const postcode =
          data.pickupLocation?.postcode || data.postcode || '';

        setFormData({
          title: data.title || '',
          category: data.category || 'Medical Supplies',
          condition: data.condition || 'unopened',
          quantity: data.quantity || '',
          unit: data.unit || 'boxes',
          expiryDate: formattedDate,
          description: data.description || '',
          street,
          city,
          postcode,
          handoverInstructions: data.handoverInstructions || '',
          status: data.status || 'active',
        });
      } catch (err) {
        console.error('Failed to load listing for edit:', err);
        toast.error('Could not load listing details.');
        navigate('/my-listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      errs.quantity = 'Please enter a valid quantity greater than 0';
    }
    if (!formData.city.trim()) errs.city = 'City/Location is required';

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
    if (!validate()) {
      toast.error('Please resolve the errors before saving.');
      return;
    }

    try {
      setIsSaving(true);
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
        street: formData.street,
        city: formData.city,
        postcode: formData.postcode,
        handoverInstructions: formData.handoverInstructions,
        status: formData.status,
      };

      await api.put(`/listings/${id}`, payload);
      toast.success('Listing updated successfully!');
      navigate('/my-listings');
    } catch (err) {
      console.error('Failed to update listing:', err);
      toast.error(err.response?.data?.message || 'Failed to update listing.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing deleted.');
      navigate('/my-listings');
    } catch (err) {
      console.error('Failed to delete listing:', err);
      toast.error(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading listing details..." className="py-24" />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/my-listings"
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Listings
        </Link>

        <button
          type="button"
          onClick={handleDelete}
          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Listing
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Supply Listing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update specifications, quantity, or status for this medical item.
          </p>
        </div>
      </div>

      <div className="card p-6 sm:p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status selector */}
          <div className="p-4 bg-gray-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">Listing Status</span>
              <span className="text-xs text-gray-500">Change availability status of this surplus item</span>
            </div>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field bg-white sm:w-48 text-sm"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="label">Item Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
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
              <label className="label">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="input-field bg-white"
              />
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
                <label className="label">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
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
              isLoading={isSaving}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListing;
