import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PackagePlus,
  Package,
  Inbox,
  Send,
  Bell,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, organisation } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'admin';
  const isDonor = role === 'donor';
  const isRecipient = role === 'recipient';

  const verificationStatus = organisation?.verificationStatus || organisation?.status || 'pending';

  // Navigation structure based on role
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck },
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/browse', label: 'Browse Supplies', icon: Search },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile', icon: Building2 },
      ];
    }

    const commonLinks = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/browse', label: 'Browse Supplies', icon: Search },
    ];

    const donorLinks = [
      { to: '/listings/create', label: 'Create Listing', icon: PackagePlus },
      { to: '/my-listings', label: 'My Listings', icon: Package },
      { to: '/requests/incoming', label: 'Incoming Requests', icon: Inbox },
    ];

    const recipientLinks = [
      { to: '/requests/sent', label: 'My Requests', icon: Send },
    ];

    const bottomLinks = [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Organisation Profile', icon: Building2 },
    ];

    return [
      ...commonLinks,
      ...(isDonor ? donorLinks : []),
      ...(isRecipient ? recipientLinks : []),
      ...bottomLinks,
    ];
  };

  const navLinks = getNavLinks();

  const getStatusBadge = () => {
    if (isAdmin) return null;
    switch (verificationStatus) {
      case 'verified':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Organisation</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Verification Rejected</span>
          </div>
        );
      case 'suspended':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Account Suspended</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Verification</span>
          </div>
        );
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Org verification badge */}
          {getStatusBadge() && <div className="mb-2">{getStatusBadge()}</div>}

          {/* Nav items */}
          <nav className="space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-xs text-gray-500">
            <p className="font-semibold text-gray-700">CareSupply Share</p>
            <p className="text-[11px] mt-0.5">Connecting care, reducing waste</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
