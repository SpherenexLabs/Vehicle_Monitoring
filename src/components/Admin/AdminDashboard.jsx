import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState({});
    const [engineHealth, setEngineHealth] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        // Fetch all users
        const usersRef = ref(db, 'users');
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            setUsers(data || {});
        });

        // Fetch engine health data
        const engineRef = ref(db, 'Engine_Health');
        const unsubscribeEngine = onValue(engineRef, (snapshot) => {
            setEngineHealth(snapshot.val());
        });

        return () => {
            unsubscribeUsers();
            unsubscribeEngine();
        };
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.clear();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Failed to logout. Please try again.');
        }
    };

    const filteredUsers = Object.entries(users).filter(([uid, userData]) => {
        if (!userData?.vehicleDetails) return false;
        const details = userData.vehicleDetails;
        const search = searchTerm.toLowerCase();
        return (
            details.carName?.toLowerCase().includes(search) ||
            details.carNumber?.toLowerCase().includes(search) ||
            details.userName?.toLowerCase().includes(search) ||
            details.phoneNumber?.toLowerCase().includes(search) ||
            details.userEmail?.toLowerCase().includes(search)
        );
    });

    const totalUsersWithVehicles = Object.values(users).filter(userData => userData?.vehicleDetails).length;

    return (
        <div style={{ width: '100%', padding: '2rem', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>👨‍💼 Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        color: '#fff',
                        padding: '12px 28px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(102,126,234,0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(102,126,234,0.3)';
                    }}
                >
                    🚪 Logout
                </button>
            </div>

            {/* Search & Users Section */}
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#667eea', margin: 0 }}>🔍 Users & Vehicles</h3>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#764ba2' }}>
                        Total Users: {totalUsersWithVehicles}
                    </div>
                </div>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search by car name, car number, user name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '14px 18px',
                        border: '2px solid #e5e7eb',
                        borderRadius: 12,
                        fontSize: '1rem',
                        marginBottom: '24px',
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
                />

                {/* Users Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(([uid, userData]) => {
                            const details = userData.vehicleDetails;
                            const serviceHistory = userData.serviceHistory || [];
                            return (
                                <div
                                    key={uid}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                                        border: selectedUser === uid ? '2px solid #667eea' : '2px solid #e5e7eb',
                                        borderRadius: 16,
                                        padding: '20px',
                                        transition: 'all 0.3s',
                                        boxShadow: selectedUser === uid ? '0 4px 20px rgba(102, 126, 234, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = selectedUser === uid ? '0 4px 20px rgba(102, 126, 234, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a2a36', margin: 0, marginBottom: '4px' }}>
                                                🚗 {details.carName || 'N/A'}
                                            </h4>
                                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#667eea' }}>
                                                {details.carNumber || 'No number'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>👤 User Name</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#374151' }}>{details.userName || 'N/A'}</div>
                                        </div>
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>📧 Email</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151', wordBreak: 'break-all' }}>{details.userEmail || 'N/A'}</div>
                                        </div>
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>📱 Phone</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#374151' }}>{details.phoneNumber || 'N/A'}</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>🟢 Time In</div>
                                                {userData.timeIn ? (
                                                    <>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
                                                            {new Date(userData.timeIn).toLocaleDateString()}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                                            {new Date(userData.timeIn).toLocaleTimeString()}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af' }}>
                                                        Not available
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>🔴 Time Out</div>
                                                {userData.timeOut ? (
                                                    <>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>
                                                            {new Date(userData.timeOut).toLocaleDateString()}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                                            {new Date(userData.timeOut).toLocaleTimeString()}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                                                        Still Active
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedUser(selectedUser === uid ? null : uid);
                                            }}
                                            style={{
                                                width: '100%',
                                                marginTop: '12px',
                                                padding: '12px',
                                                background: selectedUser === uid
                                                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 10,
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                                                transition: 'all 0.3s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                                            }}
                                        >
                                            {selectedUser === uid ? '🔼 Hide Details' : '🔍 View Details'}
                                        </button>
                                    </div>

                                    {selectedUser === uid && (
                                        <div>
                                            {/* Engine Health Status for Selected User */}
                                            {engineHealth && (
                                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#667eea', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        🚗 Live Engine Health Status
                                                    </h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                                        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>{engineHealth.Fuel || 0}%</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>⛽ Fuel</div>
                                                        </div>
                                                        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>{engineHealth.Oil || 0}%</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>🛢️ Oil</div>
                                                        </div>
                                                        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>{engineHealth.Temp || 0}°C</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>🌡️ Temp</div>
                                                        </div>
                                                        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>{engineHealth.Volt || 0}V</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>🔋 Voltage</div>
                                                        </div>
                                                        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>{engineHealth.Humidity || 0}%</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>💧 Humidity</div>
                                                        </div>
                                                        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#667eea' }}>{engineHealth.Water || 0}%</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>💦 Water</div>
                                                        </div>
                                                    </div>
                                                    {engineHealth.MPU && (
                                                        <div style={{ marginTop: '12px' }}>
                                                            <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>📊 Vibration (MPU)</h5>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                                                <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#667eea' }}>{engineHealth.MPU.X || 0}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>X-Axis</div>
                                                                </div>
                                                                <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#764ba2' }}>{engineHealth.MPU.Y || 0}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>Y-Axis</div>
                                                                </div>
                                                                <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                                                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#9333ea' }}>{engineHealth.MPU.Z || 0}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>Z-Axis</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Service History Section */}
                                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#667eea', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    🔧 Service History
                                                </h4>
                                                {serviceHistory.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {serviceHistory.map((service, index) => (
                                                            <div
                                                                key={index}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                                                                    border: '1px solid rgba(102, 126, 234, 0.2)',
                                                                    borderRadius: 10,
                                                                    padding: '14px'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
                                                                        {service.type || 'Service'}
                                                                    </div>
                                                                    <div style={{
                                                                        background: service.status === 'completed'
                                                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                                            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                        color: '#fff',
                                                                        padding: '4px 10px',
                                                                        borderRadius: 12,
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 600
                                                                    }}>
                                                                        {service.status === 'completed' ? 'COMPLETED' : 'PENDING'}
                                                                    </div>
                                                                </div>
                                                                {service.description && (
                                                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>
                                                                        {service.description}
                                                                    </div>
                                                                )}
                                                                {service.date && (
                                                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span>📅</span>
                                                                        {new Date(service.date).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                                {service.cost && (
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#667eea', marginTop: '6px' }}>
                                                                        💰 ₹{service.cost}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        textAlign: 'center',
                                                        padding: '24px',
                                                        background: '#f9fafb',
                                                        borderRadius: 10,
                                                        color: '#6b7280'
                                                    }}>
                                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔧</div>
                                                        <div style={{ fontSize: '0.9rem' }}>No service history available</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '8px' }}>📝 User ID</div>
                                                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', background: '#f3f4f6', padding: '8px', borderRadius: 8, wordBreak: 'break-all', color: '#374151' }}>
                                                    {uid}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                {searchTerm ? 'No users found matching your search' : 'No users registered yet'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
