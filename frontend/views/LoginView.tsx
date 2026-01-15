import React, { useState } from 'react';

interface LoginViewProps {
    onLogin: (user: { email: string; name: string; role: string }) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');

    const roles = [
        'Assign employee',
        'Planning director',
        'Unity director'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoginMode) {
            if (!email) {
                alert("Please enter your email to login");
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                if (response.ok) {
                    const userData = await response.json();
                    alert(`Welcome back, ${userData.name}!`);
                    onLogin({ email: userData.email, name: userData.name, role: userData.role });
                } else {
                    const err = await response.json();
                    alert(err.message || "Email not found. Please register first.");
                    setIsLoginMode(false); // Switch to register automatically
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Error connecting to server. Please ensure the backend is running.");
            }
        } else {
            // Register Mode
            if (!email || !name || !role) {
                alert("Please fill all fields to register");
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, name, role }),
                });

                if (response.ok) {
                    alert(`Registration successful! You are registered as ${role}`);
                    onLogin({ email, name, role });
                } else {
                    alert("Registration failed. Please try again.");
                }
            } catch (error) {
                console.error("Registration error:", error);
                alert("Error connecting to server. Please ensure the backend is running.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="p-8 md:p-10">
                        <header className="text-center mb-10">
                            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-blue-500/20 ring-4 ring-white/5">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tight mb-2">NGOMA DISTRICT IMIHIGO TRACKING TOOL</h1>
                            <p className="text-slate-400 text-sm font-medium">
                                {isLoginMode ? 'Sign in with your Email' : 'Create a new account'}
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@organization.gov.rw"
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {!isLoginMode && (
                                <>
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Names</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter your Names"
                                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                                required={!isLoginMode}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                                        <div className="relative group">
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium cursor-pointer"
                                                required={!isLoginMode}
                                            >
                                                <option value="" className="bg-[#1e293b]">-- Select your Role --</option>
                                                {roles.map(r => (
                                                    <option key={r} value={r} className="bg-[#1e293b]">{r}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group overflow-hidden relative"
                                >
                                    <span className="relative z-10">{isLoginMode ? 'Sign In' : 'Register Now'}</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </button>
                            </div>

                            <div className="text-center mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsLoginMode(!isLoginMode)}
                                    className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {isLoginMode ? "Don't have an account? Register" : "Already have an account? Login"}
                                </button>
                            </div>
                        </form>

                        <footer className="mt-10 text-center">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                Trusted Management System v1.2.0
                            </p>
                        </footer>
                    </div>
                </div>

                {/* Simple security notice */}
                <div className="mt-8 flex items-center justify-center space-x-2 text-slate-500 animate-pulse">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Your session is secure</span>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
