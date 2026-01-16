
import React, { useState, useEffect } from 'react';
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
import { MonitoringEntry } from './types';
import { PILLARS, QUARTERS } from './data';
import { calculateQuarterProgress } from './utils/progressUtils';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'fill' | 'preview' | 'analytics' | 'targets' | 'ppt' | 'calculator' | 'responses'>('analytics');
  const [entries, setEntries] = useState<MonitoringEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<MonitoringEntry | null>(null);
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to fetch entries from backend
  const fetchEntries = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  // Initialize with real data from backend
  useEffect(() => {
    fetchEntries();
  }, []);

  // Refresh entries when view changes to analytics, responses, or calculator
  useEffect(() => {
    if (activeView === 'analytics' || activeView === 'responses' || activeView === 'calculator') {
      fetchEntries();
    }
  }, [activeView]);

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
        const response = await fetch(`http://localhost:5000/api/submissions/${id}`, { method: 'DELETE' });
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
        const response = await fetch('http://localhost:5000/api/clear-data', { method: 'POST' });
        if (response.ok) {
          setEntries([]);
          alert('Database cleared successfully');
        }
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  };


  const handleLogin = (userInfo: { email: string; name: string; role: string }) => {
    setUser(userInfo);
  };

  const handleLogout = () => {
    setUser(null);
  };


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
                userRole={user.role}
                onCancelEdit={() => {
                  setEditingEntry(null);
                  setActiveView('responses');
                }}
              />
            )}
            {activeView === 'responses' && (
              <ResponsesView
                entries={user.role === 'Assign employee'
                  ? entries.filter(e => e.submittedBy === user.email)
                  : entries
                }
                user={user}
                onEdit={handleStartEdit}
                onDelete={handleDeleteEntry}
                onClear={user.role === 'Assign employee' ? undefined : handleClearEntries}
              />
            )}
            {activeView === 'targets' && (
              <TargetView />
            )}
            {activeView === 'ppt' && (
              <PowerPointView />
            )}
            {activeView === 'preview' && (
              <PreviewView entries={entries} />
            )}
            {activeView === 'analytics' && (
              <AnalyticsView entries={entries} />
            )}
            {activeView === 'calculator' && (
              <ProgressCalculatorView entries={entries} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
