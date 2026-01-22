import React, { useState, useEffect } from 'react';
import { authGet } from '../utils/authFetch';

interface ProfileViewProps {
  user: {
    email: string;
    name: string;
    role: string;
    userType: string;
    unit?: string;
  };
}

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's submission history
    const fetchUserSubmissions = async () => {
      try {
        const response = await authGet('/api/submissions');
        if (response.ok) {
          const submissions = await response.json();
          // Filter submissions by current user
          const userSubs = submissions.filter((sub: any) => sub.submittedBy === user.email);
          setUserSubmissions(userSubs);
        }
      } catch (error) {
        console.error('Error fetching user submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSubmissions();
  }, [user.email]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">My Profile</h1>
        <p className="text-slate-600">View your profile information and submission history</p>
      </header>

      {/* Profile Information */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-900 font-medium">{user.name || 'Not specified'}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-900 font-medium">{user.email}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">User Type</label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-900 font-medium capitalize">{user.userType || 'Not specified'}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-900 font-medium capitalize">{user.role || 'Not specified'}</p>
            </div>
          </div>
          
          {user.unit && (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Unit/Department</label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-900 font-medium">{user.unit}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission History */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          My Submission History
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Loading your submissions...</p>
          </div>
        ) : userSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 font-medium">No submissions yet</p>
            <p className="text-slate-400 text-sm mt-1">Start submitting data to see your history here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Indicator</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {userSubmissions.map((submission, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {submission.indicatorName || 'Unknown Indicator'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {submission.month} ({submission.quarterId?.toUpperCase() || 'N/A'})
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {submission.value?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(submission.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
