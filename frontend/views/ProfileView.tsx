import React, { useState, useEffect } from 'react';
import { authGet } from '../utils/authFetch';
import { getUserProfileUrl } from '../config/api';

interface ProfileViewProps {
  user: {
    email: string;
    name: string;
    role: string;
    userType: string;
    unit?: string;
  };
  viewUserEmail?: string; // Optional: email of user to view (if different from current user)
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, viewUserEmail }) => {
  const [profileUser, setProfileUser] = useState(user);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch profile user data if viewing another user's profile
  useEffect(() => {
    const fetchProfileUser = async () => {
      if (viewUserEmail && viewUserEmail !== user.email) {
        setProfileLoading(true);
        try {
          const response = await authGet(getUserProfileUrl(viewUserEmail));
          if (response.ok) {
            const profileData = await response.json();
            setProfileUser(profileData);
          } else {
            console.error('Error fetching user profile');
            setProfileUser(user); // Fallback to current user
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfileUser(user); // Fallback to current user
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileUser(user);
      }
    };

    fetchProfileUser();
  }, [viewUserEmail, user]);

  const getUserTypeColor = (userType?: string) => {
    switch (userType?.toLowerCase()) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'head':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'employee':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600';
    }
  };

  const getUserTypeBadge = (userType?: string) => {
    const color = getUserTypeColor(userType);
    return (
      <span className={`${color} text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm`}>
        {userType?.replace('_', ' ') || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Profile Header Card */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-8">
          {profileLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
              <p className="text-white/90 font-medium">Loading profile...</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {profileUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profileUser.name || 'Unknown User'}
                    </h1>
                    <p className="text-white/80 text-sm">
                      {viewUserEmail && viewUserEmail !== user.email ? 'User Profile' : 'My Profile'}
                    </p>
                  </div>
                </div>
                {getUserTypeBadge(profileUser.userType)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Information Cards Grid */}
      {!profileLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Card */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-base font-semibold text-slate-900 truncate">{profileUser.email}</p>
              </div>
            </div>
          </div>

          {/* Role Card */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Role</p>
                <p className="text-base font-semibold text-slate-900 capitalize">{profileUser.role || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* User Type Card */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">User Type</p>
                <p className="text-base font-semibold text-slate-900 capitalize">{profileUser.userType?.replace('_', ' ') || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Unit/Department Card */}
          {profileUser.unit ? (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unit/Department</p>
                  <p className="text-base font-semibold text-slate-900">{profileUser.unit}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group opacity-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unit/Department</p>
                  <p className="text-base font-semibold text-slate-400">Not assigned</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
