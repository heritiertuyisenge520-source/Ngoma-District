import React, { useState, useEffect } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import { MonitoringEntry } from '../types';

interface BarcodeScannerViewProps {
  entries: MonitoringEntry[];
  onEditEntry: (entry: MonitoringEntry) => void;
  user: any;
}

const BarcodeScannerView: React.FC<BarcodeScannerViewProps> = ({ entries, onEditEntry, user }) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<string>('');
  const [foundEntry, setFoundEntry] = useState<MonitoringEntry | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleScan = (result: string) => {
    setScannedResult(result);
    setSearchHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 scans
    
    // Search for entry by ID or other identifiers
    const entry = entries.find(entry => {
      const entryId = (entry as any)._id;
      const entryValue = entry.value?.toString();
      const entryIndicatorName = entry.indicatorName?.toLowerCase();
      
      return (
        entryId === result ||
        entryValue === result ||
        entryIndicatorName?.includes(result.toLowerCase()) ||
        result.toLowerCase().includes(entryIndicatorName)
      );
    });

    if (entry) {
      setFoundEntry(entry);
    } else {
      setFoundEntry(null);
    }
  };

  const handleEditFoundEntry = () => {
    if (foundEntry) {
      onEditEntry(foundEntry);
      setIsScannerOpen(false);
      setScannedResult('');
      setFoundEntry(null);
    }
  };

  const handleNewScan = () => {
    setScannedResult('');
    setFoundEntry(null);
    setIsScannerOpen(true);
  };

  const handleManualSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      handleScan(searchTerm.trim());
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    setScannedResult('');
    setFoundEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Barcode Scanner</h1>
          <p className="text-slate-500 font-medium text-sm">Scan barcodes or search for entries by ID</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Result */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Scan Result</h3>
            
            <div className="space-y-4">
              {/* Scanned Value */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanned Value</label>
                <div className="mt-2 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 min-h-[60px] flex items-center">
                  {scannedResult ? (
                    <span className="font-mono text-lg font-bold text-blue-600">{scannedResult}</span>
                  ) : (
                    <span className="text-slate-400 italic">No barcode scanned yet</span>
                  )}
                </div>
              </div>

              {/* Manual Search */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Search</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter entry ID, value, or name..."
                    className="flex-1 p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualSearch((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Enter entry ID"]') as HTMLInputElement;
                      if (input) handleManualSearch(input.value);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Found Entry */}
              {foundEntry && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-green-800 mb-2">✓ Entry Found</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>ID:</strong> {(foundEntry as any)._id}</div>
                        <div><strong>Indicator:</strong> {foundEntry.indicatorName}</div>
                        <div><strong>Pillar:</strong> {foundEntry.pillarName}</div>
                        <div><strong>Value:</strong> {foundEntry.value?.toLocaleString()}</div>
                        <div><strong>Month:</strong> {foundEntry.month}</div>
                        <div><strong>Quarter:</strong> {foundEntry.quarterId?.toUpperCase()}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleEditFoundEntry}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-4"
                    >
                      Edit Entry
                    </button>
                  </div>
                </div>
              )}

              {/* Not Found */}
              {scannedResult && !foundEntry && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-800 font-medium">No entry found for this barcode/ID</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 013 7.07V3a2 2 0 00-2-2H3a2 2 0 00-2 2v4.07a2 2 0 01.89 1.664l.812 1.22A2 2 0 015.93 9H3zm0 2a2 2 0 002 2v2a2 2 0 01-2 2H3a2 2 0 01-2-2v-2a2 2 0 012-2h.93a2 2 0 001.664.89l.812-1.22A2 2 0 015.07 11H3z" />
                  </svg>
                  Open Scanner
                </button>
                <button
                  onClick={handleNewScan}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors"
                >
                  New Scan
                </button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
                <div className="text-sm text-blue-800 font-medium">Total Entries</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{searchHistory.length}</div>
                <div className="text-sm text-green-800 font-medium">Scans Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Scan History</h3>
              <button
                onClick={clearHistory}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
                title="Clear history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchHistory.length > 0 ? (
                searchHistory.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleScan(item)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-slate-700">{item}</span>
                      <span className="text-xs text-slate-400">#{index + 1}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 011-1V6a1 1 0 00-1-1H6a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                  <p className="text-slate-400 text-sm">No scan history yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200">
            <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wider mb-3">Quick Tips</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Scan QR codes from entry PDFs</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Search by entry ID or value</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Use manual search for text entries</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Camera permission required</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onScan={handleScan}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};

export default BarcodeScannerView;
