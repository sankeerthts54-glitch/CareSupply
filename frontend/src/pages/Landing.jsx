import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  PackagePlus,
  Search,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Boxes,
} from 'lucide-react';
import AuroraFlow from '../components/ui/AuroraFlow';

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ── Hero (Live WebGL Aurora Flow) ─────────────────────────────────── */}
      <div className="relative min-h-screen flex flex-col bg-[#040a16] overflow-hidden">
        {/* Real-time WebGL Aurora Shader */}
        <AuroraFlow
          colors={['#17e8a8', '#2fc3f2', '#9a6cf8']}
          bg="#040a16"
          speed={0.45}
          softness={0.65}
          ribbons={3}
          angle={7}
          amplitude={0.3}
          scale={1.4}
          contrast={1.3}
          grain={0.05}
          yFocus={0.36}
        />

        {/* Navbar — sits on top of the effect */}
        <header className="w-full bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-md backdrop-blur-sm">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-white text-xl tracking-tight">
                  CareSupply <span className="text-[#52B788] font-extrabold">Share</span>
                </span>
                <p className="text-[11px] text-white/50 font-medium">Healthcare Surplus Redistribution</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-semibold bg-[#52B788] hover:bg-[#40916C] text-[#0d2b1a] rounded-lg shadow-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero content */}
        <div className="flex-1 flex items-center relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-7">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#52B788]/15 border border-[#52B788]/30 text-[#74C69D] text-xs sm:text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
                  Connecting communities. Sharing care.
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
                  Redistributing medical supplies to where they're{' '}
                  <span className="text-[#52B788]">
                    needed most
                  </span>
                  .
                </h1>

                <p className="text-base sm:text-lg text-white/65 max-w-2xl leading-relaxed">
                  CareSupply Share bridges the gap between surplus healthcare inventory and community healthcare providers, hospices, and clinics. Reduce medical waste and extend compassionate care through verified peer redistribution.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 text-base px-6 py-3 rounded-lg font-semibold bg-[#52B788] hover:bg-[#40916C] text-[#0d2b1a] shadow-xl transition-colors"
                  >
                    Register Your Organisation <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-base px-6 py-3 rounded-lg font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-colors"
                  >
                    Sign In to Portal
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#52B788]" />
                    <span>Verified Healthcare Non-Profits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#52B788]" />
                    <span>Transparent Chain of Custody</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-[#52B788]" />
                    <span>Tracked Expiry Dates</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual Mockup */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/15 ring-1 ring-white/10">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#52B788] text-[#0d2b1a] flex items-center justify-center font-bold">
                        CS
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Recent Supply Donation</h4>
                        <p className="text-xs text-white/50">St. Jude Community Health</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-[#52B788]/20 text-[#74C69D] rounded-full border border-[#52B788]/30">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl text-xs space-y-1 border border-white/10">
                      <span className="font-semibold text-white text-sm block">Surgical Gloves &amp; Sterile Gauze</span>
                      <p className="text-white/50">50 Boxes • Unopened &amp; Sealed</p>
                      <p className="text-amber-400 font-medium">Expires in 6 months</p>
                    </div>

                    <div className="p-3 bg-[#52B788]/10 rounded-xl border border-[#52B788]/20">
                      <div className="flex items-center justify-between text-xs text-[#74C69D] font-semibold mb-1">
                        <span>Matched Handover</span>
                        <span>85% complete</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#52B788] h-full w-[85%] rounded-full" />
                      </div>
                      <p className="text-[11px] text-white/40 mt-2">
                        Dispatch verified by Hope Clinic. Ready for receipt confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                    <span>Zero-cost donation platform</span>
                    <span className="font-semibold text-[#52B788]">100% Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Highlights ───────────────────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-primary-900">
              How CareSupply Share Works
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              A frictionless workflow tailored for medical donors and recipient healthcare organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 hover:shadow-md transition-shadow duration-200 border-primary-100/60 bg-gradient-to-b from-white to-primary-50/20">
              <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-6 shadow-md">
                <PackagePlus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">1. Donate Supplies</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hospitals, pharmacies, and manufacturers list unused, unexpired medical consumables, PPE, and equipment in minutes.
              </p>
            </div>

            <div className="card p-8 hover:shadow-md transition-shadow duration-200 border-primary-100/60 bg-gradient-to-b from-white to-primary-50/20">
              <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-6 shadow-md">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">2. Find What You Need</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Free clinics, shelters, and care providers search listings by category, location, and condition to request vital resources.
              </p>
            </div>

            <div className="card p-8 hover:shadow-md transition-shadow duration-200 border-primary-100/60 bg-gradient-to-b from-white to-primary-50/20">
              <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-6 shadow-md">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">3. Track Handovers</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Follow real-time status steps from approval and scheduled pickup to dispatch and final receipt verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-16 bg-primary-800 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to make a difference in healthcare delivery?
          </h2>
          <p className="text-primary-100 text-base max-w-2xl mx-auto">
            Join hundreds of healthcare organisations collaborating to reduce waste and bring relief to vulnerable patients.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-primary-400 hover:bg-primary-300 text-primary-950 font-bold px-8 py-3.5 rounded-lg shadow-lg transition-colors text-base"
            >
              Create an Account
            </Link>
            <Link
              to="/login"
              className="bg-primary-900/60 hover:bg-primary-900 text-white border border-primary-600 font-medium px-8 py-3.5 rounded-lg transition-colors text-base"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} CareSupply Share. All rights reserved. Connecting communities, sharing care.</p>
      </footer>
    </div>
  );
};

export default Landing;

