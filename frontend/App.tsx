
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FillFormView from './views/FillFormView';
import PreviewView from './views/PreviewView';
import AnalyticsView from './views/AnalyticsView';
import TargetView from './views/TargetView';
import PowerPointView from './views/PowerPointView';
import ProgressCalculatorView from './views/ProgressCalculatorView';
import ResponsesView from './views/ResponsesView';
import LoginView from './views/LoginView';
import ApproveUsersView from './views/ApproveUsersView';
import AssignIndicatorsView from './views/AssignIndicatorsView';
import DataChangeRequestsView from './views/DataChangeRequestsView';
import MonitorSubmitView from './views/MonitorSubmitView';
import ManageUsersView from './views/ManageUsersView';
import { MonitoringEntry } from './types';
import { PILLARS, QUARTERS } from './data';
import { calculateQuarterProgress } from './utils/progressUtils';
import { API_ENDPOINTS, getSubmissionUrl, getAssignedIndicatorsUrl } from './config/api';

// Storage keys for session persistence
const STORAGE_KEYS = {
  USER: 'imihigo_user',
  ACTIVE_VIEW: 'imihigo_active_view',
  ASSIGNED_INDICATORS: 'imihigo_assigned_indicators'
};

// Live update interval (in milliseconds) - 30 seconds
const LIVE_UPDATE_INTERVAL = 30000;

interface UserInfo {
  email: string;
  name: string;
  role: string;
  isApproved?: boolean;
  userType?: 'super_admin' | 'head' | 'employee';
  unit?: string;
}

interface IndicatorAssignment {
  _id: string;
  indicatorId: string;
  indicatorName: string;
  pillarId: string;
  pillarName: string;
}

