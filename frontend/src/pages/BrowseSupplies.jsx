import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import ListingCard from '../components/listings/ListingCard';
import ListingFilters from '../components/listings/ListingFilters';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { PackageSearch, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';

export const BrowseSupplies = () => {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Debounce search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch listings from API
  const fetchListings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (category && category !== 'All Categories') params.category = category;
      if (city) params.city = city;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/listings', { params });
      const payload = res.data?.data || res.data?.listings || res.data || [];
      const list = Array.isArray(payload) ? payload : [];
      setListings(list);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError(err?.response?.data?.message || 'Failed to load supplies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [debouncedSearch, category, city, sortBy]);

  // Client-side filtering fallback for backend responses that return full dataset
  const filteredListings = useMemo(() => {
    let result = [...listings];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All Categories') {
      result = result.filter(
        (item) => item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (city.trim()) {
      const c = city.toLowerCase();
      result = result.filter((item) => {
        const itemCity =
          item.pickupLocation?.city || item.location?.city || item.city || '';
        return itemCity.toLowerCase().includes(c);
      });
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'expiring_soon') {
      result.sort((a, b) => {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return dateA - dateB;
      });
    } else if (sortBy === 'quantity_desc') {
      result.sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0));
    } else if (sortBy === 'quantity_asc') {
      result.sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0));
    }

    return result;
  }, [listings, debouncedSearch, category, city, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Browse Medical Supplies
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Search surplus inventory shared by verified hospitals, care facilities, and donors.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchListings}
          isLoading={isLoading}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Filters Bar */}
      <ListingFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        city={city}
        setCity={setCity}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={handleResetFilters}
      />

      {/* Results Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-6 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="w-16 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-8 bg-gray-200 rounded-lg mt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center bg-red-50/50 border-red-200">
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchListings}>
            Try Again
          </Button>
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No medical supplies found"
          description={
            search || category || city
              ? "We couldn't find any listings matching your active filters. Try broadening your search or resetting filters."
              : 'There are currently no active listings available in the community network. Please check back soon.'
          }
          actionLabel={search || category || city ? 'Reset Filters' : undefined}
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>
              Showing {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'}
            </span>
            {(search || category || city) && (
              <span className="text-primary-700">Filtered view</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing._id || listing.id}
                listing={listing}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowseSupplies;
