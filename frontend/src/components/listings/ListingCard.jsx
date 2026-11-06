import React from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, format, parseISO } from 'date-fns';
import {
  MapPin,
  Calendar,
  Package,
  Building2,
  AlertTriangle,
  Stethoscope,
  Shield,
  Heart,
  Accessibility,
  Sparkles,
  Pill,
  Bed,
  Apple,
  HelpCircle,
} from 'lucide-react';
import Badge from '../ui/Badge';

export const getCategoryIcon = (category) => {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('medical')) return Stethoscope;
  if (cat.includes('ppe') || cat.includes('protective')) return Shield;
  if (cat.includes('first aid')) return Heart;
  if (cat.includes('mobility')) return Accessibility;
  if (cat.includes('hygiene')) return Sparkles;
  if (cat.includes('medication') || cat.includes('pharmaceutical')) return Pill;
  if (cat.includes('bedding') || cat.includes('linen')) return Bed;
  if (cat.includes('food') || cat.includes('nutrition')) return Apple;
  return HelpCircle;
};

export const ListingCard = ({ listing }) => {
  if (!listing) return null;

  const id = listing._id || listing.id;
  const CategoryIcon = getCategoryIcon(listing.category);
  const donorOrgName =
    listing.donorOrg?.name ||
    listing.donor?.organisationName ||
    listing.donor?.name ||
    listing.organisationName ||
    'Community Partner';

  const city =
    listing.pickupLocation?.city ||
    listing.location?.city ||
    listing.city ||
    listing.pickupLocation ||
    'Local';

  // Calculate expiry warning
  let daysUntilExpiry = null;
  let formattedExpiry = null;
  let isExpiringSoon = false;
  let isExpired = false;

  const rawExpiry = listing.expiryDate || listing.expiry;
  if (rawExpiry) {
    try {
      const expDate = typeof rawExpiry === 'string' ? parseISO(rawExpiry) : new Date(rawExpiry);
      daysUntilExpiry = differenceInDays(expDate, new Date());
      formattedExpiry = format(expDate, 'dd MMM yyyy');
      if (daysUntilExpiry < 0) {
        isExpired = true;
      } else if (daysUntilExpiry <= 30) {
        isExpiringSoon = true;
      }
    } catch {
      // ignore date parsing errors
    }
  }

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

  const getConditionBadge = (condition) => {
    const c = String(condition || 'new').toLowerCase().replace('_', ' ');
    if (c.includes('new') || c.includes('unopened')) {
      return <Badge variant="primary" size="sm">{condition}</Badge>;
    }
    return <Badge variant="neutral" size="sm">{condition}</Badge>;
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200 flex flex-col justify-between overflow-hidden group border border-gray-100">
      <div>
        {/* Card Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              {getConditionBadge(listing.condition || 'Unopened')}
              {getStatusBadge(listing.status)}
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1 text-base">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{donorOrgName}</span>
          </div>
        </div>

        {/* Card Specs */}
        <div className="px-5 py-2.5 bg-gray-50/60 border-y border-gray-100 text-xs text-gray-600 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span className="font-medium text-gray-800">
              {listing.quantity} {listing.unit || 'units'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span className="truncate">{city}</span>
          </div>
        </div>

        {/* Description & Expiry */}
        <div className="p-5 pt-3">
          {listing.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {listing.description}
            </p>
          )}

          {formattedExpiry && (
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg mb-2 ${
                isExpired
                  ? 'bg-red-50 text-red-700'
                  : isExpiringSoon
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              {(isExpiringSoon || isExpired) ? (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Calendar className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {isExpired
                  ? `Expired on ${formattedExpiry}`
                  : isExpiringSoon
                  ? `Expiring soon: ${formattedExpiry} (${daysUntilExpiry}d left)`
                  : `Expires: ${formattedExpiry}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-5 pt-0">
        <Link
          to={`/listings/${id}`}
          className="btn-primary w-full text-center block text-sm py-2 shadow-xs"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ListingCard;
