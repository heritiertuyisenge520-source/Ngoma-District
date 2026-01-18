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
import { API_ENDPOINTS, getAssignedIndicatorsUrl } from './config/api';

const STORAGE_KEYS = {
  USER: 'imihigo_user',
  ACTIVE_VIEW: 'imihigo_active_view',
};

const LIVE_UPDATE_INTERVAL = 30000;

interface UserInfo {
  email: string;
  name: string;
  role: string;
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
  const [activeView, setActiveView] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW) || 'analytics';
  });

  const [entries, setEntries] = useState<MonitoringEntry[]>([]);
  const [editingEntry] = useState<MonitoringEntry | null>(null);
  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [assignedIndicators, setAssignedIndicators] = useState<IndicatorAssignment[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SUBMISSIONS);
      if (response.ok) setEntries(await response.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAssignedIndicators = useCallback(async () => {
    if (user?.userType === 'employee' && user.email) {
      const res = await fetch(getAssignedIndicatorsUrl(user.email));
      if (res.ok) setAssignedIndicators(await res.json());
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      const i = setInterval(fetchEntries, LIVE_UPDATE_INTERVAL);
      return () => clearInterval(i);
    }
  }, [user, fetchEntries]);

  useEffect(() => {
    if (user?.userType === 'employee') fetchAssignedIndicators();
  }, [user, fetchAssignedIndicators]);

  const handleLogin = (u: UserInfo, indicators?: IndicatorAssignment[]) => {
    setUser(u);
    if (indicators) setAssignedIndicators(indicators);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setIsSidebarOpen(false);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, view);
    setIsSidebarOpen(false);
  };

  const handleEditEntry = async (entry: MonitoringEntry) => {
    // Only allow editing for super admins and heads of unit
    if (user?.userType !== 'super_admin' && user?.userType !== 'head') {
      alert('You do not have permission to edit data');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.SUBMISSIONS}/${(entry as any)._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      if (response.ok) {
        // Update the entry in the local state
        setEntries(entries.map(e => (e as any)._id === (entry as any)._id ? entry : e));
      } else {
        alert('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error connecting to server');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    // Only allow deletion for super admins and heads of unit
    if (user?.userType !== 'super_admin' && user?.userType !== 'head') {
      alert('You do not have permission to delete data');
      return;
    }

    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.SUBMISSIONS}/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Remove the entry from local state
          setEntries(entries.filter(e => (e as any)._id !== id));
        } else {
          alert('Failed to delete entry');
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error connecting to server');
      }
    }
  };

  if (!user) return <LoginView onLogin={handleLogin} />;
<task_progress>
- [x] Examine current permission structure
- [x] Check available views for data editing
- [x] Add data editing permission for admins
- [x] Update sidebar menu for admins
- [ ] Save changes
</task_progress>

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      <Sidebar
        activeView={activeView}
        entries={entries}
        user={user}
        onLogout={handleLogout}
        setActiveView={handleViewChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* FIX 1: added w-full here to ensure the container stretches.
        FIX 2: md:pl-64 pushes content right to accommodate sidebar.
        FIX 3: overflow-hidden prevents content from scrolling under sidebar.
      */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 w-full transition-all duration-300 overflow-hidden">

        <header className="h-16 w-full bg-white border-b border-slate-200 flex-shrink-0">
          <Navbar user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        </header>

        {/* FIX 3: Removed max-w-7xl. 
          The 'max-w-7xl' was causing your content to stop at 1280px, 
          leaving big empty spaces on the right of large monitors.
        */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 w-full">
          <div className="w-full h-full">
            {activeView === 'analytics' && <AnalyticsView entries={entries} userType={user.userType} />}
            {activeView === 'fill' && (
              <FillFormView
                entries={entries}
                onAddEntry={(e) => setEntries([e, ...entries])}
                initialEntry={editingEntry}
                userEmail={user.email}
                userName={user.name}
                userRole={user.role}
                userType={user.userType}
                userUnit={user.unit}
                assignedIndicators={assignedIndicators}
                onCancelEdit={() => setActiveView('responses')}
              />
            )}
            {activeView === 'responses' && <ResponsesView entries={entries} user={user} onEdit={handleEditEntry} onDelete={handleDeleteEntry} />}
            {activeView === 'targets' && <TargetView />}
            {activeView === 'ppt' && <PowerPointView entries={entries} />}
            {activeView === 'preview' && <PreviewView entries={entries} />}
            {activeView === 'calculator' && <ProgressCalculatorView entries={entries} />}
            {activeView === 'approve-users' && <ApproveUsersView adminEmail={user.email} />}
            {activeView === 'assign-indicators' && <AssignIndicatorsView user={user} />}
            {activeView === 'data-change-requests' && <DataChangeRequestsView user={user} />}
            {activeView === 'monitor-submit' && <MonitorSubmitView user={user} />}
            {activeView === 'manage-users' && <ManageUsersView adminEmail={user.email} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
