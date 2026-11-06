import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

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

export const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'recipient', // default role
    organisationName: '',
    organisationType: 'Community Health Clinic',
    phone: '',
    street: '',
    city: '',
    postcode: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }
    if (!formData.organisationName.trim()) {
      errs.organisationName = 'Organisation Name is required';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Contact Phone number is required';
    }
    if (!formData.city.trim()) {
      errs.city = 'City is required';
    }
    if (!formData.postcode.trim()) {
      errs.postcode = 'Postcode is required';
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
    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organisationName: formData.organisationName,
        organisationType: formData.organisationType,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          postcode: formData.postcode,
        },
        // also provide flat address fields for backends that accept flat structure
        street: formData.street,
        city: formData.city,
        postcode: formData.postcode,
      };

      await register(payload);
      toast.success(
        'Account registered successfully! Your organisation is pending admin verification.'
      );
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please check your information and try again.';
      toast.error(msg);
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <span className="font-bold text-gray-900 text-2xl tracking-tight">
            CareSupply <span className="text-primary-600 font-extrabold">Share</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Register your healthcare organisation</h2>
        <p className="mt-1 text-sm text-gray-500">
          Join our network to donate or receive verified medical supplies
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="card p-6 sm:p-10 shadow-md border border-gray-100">
          {errors.general && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="label text-sm font-semibold text-gray-800">
                Primary Participation Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    formData.role === 'recipient'
                      ? 'border-primary-600 bg-primary-50/50 text-primary-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="recipient"
                    checked={formData.role === 'recipient'}
                    onChange={handleChange}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-bold text-sm block">Recipient Organisation</span>
                    <span className="text-xs text-gray-500 leading-tight">
                      We need medical supplies and equipment for patients and clinic operations.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    formData.role === 'donor'
                      ? 'border-primary-600 bg-primary-50/50 text-primary-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="donor"
                    checked={formData.role === 'donor'}
                    onChange={handleChange}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-bold text-sm block">Donor Organisation</span>
                    <span className="text-xs text-gray-500 leading-tight">
                      We have surplus, unexpired medical items and supplies to distribute for free.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* User Account Details */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary-600" /> Account Administrator
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className={`input-field ${errors.fullName ? 'border-red-400' : ''}`}
                  />
                  {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="label">Work Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="sarah.jenkins@hospital.org"
                    className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Password (Min 8 characters) *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>
              </div>
            </div>

            {/* Organisation Details */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary-600" /> Organisation Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Organisation Name *</label>
                  <input
                    type="text"
                    name="organisationName"
                    value={formData.organisationName}
                    onChange={handleChange}
                    placeholder="e.g. St. Jude Community Health Center"
                    className={`input-field ${errors.organisationName ? 'border-red-400' : ''}`}
                  />
                  {errors.organisationName && (
                    <p className="text-xs text-red-600 mt-1">{errors.organisationName}</p>
                  )}
                </div>

                <div>
                  <label className="label">Organisation Type</label>
                  <select
                    name="organisationType"
                    value={formData.organisationType}
                    onChange={handleChange}
                    className="input-field bg-white"
                  >
                    {ORG_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Official Contact Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 20 7946 0991"
                    className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" /> Primary Facility Address
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="label">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="124 Healthcare Way, Suite 300"
                    className="input-field"
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
                      placeholder="e.g. Birmingham"
                      className={`input-field ${errors.city ? 'border-red-400' : ''}`}
                    />
                    {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="label">Postcode / ZIP *</label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      placeholder="e.g. B1 1AA"
                      className={`input-field ${errors.postcode ? 'border-red-400' : ''}`}
                    />
                    {errors.postcode && <p className="text-xs text-red-600 mt-1">{errors.postcode}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50/50 p-4 rounded-xl text-xs text-primary-800 leading-relaxed border border-primary-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
              <span>
                By registering, you confirm that your organisation operates legally in healthcare or community relief and complies with safe medical disposal and donation regulations.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full shadow-md py-3 text-base"
            >
              Complete Registration
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
