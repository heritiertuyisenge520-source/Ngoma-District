import React, { useState, useEffect, useMemo } from 'react';
import { PILLARS } from '../data';
import { API_ENDPOINTS, getAssignedIndicatorsUrl, getUnassignIndicatorUrl } from '../config/api';

interface User {
    _id: string;
    email: string;
    name: string;
    role: string;
    unit: string;
    userType: string;
}

interface Assignment {
    _id: string;
    userId: string;
    userEmail: string;
    userName: string;
    pillarId: string;
    pillarName: string;
    indicatorId: string;
    indicatorName: string;
    assignedAt: string;
}

interface AssignIndicatorsViewProps {
    user: {
        email: string;
        name: string;
        role: string;
        unit?: string;
        userType?: string;
    };
}

const AssignIndicatorsView: React.FC<AssignIndicatorsViewProps> = ({ user }) => {
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedPillar, setSelectedPillar] = useState<string>('');
    const [selectedIndicator, setSelectedIndicator] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Get indicators for selected pillar
    const indicators = useMemo(() => {
        if (!selectedPillar) return [];
        const pillar = PILLARS.find(p => p.name === selectedPillar);
        if (!pillar) return [];
        return pillar.outputs.flatMap(o => o.indicators).map(ind => ({
            id: ind.id,
            name: ind.name
        }));
    }, [selectedPillar]);

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch(`${API_ENDPOINTS.APPROVED_USERS}?unit=${encodeURIComponent(user.unit || '')}`);
            if (response.ok) {
                const data = await response.json();
                // Filter to show only employees in the same unit (not heads)
                setTeamMembers(data.filter((u: User) => u.userType === 'employee' && u.email !== user.email));
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            if (!user.unit) return;
            const response = await fetch(`${API_ENDPOINTS.UNIT_ASSIGNMENTS}/${encodeURIComponent(user.unit)}`);
            if (response.ok) {
                const data = await response.json();
                setAssignments(data);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchTeamMembers(), fetchAssignments()]);
            setIsLoading(false);
        };
        loadData();
    }, [user.unit]);

    const handleAssign = async () => {
        if (!selectedUser || !selectedPillar || !selectedIndicator) {
            alert('Please select a user, pillar, and indicator');
            return;
        }

        const targetUser = teamMembers.find(m => m._id === selectedUser);
        const indicator = indicators.find(i => i.id === selectedIndicator);

        if (!targetUser || !indicator) {
            alert('Invalid selection');
            return;
        }

        try {
            setIsAssigning(true);
            const response = await fetch(API_ENDPOINTS.ASSIGN_INDICATOR, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUser._id,
                    userEmail: targetUser.email,
                    userName: targetUser.name,
                    pillarId: selectedPillar,
                    pillarName: selectedPillar,
                    indicatorId: selectedIndicator,
                    indicatorName: indicator.name,
                    assignedBy: user.name,
                    assignedByEmail: user.email,
                    unit: user.unit
                })
            });

            if (response.ok) {
                alert('Indicator assigned successfully!');
                setSelectedIndicator('');
                fetchAssignments();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to assign indicator');
            }
        } catch (error) {
            console.error('Error assigning indicator:', error);
            alert('Error assigning indicator');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnassign = async (assignmentId: string) => {
        if (!confirm('Are you sure you want to remove this assignment?')) {
            return;
        }

        try {
            const response = await fetch(getUnassignIndicatorUrl(assignmentId), {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Assignment removed');
                fetchAssignments();
            } else {
                alert('Failed to remove assignment');
            }
        } catch (error) {
            console.error('Error removing assignment:', error);
            alert('Error removing assignment');
        }
    };

    const inputClasses = "w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer";

    // Group assignments by user
    const assignmentsByUser = useMemo(() => {
        const grouped: { [key: string]: Assignment[] } = {};
        assignments.forEach(a => {
            if (!grouped[a.userEmail]) {
                grouped[a.userEmail] = [];
            }
            grouped[a.userEmail].push(a);
        });
        return grouped;
    }, [assignments]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Assign Indicators</h1>
                <p className="mt-2 text-sm md:text-base text-slate-600 font-medium">
                    Assign indicators to team members in your unit: <span className="text-blue-600 font-bold">{user.unit}</span>
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assignment Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
                        <h3 className="text-lg font-bold text-slate-900">New Assignment</h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                Select Team Member
                            </label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className={inputClasses}
                            >
                                <option value="">-- Select User --</option>
                                {teamMembers.map(member => (
                                    <option key={member._id} value={member._id}>
                                        {member.name} ({member.role})
                                    </option>
                                ))}
                            </select>
                            {teamMembers.length === 0 && !isLoading && (
                                <p className="text-xs text-amber-600 font-medium mt-1">
                                    No team members found in your unit. They need to be approved first.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                Select Pillar
                            </label>
                            <select
                                value={selectedPillar}
                                onChange={(e) => {
                                    setSelectedPillar(e.target.value);
                                    setSelectedIndicator('');
                                }}
                                className={inputClasses}
                            >
                                <option value="">-- Select Pillar --</option>
                                {PILLARS.map(p => (
                                    <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                Select Indicator
                            </label>
                            <select
                                value={selectedIndicator}
                                onChange={(e) => setSelectedIndicator(e.target.value)}
                                disabled={!selectedPillar}
                                className={inputClasses}
                            >
                                <option value="">-- Select Indicator --</option>
                                {indicators.map(ind => (
                                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleAssign}
                            disabled={isAssigning || !selectedUser || !selectedPillar || !selectedIndicator}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isAssigning ? (
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Assign to User</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Team Stats */}
                    <div className="mt-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider">Team Members</p>
                                <p className="text-3xl font-black mt-1">{teamMembers.length}</p>
                            </div>
                            <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider">Active Assignments</p>
                            <p className="text-2xl font-black mt-1">{assignments.length}</p>
                        </div>
                    </div>
                </div>

                {/* Current Assignments */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-900">Current Assignments</h3>
                            <p className="text-sm text-slate-500 mt-1">Indicators assigned to team members</p>
                        </div>

                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                <p className="mt-4 text-slate-500">Loading assignments...</p>
                            </div>
                        ) : Object.keys(assignmentsByUser).length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-slate-900">No Assignments Yet</h4>
                                <p className="text-slate-500 text-sm mt-1">Assign indicators to your team members using the form.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {Object.entries(assignmentsByUser).map(([email, userAssignments]: [string, Assignment[]]) => (
                                    <div key={email} className="p-6">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                                                {userAssignments[0].userName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{userAssignments[0].userName}</h4>
                                                <p className="text-sm text-slate-500">{email}</p>
                                            </div>
                                            <span className="ml-auto bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                {userAssignments.length} indicator{userAssignments.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="space-y-2 ml-13">
                                            {userAssignments.map((assignment: Assignment) => (
                                                <div key={assignment._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-slate-900 text-sm">{assignment.indicatorName}</p>
                                                        <p className="text-xs text-slate-500">{assignment.pillarName} • ID: {assignment.indicatorId}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnassign(assignment._id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                                                        title="Remove assignment"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignIndicatorsView;
