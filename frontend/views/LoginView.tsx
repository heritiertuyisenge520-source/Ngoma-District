import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface UserInfo {
    email: string;
    name: string;
    role: string;
    isApproved?: boolean;
    userType?: 'super_admin' | 'leader' | 'head' | 'employee';
    unit?: string;
}

interface IndicatorAssignment {
    _id: string;
    indicatorId: string;
    indicatorName: string;
    pillarId: string;
    pillarName: string;
}

interface LoginViewProps {
    onLogin: (user: UserInfo, assignedIndicators?: IndicatorAssignment[]) => void;
}

type ViewMode = 'login' | 'register' | 'reset';

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('login');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [position, setPosition] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetPosition, setResetPosition] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [userVerified, setUserVerified] = useState(false);
    const [verifiedUserName, setVerifiedUserName] = useState('');

    // Welcome modal state
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [welcomeUserData, setWelcomeUserData] = useState<{
        name: string;
        role: string;
        userType: string;
    } | null>(null);

    const positions = [
        'Mayor',
        'Vice-Mayor in charge of Economic Development',
        'Vice-Mayor in charge of Social Affairs',
        'Executive Secretary of District',
        'Corporates Services Division Manager',
        'Director of Finance',
        'Investment Promotion and Financial Services Officer',
        'Director of Public Health',
        'Nursery, Primary Education and adult literacy Officer',
        'SMEs & Cooperatives Development Officer',
        'Director of Social Development',
        'Construction Permitting Officer',
        'Director of Good Governance',
        'Director of Planning, Monitoring and Evaluation',
        'District Infrastructure Property Management Officer',
        'Start-Up Development Officer',
        'One Stop Centre Lawyer',
        'Director of OSC and Land Notary',
        'Road Development and Maintenance Engineer',
        'Director of Agriculture and Natural Resources',
        'Social Protection Officer',
        'Logistics Officer',
        'Gender and Family Promotion Officer',
        'Land Administrator',
        'School Construction Engineer',
        'Director of Human Resources and Administration',
        'Director of Business Development and Employment',
        'Environmental Officer',
        'Forestry and Natural Resources Officer',
        'Territorial Administration and Decentralized Governance Officer',
        'Network and System Administrator',
        'Building Inspector',
        'Local Revenue Inspector',
        'Human Resources and Salaries Officer',
        'Planning, M&E Officer',
        'Itorero Coordination Program and Community Mobilisation Officer',
        'Employment Promotion Officer',
        'IT/MIS Officer',
        'Agriculture Officer',
        'Local Revenue Accountant',
        'Budget Officer',
        'Water and Sanitation Officer',
        'JADF Officer',
        'Statistician',
        'Youth, Sports and Culture Officer',
        'Animal Resources Officer',
        'Accountant',
        'Electricity Maintenance Engineer',
        'Director of Education',
        'Land Valuation Officer',
        'Hygiene and Sanitation Officer',
        'Health Promotion and Disease Prevention Officer',
        'Land Surveyor and GIS Officer',
        'Cash Crops Officer',
        'Disaster Management Officer',
        'Secondary and TVET Education Officer',
        'Community Base Health Insurance Officer',
        'Imihigo Coach',
        'Legal Advisor and Notary',
        'ECD officer'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (viewMode === 'login') {
            if (!email || !password) {
                alert("Please enter your email and password to login");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(API_ENDPOINTS.LOGIN, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    const userData = responseData.user || responseData;
                    const userName = userData.name || 'User';

                    // Store the authentication token
                    if (responseData.token) {
                        localStorage.setItem('authToken', responseData.token);
                    }

                    // Show welcome modal with animation
                    setWelcomeUserData({
                        name: userName,
                        role: userData.role,
                        userType: userData.userType
                    });
                    setShowWelcomeModal(true);

                    // Auto-dismiss and login after 2 seconds
                    setTimeout(() => {
                        setShowWelcomeModal(false);
                        onLogin({
                            email: userData.email,
                            name: userName,
                            role: userData.role,
                            isApproved: userData.isApproved,
                            userType: userData.userType,
                            unit: userData.unit
                        }, responseData.assignedIndicators);
                    }, 2500);
                } else {
                    const err = await response.json();
                    alert(err.message || "Invalid credentials. Please try again or register.");
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Error connecting to server. Please ensure the backend is running.");
            }
        } else if (viewMode === 'register') {
            if (!email || !firstName || !lastName || !position || !password || !confirmPassword) {
                alert("Please fill all fields to register");
                setIsLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                setIsLoading(false);
                return;
            }

            if (password.length < 8) {
                alert("Password must be at least 8 characters long");
                setIsLoading(false);
                return;
            }

            const fullName = `${firstName} ${lastName}`;

            try {
                const response = await fetch(API_ENDPOINTS.REGISTER, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        name: fullName,
                        firstName,
                        lastName,
                        role: position,
                        password
                    }),
                });

                const responseData = await response.json();

                if (response.ok) {
                    // Check if this is a pending registration
                    if (responseData.pending) {
                        alert(responseData.message);
                        // Clear form and switch to login
                        setEmail('');
                        setFirstName('');
                        setLastName('');
                        setPosition('');
                                        setPassword('');
                        setConfirmPassword('');
                        setViewMode('login');
                    } else {
                        // Super admin or auto-approved user
                        alert(`Registration successful! Welcome, ${fullName}!`);
                        onLogin({
                            email: responseData.user.email,
                            name: responseData.user.name,
                            role: responseData.user.role,
                            isApproved: responseData.user.isApproved,
                            unit: responseData.user.unit
                        });
                    }
                } else {
                    alert(responseData.message || "Registration failed. Please try again.");
                }
            } catch (error) {
                console.error("Registration error:", error);
                alert("Error connecting to server. Please ensure the backend is running.");
            }
        }
        setIsLoading(false);
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResetSuccess(false);

        if (!email || !resetPosition || !newPassword || !confirmNewPassword) {
            alert("Please fill all fields");
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert("Passwords do not match!");
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters long");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    role: resetPosition,
                    newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResetSuccess(true);
                alert(data.message);
                // Clear fields and go back to login
                setEmail('');
                setNewPassword('');
                setConfirmNewPassword('');
                setResetPosition('');
                setTimeout(() => {
                    setViewMode('login');
                    setResetSuccess(false);
                }, 2000);
            } else {
                alert(data.message || "Password reset failed. Please check your details.");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            alert("Error connecting to server. Please ensure the backend is running.");
        }
        setIsLoading(false);
    };

    const clearForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setPosition('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetPosition('');
        setResetSuccess(false);
    };

    const switchMode = (mode: ViewMode) => {
        clearForm();
        setViewMode(mode);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#0f172a] to-[#1a1f35] flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
            {/* Welcome Modal */}
            {showWelcomeModal && welcomeUserData && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4 text-center animate-in zoom-in duration-500 border border-white/10">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 animate-bounce">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">
                            Welcome back!
                        </h2>
                        <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4">
                            {welcomeUserData.name}
                        </p>
                        <p className="text-slate-400 font-medium mb-6">
                            {welcomeUserData.role}
                        </p>
                        <div className="flex justify-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-slate-500 text-sm mt-4">Redirecting to dashboard...</p>
                    </div>
                </div>
            )}

            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>

                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
            </div>

            <div className={`w-full ${viewMode === 'login' ? 'max-w-md' : 'max-w-lg'} relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700`}>
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/30 ring-4 ring-white/10 mb-6 transform hover:scale-105 transition-transform duration-300">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white tracking-tight mb-2">
                        NGOMA DISTRICT
                    </h1>
                    <p className="text-blue-400 font-bold text-sm tracking-wider uppercase">
                        Imihigo Tracking Tool
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
                    {/* Header Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === 'login'
                                ? 'text-white bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b-2 border-blue-500'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('register')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === 'register'
                                ? 'text-white bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-b-2 border-blue-500'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Register
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('reset')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === 'reset'
                                ? 'text-white bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b-2 border-amber-500'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Reset
                        </button>
                    </div>

                    <div className="p-8">
                        {/* Password Reset Mode */}
                        {viewMode === 'reset' ? (
                            <form onSubmit={handlePasswordReset} className="space-y-5">
                                {resetSuccess && (
                                    <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Password reset successful!
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">Reset Password</h2>
                                    <p className="text-slate-400 text-sm">Enter your email and role to reset</p>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Your Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@ngoma.gov.rw"
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium hover:border-white/20"
                                        required
                                    />
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Your Position/Role
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={resetPosition}
                                            onChange={(e) => setResetPosition(e.target.value)}
                                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white appearance-none focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium cursor-pointer hover:border-white/20"
                                            required
                                        >
                                            <option value="" className="bg-[#1e293b] text-slate-400">-- Select your position --</option>
                                            {positions.map(pos => (
                                                <option key={pos} value={pos} className="bg-[#1e293b] text-white py-2">{pos}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* New Password Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min. 8 characters)"
                                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium hover:border-white/20"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Confirm New Password
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            placeholder="Re-enter new password"
                                            className={`w-full h-14 bg-white/5 border rounded-xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 transition-all font-medium hover:border-white/20 ${confirmNewPassword && newPassword !== confirmNewPassword
                                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10'
                                                : confirmNewPassword && newPassword === confirmNewPassword
                                                    ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/10'
                                                    : 'border-white/10 focus:border-amber-500 focus:ring-amber-500/10'
                                                }`}
                                            required
                                        />
                                        {confirmNewPassword && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                {newPassword === confirmNewPassword ? (
                                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                                        <p className="text-red-400 text-xs ml-1">Passwords do not match</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-lg rounded-xl shadow-xl shadow-amber-600/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group overflow-hidden relative disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <>
                                                <span>Reset Password</span>
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* Login / Register Mode */
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Work Email
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@ngoma.gov.rw"
                                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium hover:border-white/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Registration Fields */}
                                {viewMode === 'register' && (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-5">
                                        {/* Name Fields Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="John"
                                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium hover:border-white/20"
                                                    required={viewMode === 'register'}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="Doe"
                                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium hover:border-white/20"
                                                    required={viewMode === 'register'}
                                                />
                                            </div>
                                        </div>

                                        {/* Position Selection */}
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Select Your Position
                                            </label>
                                            <div className="relative group">
                                                <select
                                                    value={position}
                                                    onChange={(e) => setPosition(e.target.value)}
                                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium cursor-pointer hover:border-white/20"
                                                    required={viewMode === 'register'}
                                                >
                                                    <option value="" className="bg-[#1e293b] text-slate-400">-- Select your position --</option>
                                                    {positions.map(pos => (
                                                        <option key={pos} value={pos} className="bg-[#1e293b] text-white py-2">{pos}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={viewMode === 'login' ? "Enter your password" : "Create a strong password (min. 8 characters)"}
                                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium hover:border-white/20"
                                            autoComplete={viewMode === 'login' ? "current-password" : "new-password"}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password (Registration only) */}
                                {viewMode === 'register' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Confirm Password
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter your password"
                                                className={`w-full h-14 bg-white/5 border rounded-xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 transition-all font-medium hover:border-white/20 ${confirmPassword && password !== confirmPassword
                                                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10'
                                                    : confirmPassword && password === confirmPassword
                                                        ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/10'
                                                        : 'border-white/10 focus:border-blue-500 focus:ring-blue-500/10'
                                                    }`}
                                                autoComplete={viewMode === 'login' ? "current-password" : "new-password"}
                                                required={viewMode === 'register'}
                                            />
                                            {confirmPassword && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {password === confirmPassword ? (
                                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-red-400 text-xs ml-1">Passwords do not match</p>
                                        )}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group overflow-hidden relative disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <>
                                                <span>{viewMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-8 flex items-center justify-center space-x-3 text-slate-500">
                    <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Secure Connection</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-slate-600 text-xs">
                        © 2026 Ngoma District. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
