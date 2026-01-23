import React, { useState } from 'react';
import { PILLARS, INDICATORS } from '../data';
import { MonitoringEntry } from '../types';

interface UserInfo {
  email: string;
  name: string;
  role: string;
  userType?: 'super_admin' | 'head' | 'employee';
  unit?: string;
}

interface ResponsesViewProps {
  entries: MonitoringEntry[];
  user: UserInfo;
  onEdit: (entry: MonitoringEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ResponsesView: React.FC<ResponsesViewProps> = ({ entries, user, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { value: string; comments: string }>>({});

  const filteredEntries = entries.filter(entry => {
    const pillar = PILLARS.find(p => p.id === entry.pillarId);
    const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
    const searchStr = `${pillar?.name} ${indicator?.name} ${entry.month} ${entry.comments}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleEditClick = (entry: MonitoringEntry) => {
    setEditingId((entry as any)._id);
    setEditValues({
      ...editValues,
      [(entry as any)._id]: {
        value: entry.value.toString(),
        comments: entry.comments || ''
      }
    });
  };

  const handleSaveClick = async (entry: MonitoringEntry) => {
    const entryId = (entry as any)._id;
    if (!entryId) return;

    const updatedEntry = {
      ...entry,
      value: Number(editValues[entryId]?.value || entry.value),
      comments: editValues[entryId]?.comments || entry.comments
    };

    await onEdit(updatedEntry);
    setEditingId(null);
  };

  const handleCancelClick = () => {
    setEditingId(null);
  };

  const canEdit = user.userType === 'super_admin' || user.userType === 'head';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Submitted Responses</h1>
          <p className="mt-2 text-slate-600 font-medium">Review, edit, and manage all submitted entries.</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search responses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 h-12 pl-12 pr-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
          />
          <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-left">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Pillar</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Indicator</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Period</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-right">Achievement</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, idx) => {
                  const entryId = (entry as any)._id;
                  const pillar = PILLARS.find(p => p.id === entry.pillarId);
                  const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
                  const isEditing = editingId === entryId;

                  return (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-900">{pillar?.name}</span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm font-semibold text-slate-900">
                          <p className="line-clamp-1">{indicator?.name}</p>
                          {/* Show parent indicator if this is a sub-indicator */}
                          {indicator && INDICATORS.some(parent => parent.subIndicatorIds?.[Object.keys(parent.subIndicatorIds || {}).find(key => parent.subIndicatorIds?.[key] === indicator.id) || '']) && (
                            <p className="text-xs text-slate-500 mt-1">
                              Sub-indicator of: {INDICATORS.find(parent => parent.subIndicatorIds && Object.values(parent.subIndicatorIds).includes(indicator.id))?.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600">{entry.month} ({entry.quarterId.toUpperCase()})</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues[entryId]?.value || entry.value}
                            onChange={(e) => setEditValues({
                              ...editValues,
                              [entryId]: {
                                ...editValues[entryId],
                                value: e.target.value
                              }
                            })}
                            className="w-20 h-8 px-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 font-bold text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
                          />
                        ) : (
                          <span className="text-sm font-black text-blue-700">{entry.value.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveClick(entry)}
                                className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelClick}
                                className="px-3 py-1 bg-slate-400 text-white text-xs font-bold rounded-lg hover:bg-slate-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {canEdit && (
                                <button
                                  onClick={() => handleEditClick(entry)}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => onDelete(entryId)}
                                  className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <p className="text-slate-500 font-bold">No matching records found</p>
                      <p className="text-sm text-slate-400">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponsesView;
