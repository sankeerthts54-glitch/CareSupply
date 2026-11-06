import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BrowseSupplies from './pages/BrowseSupplies';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';
import IncomingRequests from './pages/IncomingRequests';
import MyRequests from './pages/MyRequests';
import RequestDetail from './pages/RequestDetail';
import Notifications from './pages/Notifications';
import OrganisationProfile from './pages/OrganisationProfile';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Checking authentication..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1B4332',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#52B788',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#ffffff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes inside App Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/browse" element={<BrowseSupplies />} />
            <Route path="/listings/:id" element={<ListingDetail />} />

            {/* Donor Only Routes */}
            <Route
              path="/listings/create"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <CreateListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <EditListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-listings"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <MyListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests/incoming"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <IncomingRequests />
                </ProtectedRoute>
              }
            />

            {/* Recipient Only Routes */}
            <Route
              path="/requests/sent"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                  <MyRequests />
                </ProtectedRoute>
              }
            />

            {/* Shared Protected Routes */}
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<OrganisationProfile />} />

            {/* Admin Only Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