const App: React.FC = () => {
  // Initialize state from localStorage for session persistence
  const [activeView, setActiveView] = useState<'fill' | 'preview' | 'analytics' | 'targets' | 'ppt' | 'calculator' | 'responses' | 'approve-users' | 'assign-indicators' | 'profile' | 'data-change-requests' | 'monitor-submit' | 'manage-users'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);
    return (saved as any) || 'analytics';
  });

  // Submission period state for countdown display
  const [submissionPeriod, setSubmissionPeriod] = useState<{
    description: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [entries, setEntries] = useState<MonitoringEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<MonitoringEntry | null>(null);
  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [assignedIndicators, setAssignedIndicators] = useState<IndicatorAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASSIGNED_INDICATORS);
    return saved ? JSON.parse(saved) : [];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('imihigo_dark_mode');
    return saved === 'true';
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('imihigo_dark_mode', String(newValue));
      return newValue;
    });
  };

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  // Save active view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, activeView);
  }, [activeView]);

  // Save assigned indicators to localStorage
  useEffect(() => {
    if (assignedIndicators.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ASSIGNED_INDICATORS, JSON.stringify(assignedIndicators));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ASSIGNED_INDICATORS);
    }
  }, [assignedIndicators]);

  // Function to fetch entries from backend
  const fetchEntries = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLiveUpdating(true);
      const response = await fetch(API_ENDPOINTS.SUBMISSIONS);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      if (!silent) setIsLiveUpdating(false);
    }
  }, []);

  // Function to fetch assigned indicators for employee
  const fetchAssignedIndicators = useCallback(async () => {
    if (user?.userType === 'employee' && user?.email) {
      try {
        const response = await fetch(getAssignedIndicatorsUrl(user.email));
        if (response.ok) {
          const data = await response.json();
          setAssignedIndicators(data);
        }
      } catch (error) {
        console.error('Error fetching assigned indicators:', error);
      }
    }
  }, [user?.userType, user?.email]);

  // Initialize data on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Fetch assigned indicators when user logs in
  useEffect(() => {
    if (user?.userType === 'employee') {
      fetchAssignedIndicators();
    }
  }, [user, fetchAssignedIndicators]);

  // Live updates - Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!user) return; // Don't poll if not logged in

    const interval = setInterval(() => {
      fetchEntries(true); // Silent update (no loading indicator)

      // Also refresh assigned indicators for employees
      if (user?.userType === 'employee') {
        fetchAssignedIndicators();
      }
    }, LIVE_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [user, fetchEntries, fetchAssignedIndicators]);

  // Refresh entries when view changes to analytics, responses, or calculator
  useEffect(() => {
    if (activeView === 'analytics' || activeView === 'responses' || activeView === 'calculator') {
      fetchEntries();
    }
  }, [activeView, fetchEntries]);

  const handleAddEntry = async (entry: MonitoringEntry) => {
    // If we're adding an entry that already exists (update), replace it locally
    const entryId = (entry as any)._id;
    if (entryId) {
      setEntries(prev => prev.map(e => (e as any)._id === entryId ? entry : e));
    } else {
      setEntries(prev => [entry, ...prev]);
    }
    setEditingEntry(null);

    // Refresh from database to ensure data is in sync
    await fetchEntries();
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      try {
        const response = await fetch(getSubmissionUrl(id), { method: 'DELETE' });
        if (response.ok) {
          setEntries(prev => prev.filter(e => (e as any)._id !== id));
        }
      } catch (error) {
        console.error('Error deleting submission:', error);
      }
    }
  };

  const handleStartEdit = (entry: MonitoringEntry) => {
    setEditingEntry(entry);
    setActiveView('fill');
  };

  const handleClearEntries = async () => {
    if (confirm('Are you sure you want to clear all reporting data? This will remove all submissions from the database.')) {
      try {
        const response = await fetch(API_ENDPOINTS.CLEAR_DATA, { method: 'POST' });
        if (response.ok) {
          setEntries([]);
          alert('Database cleared successfully');
        }
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  };


  const handleLogin = (userInfo: UserInfo, indicators?: IndicatorAssignment[]) => {
    setUser(userInfo);
    if (indicators) {
      setAssignedIndicators(indicators);
    }
    // Set default view based on user type
    if (userInfo.userType === 'super_admin') {
      setActiveView('analytics');
    } else if (userInfo.userType === 'head') {
      setActiveView('analytics');
    } else {
      setActiveView('analytics');
    }
  };

  const handleLogout = () => {
    // Clear session from localStorage
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_VIEW);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNED_INDICATORS);

    // Reset state
    setUser(null);
    setAssignedIndicators([]);
    setActiveView('analytics');
  };


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Filter entries for employees to show only their assigned indicators
  const getFilteredEntries = () => {
    if (user?.userType === 'employee') {
      const assignedIndicatorIds = assignedIndicators.map(a => a.indicatorId);
      return entries.filter(e =>
        e.submittedBy === user.email || assignedIndicatorIds.includes(e.indicatorId)
      );
    }
    return entries;
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Positioned absolutely on mobile, relatively on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          activeView={activeView}
          entries={entries}
          user={user}
          onLogout={handleLogout}
          setActiveView={(view) => {
            setActiveView(view);
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar onMenuClick={toggleSidebar} user={user} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto pb-12">
            {activeView === 'fill' && (
              <FillFormView
                entries={entries}
                onAddEntry={handleAddEntry}
                onClear={handleClearEntries}
                initialEntry={editingEntry}
                userEmail={user.email}
                userName={user.name}
                userRole={user.role}
                userType={user.userType}
                userUnit={user.unit}
                assignedIndicators={assignedIndicators}
                onCancelEdit={() => {
                  setEditingEntry(null);
                  setActiveView('responses');
                }}
              />
            )}
            {activeView === 'responses' && (
              <ResponsesView
                entries={user.userType === 'employee'
                  ? entries.filter(e => e.submittedBy === user.email)
                  : entries
                }
                user={user}
                onEdit={handleStartEdit}
                onDelete={handleDeleteEntry}
                onClear={user.userType === 'employee' ? undefined : handleClearEntries}
              />
            )}
            {activeView === 'targets' && (
              <TargetView />
            )}
            {activeView === 'ppt' && (
              <PowerPointView entries={entries} />
            )}
            {activeView === 'preview' && (
              <PreviewView entries={entries} />
            )}
            {activeView === 'analytics' && (
              <AnalyticsView entries={getFilteredEntries()} userType={user.userType} />
            )}
            {activeView === 'calculator' && (
              <ProgressCalculatorView entries={entries} />
            )}
            {activeView === 'approve-users' && user.userType === 'super_admin' && (
              <ApproveUsersView adminEmail={user.email} />
            )}
            {activeView === 'assign-indicators' && user.userType === 'head' && (
              <AssignIndicatorsView user={user} />
            )}
            {activeView === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                      <p className="text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Position</p>
                      <p className="text-lg font-semibold text-slate-900">{user.role}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit</p>
                      <p className="text-lg font-semibold text-slate-900">{user.unit || 'Not assigned'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Type</p>
                      <p className="text-lg font-semibold text-slate-900 capitalize">{user.userType || 'Employee'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Indicators</p>
                      <p className="text-lg font-semibold text-slate-900">{assignedIndicators.length}</p>
                    </div>
                  </div>

                  {assignedIndicators.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-3">My Assigned Indicators</h3>
                      <div className="space-y-2">
                        {assignedIndicators.map(ind => (
                          <div key={ind._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                            <div>
                              <p className="font-medium text-slate-900">{ind.indicatorName}</p>
                              <p className="text-sm text-slate-500">{ind.pillarName}</p>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                              ID: {ind.indicatorId}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeView === 'data-change-requests' && user.userType === 'head' && (
              <DataChangeRequestsView user={user} />
            )}
            {activeView === 'monitor-submit' && user.userType === 'super_admin' && (
              <MonitorSubmitView user={user} />
            )}
            {activeView === 'manage-users' && user.userType === 'super_admin' && (
              <ManageUsersView adminEmail={user.email} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
