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
            await set(ref(db, 'users/' + user.uid), {
                email: user.email,
                uid: user.uid,
                createdAt: new Date().toISOString()
            });

            navigate('/user');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', padding: '40px', width: '100%', maxWidth: 400 }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a2a36', marginBottom: '2rem', textAlign: 'center' }}>🚗 Sign Up</h2>

                {error && (
                    <div style={{ background: '#fee', color: '#c33', padding: '12px', borderRadius: 8, marginBottom: 20, fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '1rem', outline: 'none' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{ width: '93%', padding: '12px', paddingRight: '40px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '1rem', outline: 'none' }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '1rem', outline: 'none' }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
                    >
                        Sign Up
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                    <span
                        onClick={() => navigate('/login')}
                        style={{ color: '#667eea', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Login
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Signup;
