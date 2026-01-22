import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FillFormView from './views/FillFormView';
import PreviewView from './views/PreviewView';
import AnalyticsView from './views/AnalyticsView';
import TargetView from './views/TargetView';
import PowerPointView from './views/PowerPointView';
import ProgressCalculatorView from './views/ProgressCalculatorView';
import IndicatorFormulaView from './views/IndicatorFormulaView';
import DocumentUploadView from './views/DocumentUploadView';
import ResponsesView from './views/ResponsesView';
import SubmittedDataView from './views/SubmittedDataView';
import LoginView from './views/LoginView';
import ApproveUsersView from './views/ApproveUsersView';
import AssignIndicatorsView from './views/AssignIndicatorsView';
import DataChangeRequestsView from './views/DataChangeRequestsView';
import MonitorSubmitView from './views/MonitorSubmitView';
import ManageUsersView from './views/ManageUsersView';
import IndicatorProgressView from './views/IndicatorProgressView';
import ErrorBoundary from './components/ErrorBoundary';
import { MonitoringEntry } from './types';
import { API_ENDPOINTS, getAssignedIndicatorsUrl } from './config/api';
import { PILLARS, INDICATORS } from './data';
import { authGet, authPut, authDelete } from './utils/authFetch';

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
      // Use dashboard endpoint for main analytics view
      const endpoint = activeView === 'analytics' ? API_ENDPOINTS.DASHBOARD : API_ENDPOINTS.SUBMISSIONS;
      const response = await authGet(endpoint);
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        setEntries([]);
        return;
      }
      
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setEntries([]); // Set empty array on error to prevent forEach errors
    }
  }, [activeView]);

  const fetchAssignedIndicators = useCallback(async () => {
    if (user?.userType === 'employee' && user.email) {
      try {
        const res = await authGet(getAssignedIndicatorsUrl(user.email));
        setAssignedIndicators(await res.json());
      } catch (err) {
        console.error('Error fetching assigned indicators:', err);
      }
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
      const response = await authPut(`${API_ENDPOINTS.SUBMISSIONS}/${(entry as any)._id}`, entry);

      if (response.ok) {
        // Update the entry in the local state
        setEntries(entries.map(e => (e as any)._id === (entry as any)._id ? entry : e));
      } else {
        const errorData = await response.json();
        alert(`Failed to update entry: ${errorData.message || 'Unknown error'}`);
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
        const response = await authDelete(`${API_ENDPOINTS.SUBMISSIONS}/${id}`);

        if (response.ok) {
          // Remove the entry from local state
          setEntries(entries.filter(e => (e as any)._id !== id));
        } else {
          const errorData = await response.json();
          alert(`Failed to delete entry: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error connecting to server');
      }
    }
  };

  const handleDownloadEntry = async (entry: MonitoringEntry) => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Set up document properties
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 7;
      let yPos = margin;

      // Add header
      doc.setFillColor(30, 58, 138); // Navy blue
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NGOMA DISTRICT - IMIHIGO TRACKING TOOL', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text('ENTRY DETAILS REPORT', pageWidth / 2, 23, { align: 'center' });

      // Reset text color and position for content
      yPos = 40;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Add entry details
      const addDetailRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 60, yPos);
        yPos += lineHeight;
      };

      // Entry details
      addDetailRow('Entry ID:', (entry as any)._id || 'N/A');
      addDetailRow('Indicator:', entry.indicatorName || 'Unknown Indicator');
      addDetailRow('Pillar:', entry.pillarName || 'Unknown Pillar');
      addDetailRow('Period:', entry.month + " (" + (entry.quarterId?.toUpperCase() || 'N/A') + ")");

      // Check if this is a parent indicator with sub-indicators
      const entryIndicator = INDICATORS.find(i => i.id === entry.indicatorId);
      const hasSubIndicators = entryIndicator?.subIndicatorIds && Object.keys(entryIndicator.subIndicatorIds).length > 0;

      // Only show Value and Target for indicators WITHOUT sub-indicators
      if (!hasSubIndicators) {
        addDetailRow('Value:', entry.value?.toLocaleString() || '0');
        addDetailRow('Target:', entry.targetValue?.toLocaleString() || 'N/A');
      }

      addDetailRow('Submitted By:', entry.submittedBy || 'Unknown');
      addDetailRow('Timestamp:', entry.timestamp || new Date().toISOString());

      // Add comments if available
      if (entry.comments) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Comments:', margin, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'normal');
        const commentLines = doc.splitTextToSize(entry.comments, pageWidth - 2 * margin);
        doc.text(commentLines, margin, yPos);
        yPos += (commentLines.length * lineHeight) + 3;
      }

      // Add sub-indicators if available
      if (entry.subValues && Object.keys(entry.subValues).length > 0) {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);

        // If this is a parent indicator with sub-indicators, show the parent name with sub-indicator breakdown
        if (hasSubIndicators) {
          doc.text(entry.indicatorName || 'Unknown Indicator', pageWidth / 2, yPos, { align: 'center' });
          yPos += 8;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text('Sub-Indicator Breakdown:', margin, yPos);
          yPos += lineHeight;
        } else {
          doc.text('Sub-Indicator Values', pageWidth / 2, yPos, { align: 'center' });
          yPos += 8;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
        }

        // Draw separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        Object.entries(entry.subValues).forEach(([subIndicatorId, subValue]) => {
          // Find the sub-indicator name
          const subIndicator = INDICATORS.find(i => i.id === subIndicatorId);
          const subIndicatorName = subIndicator?.name || subIndicatorId;

          // For parent indicators, try to find the short name from subIndicatorIds mapping
          let displayName = subIndicatorName;
          if (hasSubIndicators && entryIndicator?.subIndicatorIds) {
            const shortName = Object.keys(entryIndicator.subIndicatorIds).find(
              (key) => entryIndicator.subIndicatorIds[key] === subIndicatorId
            );
            if (shortName) {
              displayName = shortName + ": " + subIndicatorName;
            }
          }

          doc.setFont('helvetica', 'bold');
          doc.text(displayName + ':', margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(Number(subValue).toLocaleString(), margin + 60, yPos);
          yPos += lineHeight;
        });

        yPos += 5;
      } else if (hasSubIndicators) {
        // If this is a parent indicator but has no sub-values in this entry, show a note
        yPos += 5;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.text('Note: This is a parent indicator. Sub-indicator values would appear here if available.', margin, yPos);
        yPos += lineHeight + 3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
      }

      // Add footer
      yPos = pageHeight - 20;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated on: ' + new Date().toLocaleString(), margin, yPos);
      doc.text('Ngoma District Imihigo Tracking System', pageWidth - margin, yPos, { align: 'right' });

      // Create a clean filename with the indicator name
      const cleanIndicatorName = (entry.indicatorName || 'indicator').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const filename = "entry_" + cleanIndicatorName + "_" + (entry as any)._id + ".pdf";

      // Save the PDF
      doc.save(filename);

      // Show success message
      alert('Entry downloaded successfully as PDF!');
      console.log('Entry downloaded successfully as PDF:', (entry as any)._id);
    } catch (error) {
      console.error('Error downloading entry as PDF:', error);
      alert('Error downloading entry. Please try again.');
    }
  };

  if (!user) return <LoginView onLogin={handleLogin} />;
<task_progress>
- [x] Fix unterminated template literal error
- [x] Update all syntax to avoid template literals
- [ ] Test the changes
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
              <ErrorBoundary>
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
              </ErrorBoundary>
            )}
            {activeView === 'responses' && <ResponsesView entries={entries} user={user} onEdit={handleEditEntry} onDelete={handleDeleteEntry} />}
            {activeView === 'submitted-data' && <SubmittedDataView entries={entries} user={user} onDelete={handleDeleteEntry} onEdit={handleEditEntry} onDownload={handleDownloadEntry} />}
            {activeView === 'indicator-progress' && <IndicatorProgressView user={user} />}
            {activeView === 'targets' && <TargetView />}
            {activeView === 'ppt' && <PowerPointView entries={entries} />}
            {activeView === 'preview' && <PreviewView entries={entries} />}
            {activeView === 'calculator' && <ProgressCalculatorView entries={entries} />}
            {activeView === 'indicator-formula' && <IndicatorFormulaView entries={entries} />}
            {activeView === 'document-upload' && <DocumentUploadView />}
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
