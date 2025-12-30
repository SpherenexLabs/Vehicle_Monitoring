import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { ref, update } from 'firebase/database';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Check for hardcoded admin credentials
        if (email === 'admin@gmail.com' && password === 'admin@1234') {
            navigate('/admin');
            return;
        }

        // Firebase authentication for regular users
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save timeIn to Firebase
            const userRef = ref(db, `users/${user.uid}`);
            await update(userRef, {
                timeIn: new Date().toISOString(),
                timeOut: null // Clear previous timeOut
            });

            navigate('/user');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: '48px', width: '100%', maxWidth: 450, border: '1px solid rgba(255,255,255,0.3)' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1a2a36', marginBottom: '1rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    🚗 <span style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Login</span>
                </h2>
                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.95rem', marginBottom: '2rem' }}>Welcome back! Please login to continue</p>

                {error && (
                    <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#dc2626', padding: '14px 16px', borderRadius: 12, marginBottom: 24, fontSize: '0.9rem', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>📧 Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '2px solid #e5e7eb',
                                borderRadius: 12,
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s',
                                background: '#f9fafb',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.border = '2px solid #667eea';
                                e.target.style.background = '#fff';
                                e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.border = '2px solid #e5e7eb';
                                e.target.style.background = '#f9fafb';
                                e.target.style.boxShadow = 'none';
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>🔒 Password</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    paddingRight: '50px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 12,
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    background: '#f9fafb',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.border = '2px solid #667eea';
                                    e.target.style.background = '#fff';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.border = '2px solid #e5e7eb';
                                    e.target.style.background = '#f9fafb';
                                    e.target.style.boxShadow = 'none';
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.3rem',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginBottom: 20,
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                        }}
                    >
                        Login
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                console.log('Navigating to signup page...');
                                navigate('/signup');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#667eea',
                                cursor: 'pointer',
                                fontWeight: 600,
                                textDecoration: 'underline',
                                transition: 'all 0.2s',
                                fontSize: '0.95rem',
                                padding: 0
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#764ba2'}
                            onMouseLeave={(e) => e.target.style.color = '#667eea'}
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;