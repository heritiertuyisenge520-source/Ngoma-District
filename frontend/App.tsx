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
import { API_ENDPOINTS, getSubmissionUrl, getAssignedIndicatorsUrl } from './config/api';

const STORAGE_KEYS = {
  USER: 'imihigo_user',
  ACTIVE_VIEW: 'imihigo_active_view',
  ASSIGNED_INDICATORS: 'imihigo_assigned_indicators'
};

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
  const [activeView, setActiveView] = useState<any>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);
    return saved || 'analytics';
  });

  const [entries, setEntries] = useState<MonitoringEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<MonitoringEntry | null>(null);
  const [user, setUser] = useState<UserInfo | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [assignedIndicators, setAssignedIndicators] = useState<IndicatorAssignment[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SUBMISSIONS);
      if (response.ok) {
        setEntries(await response.json());
      }
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
    if (user) fetchEntries();
  }, [user, fetchEntries]);

  useEffect(() => {
    if (user?.userType === 'employee') fetchAssignedIndicators();
  }, [user, fetchAssignedIndicators]);

  useEffect(() => {
    if (!user) return;
    const i = setInterval(() => {
      fetchEntries();
      if (user.userType === 'employee') fetchAssignedIndicators();
    }, LIVE_UPDATE_INTERVAL);
    return () => clearInterval(i);
  }, [user, fetchEntries, fetchAssignedIndicators]);

  const handleLogin = (u: UserInfo, indicators?: IndicatorAssignment[]) => {
    setUser(u);
    if (indicators) setAssignedIndicators(indicators);
    setActiveView('analytics');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setActiveView('analytics');
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, view);
  };

  if (!user) return <LoginView onLogin={handleLogin} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR - Fixed width, does NOT overlap content */}
      <div style={{
        width: '260px',
        minWidth: '260px',
        maxWidth: '260px',
        flexShrink: 0,
        backgroundColor: '#1e293b',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        <Sidebar
          activeView={activeView}
          entries={entries}
          user={user}
          onLogout={handleLogout}
          setActiveView={handleViewChange}
        />
      </div>

      {/* MAIN CONTENT - Takes remaining space */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f1f5f9'
      }}>
        {/* Navbar */}
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Navbar user={user} />
        </div>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
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
          {activeView === 'responses' && <ResponsesView entries={entries} user={user} />}
          {activeView === 'targets' && <TargetView />}
          {activeView === 'ppt' && <PowerPointView entries={entries} />}
          {activeView === 'preview' && <PreviewView entries={entries} />}
          {activeView === 'calculator' && <ProgressCalculatorView entries={entries} />}
          {activeView === 'approve-users' && <ApproveUsersView adminEmail={user.email} />}
          {activeView === 'assign-indicators' && <AssignIndicatorsView user={user} />}
          {activeView === 'data-change-requests' && <DataChangeRequestsView user={user} />}
          {activeView === 'monitor-submit' && <MonitorSubmitView user={user} />}
          {activeView === 'manage-users' && <ManageUsersView adminEmail={user.email} />}
        </main>
      </div>
    </div>
  );
};

export default App;
