import React from 'react';
import { Search, MapPin, Filter, X, ArrowUpDown } from 'lucide-react';

export const CATEGORIES = [
  'All Categories',
  'Medical Supplies',
  'Personal Protective Equipment (PPE)',
  'First Aid & Trauma',
  'Mobility & Rehabilitation',
  'Hygiene & Sanitation',
  'Medications & Pharmaceuticals',
  'Bedding & Linens',
  'Nutrition & Dietary',
  'Diagnostic & Monitoring',
  'Other',
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'expiring_soon', label: 'Expiring Soonest' },
  { value: 'quantity_desc', label: 'Quantity (High to Low)' },
  { value: 'quantity_asc', label: 'Quantity (Low to High)' },
];

export const ListingFilters = ({
  search,
  setSearch,
  category,
  setCategory,
  city,
  setCity,
  sortBy,
  setSortBy,
  onReset,
}) => {
  const hasActiveFilters =
    search || (category && category !== 'All Categories') || city || sortBy !== 'newest';

  return (
    <div className="card p-4 sm:p-5 mb-6 shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplies by name or keyword..."
            className="input-field pl-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field pl-9 text-sm bg-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Filter by city/location..."
            className="input-field pl-9 text-sm"
          />
          {city && (
            <button
              onClick={() => setCity('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort By */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field pl-9 text-sm bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Active filters applied</span>
          <button
            onClick={onReset}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingFilters;
