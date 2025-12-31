import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../../firebase';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user data to database
            await set(ref(db, '<Engine_Health />users/' + user.uid), {
                email: user.email,
                uid: user.uid,
                createdAt: new Date().toISOString()
            });

            navigate('<Engine_Health />users/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', padding: 'clamp(24px, 5vw, 48px)', width: '100%', maxWidth: 450, border: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                        Create Account
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 'clamp(0.875rem, 2vw, 0.95rem)' }}>Join VehicleTrack to monitor your vehicle</p>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#991b1b', padding: '14px 16px', borderRadius: 12, marginBottom: 24, fontSize: '0.9rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>!</div>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#475569', fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            style={{ width: '100%', padding: window.innerWidth < 768 ? '12px 14px' : '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a', transition: 'all 0.3s' }}
                            onFocus={(e) => {
                                e.target.style.border = '1px solid #3b82f6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.border = '1px solid #e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#475569', fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{ width: '100%', padding: window.innerWidth < 768 ? '12px 14px' : '14px 16px', paddingRight: '50px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a', transition: 'all 0.3s' }}
                                onFocus={(e) => {
                                    e.target.style.border = '1px solid #3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.border = '1px solid #e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#64748b', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {showPassword ? (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </>
                                    ) : (
                                        <>
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#475569', fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            style={{ width: '100%', padding: window.innerWidth < 768 ? '12px 14px' : '14px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a', transition: 'all 0.3s' }}
                            onFocus={(e) => {
                                e.target.style.border = '1px solid #3b82f6';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.border = '1px solid #e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{ width: '100%', padding: window.innerWidth < 768 ? '12px' : '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10, fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.3s' }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#2563eb';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#3b82f6';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                    >
                        Create Account
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s', fontSize: '0.875rem', padding: 0 }}
                            onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                        >
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
