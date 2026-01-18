import React from 'react';

interface NavbarProps {
  user: { email: string; name: string; role: string } | null;
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onMenuClick }) => {
  return (
    <div className="px-4 md:px-6 py-4 flex items-center justify-between">
      {/* Left - Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger Button - Only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-slate-400 hidden sm:block">/</span>
          <span className="text-sm font-medium text-slate-600 hidden sm:block">Workspace</span>
          <span className="text-slate-400 hidden sm:block">/</span>
          <span className="text-sm font-semibold text-slate-900">Performance Dashboard</span>
        </div>
      </div>

        {/* Right - User */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* User */}
          <div className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {user?.role || 'Role'}
              </p>
            </div>
            <div className="relative">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Navbar;
