import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, organisation } = useAuth();

  const verificationStatus =
    organisation?.verificationStatus || organisation?.status || 'pending';
  const isPending = user?.role !== 'admin' && verificationStatus === 'pending';
  const isRejected = user?.role !== 'admin' && verificationStatus === 'rejected';

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex-1 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
          {/* Verification Status Banner */}
          {isPending && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-3">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 text-amber-800 text-xs sm:text-sm font-medium">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Your organisation is currently <strong>awaiting administrator verification</strong>. You can browse supplies, but actions like creating listings and placing requests will be enabled once verified.
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="text-xs font-semibold text-amber-900 hover:text-amber-950 inline-flex items-center gap-1 shrink-0"
                >
                  View Profile <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 text-red-800 text-xs sm:text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    Your organisation verification request was <strong>declined</strong>: {organisation?.rejectionReason || 'Please review your organisation details and contact support.'}
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="text-xs font-semibold text-red-900 underline shrink-0"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          )}

          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
