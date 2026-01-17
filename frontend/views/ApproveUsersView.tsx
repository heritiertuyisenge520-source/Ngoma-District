import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getRejectUserUrl } from '../config/api';

interface PendingUser {
    _id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: string;
    createdAt: string;
}

interface ApproveUsersViewProps {
    adminEmail: string;
}

const UNITS = [
    'Agriculture And Natural Resource Unit',
    'Business Development And Employment Unit',
    'Infrastructure One Stop Center',
    'Social Development Unit',
    'Health Unit',
    'Education Unit',
    'Good Governance Unit',
    'Planning, Monitoring and Evaluation Unit',
    'HR and Administration Unit',
    'Finance Unit',
    'Internal Audit'
];

const ApproveUsersView: React.FC<ApproveUsersViewProps> = ({ adminEmail }) => {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<{ [key: string]: string }>({});
    const [selectedUserType, setSelectedUserType] = useState<{ [key: string]: string }>({});
    const [processingUser, setProcessingUser] = useState<string | null>(null);

    const fetchPendingUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(API_ENDPOINTS.PENDING_USERS);
            if (response.ok) {
                const data = await response.json();
                setPendingUsers(data);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleApprove = async (userId: string) => {
        const unit = selectedUnit[userId];
        const userType = selectedUserType[userId];

        if (!unit) {
            alert('Please select a unit for this user');
            return;
        }

        if (!userType) {
            alert('Please select whether this user is a Head or Employee');
            return;
        }

        try {
            setProcessingUser(userId);
            const response = await fetch(API_ENDPOINTS.APPROVE_USER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    unit,
                    userType,
                    approverEmail: adminEmail
                })
            });

            if (response.ok) {
                alert('User approved successfully!');
                fetchPendingUsers();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to approve user');
            }
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Error approving user');
        } finally {
            setProcessingUser(null);
        }
    };

    const handleReject = async (userId: string) => {
        if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
            return;
        }

        try {
            setProcessingUser(userId);
            const response = await fetch(getRejectUserUrl(userId), {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('User rejected and removed');
                fetchPendingUsers();
            } else {
                alert('Failed to reject user');
            }
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert('Error rejecting user');
        } finally {
            setProcessingUser(null);
        }
    };

    const inputClasses = "w-full p-2.5 rounded-lg border-2 border-slate-200 bg-white text-slate-900 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer";

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Approve Users</h1>
                <p className="mt-2 text-sm md:text-base text-slate-600 font-medium">
                    Review and approve pending user registrations for Ngoma District Imihigo Tracking Tool.
                </p>
            </header>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-amber-100 text-sm font-bold uppercase tracking-wider">Pending Approvals</p>
                        <p className="text-4xl font-black mt-1">{pendingUsers.length}</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-slate-500 font-medium">Loading pending users...</p>
                </div>
            ) : pendingUsers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">All Caught Up!</h3>
                    <p className="text-slate-500 mt-2">No pending user registrations to review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingUsers.map(user => (
                        <div key={user._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                    {/* User Info */}
                                    <div className="flex items-start space-x-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                                            <p className="text-slate-500 text-sm">{user.email}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                                                    {user.role}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                                    Registered: {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col space-y-3 lg:min-w-[320px]">
                                        {/* Unit Selection */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                Assign to Unit *
                                            </label>
                                            <select
                                                value={selectedUnit[user._id] || ''}
                                                onChange={(e) => setSelectedUnit(prev => ({ ...prev, [user._id]: e.target.value }))}
                                                className={inputClasses}
                                            >
                                                <option value="">-- Select Unit --</option>
                                                {UNITS.map(unit => (
                                                    <option key={unit} value={unit}>Director of {unit}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* User Type Selection */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                Role Type *
                                            </label>
                                            <select
                                                value={selectedUserType[user._id] || ''}
                                                onChange={(e) => setSelectedUserType(prev => ({ ...prev, [user._id]: e.target.value }))}
                                                className={inputClasses}
                                            >
                                                <option value="">-- Select Role --</option>
                                                <option value="head">Head of Unit</option>
                                                <option value="employee">Employee</option>
                                            </select>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-2 pt-2">
                                            <button
                                                onClick={() => handleApprove(user._id)}
                                                disabled={processingUser === user._id}
                                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                            >
                                                {processingUser === user._id ? (
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span>Approve</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleReject(user._id)}
                                                disabled={processingUser === user._id}
                                                className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApproveUsersView;
