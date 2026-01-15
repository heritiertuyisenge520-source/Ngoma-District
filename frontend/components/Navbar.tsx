
import React from 'react';

interface NavbarProps {
  onMenuClick: () => void;
  user: { email: string; name: string; role: string } | null;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, user }) => {
  return (
    <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center z-10 shrink-0">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <h2 className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest truncate">Workspace / Performance Dashboard</h2>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-none">{user?.name || 'Monitoring Officer'}</p>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{user?.role || 'District Level'}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 overflow-hidden">
            {user?.name ? (
              <span className="text-blue-600 font-bold text-xs">{user.name.charAt(0)}</span>
            ) : (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
