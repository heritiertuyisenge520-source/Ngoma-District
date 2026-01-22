import React, { useEffect, useMemo, useState } from 'react';
import { authFetch, authGet } from '../utils/authFetch';

type Audience = 'all' | 'unit' | 'planning_head';

type Announcement = {
  _id: string;
  message: string;
  audience: Audience;
  targetUnit?: string | null;
  createdByEmail?: string | null;
  createdByName?: string | null;
  createdAt: string;
};

interface PublishCommentViewProps {
  user: {
    email: string;
    name: string;
    role: string;
    userType?: 'super_admin' | 'head' | 'employee';
    unit?: string;
  };
}

const PublishCommentView: React.FC<PublishCommentViewProps> = ({ user }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>('all');
  const [targetUnit, setTargetUnit] = useState('');
  const [message, setMessage] = useState('');

  const [units, setUnits] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const audienceLabel = useMemo(() => {
    if (audience === 'all') return 'All users';
    if (audience === 'unit') return 'One unit';
    return 'Head of Planning';
  }, [audience]);

  const resetForm = () => {
    setAudience('all');
    setTargetUnit('');
    setMessage('');
    setError('');
  };

  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      const res = await authGet('/api/auth/units');
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      const data = await res.json();
      setUnits(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Failed to load units:', e);
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingList(true);
      setError('');
      const res = await authFetch('/api/announcements', { method: 'GET' });
      if (!res.ok) {
        let msg = res.statusText;
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const data = await res.json();
      setAnnouncements(Array.isArray(data?.announcements) ? data.announcements : []);
    } catch (e: any) {
      console.error('Failed to load comments:', e);
      setError(e?.message || 'Failed to load comments');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchAnnouncements();
  }, []);

  const publish = async () => {
    try {
      setPublishing(true);
      setError('');

      const trimmed = message.trim();
      if (!trimmed) {
        setError('Please write a comment first.');
        return;
      }

      if (audience === 'unit' && !targetUnit) {
        setError('Please select a unit.');
        return;
      }

      const payload: any = {
        message: trimmed,
        audience,
      };
      if (audience === 'unit') payload.targetUnit = targetUnit;

      const res = await authFetch('/api/announcements/publish', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = res.statusText;
        try {
          const data = await res.json();
          msg = data?.message || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchAnnouncements();
    } catch (e: any) {
      console.error('Failed to publish comment:', e);
      setError(e?.message || 'Failed to publish comment');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Publish Comment</h1>
            <p className="text-slate-600 text-sm mt-1">
              Publish a short message to all users, a specific unit, or the Head of Planning.
            </p>
          </div>

          <button
            onClick={() => {
              setIsDialogOpen(true);
              setError('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-colors"
          >
            New Comment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <div className="font-semibold">{error}</div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">Recent Comments</h2>
          <button
            onClick={fetchAnnouncements}
            disabled={loadingList}
            className="text-sm font-bold text-slate-600 hover:text-slate-900 disabled:text-slate-400"
          >
            {loadingList ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {loadingList ? (
          <div className="text-slate-500">Loading comments…</div>
        ) : announcements.length === 0 ? (
          <div className="text-slate-500">No comments yet.</div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a._id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-slate-900 font-semibold whitespace-pre-wrap">{a.message}</div>
                    <div className="text-xs text-slate-500 mt-2">
                      {new Date(a.createdAt).toLocaleString()} • From: {a.createdByEmail || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    {a.audience === 'all'
                      ? 'All'
                      : a.audience === 'unit'
                      ? `Unit${a.targetUnit ? `: ${a.targetUnit}` : ''}`
                      : 'Planning Head'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={() => {
              setIsDialogOpen(false);
              resetForm();
            }}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-slate-900">New Comment</div>
                <div className="text-xs text-slate-500">Publishing as: {user.email}</div>
              </div>
              <button
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                  Destination
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAudience('all')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      audience === 'all'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-slate-900 text-sm">All users</div>
                    <div className="text-xs text-slate-500">Everyone in the system</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudience('unit')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      audience === 'unit'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-slate-900 text-sm">One unit</div>
                    <div className="text-xs text-slate-500">Send to a selected unit</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudience('planning_head')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      audience === 'planning_head'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-slate-900 text-sm">Head of Planning</div>
                    <div className="text-xs text-slate-500">Planning unit head only</div>
                  </button>
                </div>

                {audience === 'unit' && (
                  <div className="mt-4">
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                      Select Unit
                    </label>
                    <select
                      value={targetUnit}
                      onChange={(e) => setTargetUnit(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      disabled={loadingUnits}
                    >
                      <option value="">{loadingUnits ? 'Loading units…' : 'Choose a unit'}</option>
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">
                  Comment
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder={`Write a comment for ${audienceLabel}...`}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
                <div className="text-xs text-slate-500 mt-2">Max 2000 characters.</div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex flex-col md:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                className="px-5 py-3 rounded-xl font-black text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={publishing}
              >
                Cancel
              </button>
              <button
                onClick={publish}
                className="px-5 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-slate-400"
                disabled={publishing}
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishCommentView;
