import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { ref, onValue, get } from 'firebase/database';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        // Fetch all users and their vehicle details
        const usersRef = ref(db, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const usersList = Object.keys(usersData).map(uid => ({
                    uid,
                    email: usersData[uid].email || 'N/A',
                    vehicleDetails: usersData[uid].vehicleDetails || {},
                    timeIn: usersData[uid].timeIn || null,
                    timeOut: usersData[uid].timeOut || null
                }));
                setAllUsers(usersList);
                setFilteredUsers(usersList);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setFilteredUsers(allUsers);
            setSelectedUser(null);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = allUsers.filter(user => {
            const carName = (user.vehicleDetails?.carName || '').toLowerCase();
            const carNumber = (user.vehicleDetails?.carNumber || '').toLowerCase();
            const userName = (user.vehicleDetails?.userName || '').toLowerCase();
            const email = (user.email || '').toLowerCase();

            return carName.includes(query) ||
                carNumber.includes(query) ||
                userName.includes(query) ||
                email.includes(query);
        });

        setFilteredUsers(filtered);
        if (filtered.length === 1) {
            setSelectedUser(filtered[0]);
        } else {
            setSelectedUser(null);
        }
    };

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

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: window.innerWidth < 768 ? '1rem' : '2rem'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                gap: window.innerWidth < 768 ? '1rem' : '0',
                marginBottom: '2rem'
            }}>
                <h1 style={{
                    fontSize: window.innerWidth < 480 ? '1.75rem' : window.innerWidth < 768 ? '2rem' : '2.5rem',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}>
                    Admin Dashboard
                </h1>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        padding: window.innerWidth < 768 ? '10px 20px' : '12px 28px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* Search Section */}
            <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 20,
                padding: window.innerWidth < 768 ? '20px' : '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                marginBottom: '2rem'
            }}>
                <h2 style={{
                    fontSize: window.innerWidth < 768 ? '1.25rem' : '1.5rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    Search Vehicle / User
                </h2>

                <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                    gap: '12px',
                    marginBottom: '24px',
                    alignItems: window.innerWidth < 768 ? 'stretch' : 'center'
                }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by car name, car number, user name, or email..."
                        style={{
                            flex: 1,
                            padding: '16px 20px',
                            borderRadius: 12,
                            border: '2px solid #e5e7eb',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border 0.3s'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: '#fff',
                            padding: window.innerWidth < 768 ? '12px 24px' : '16px 32px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                            boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                            transition: 'all 0.3s'
                        }}
                    >
                        Search
                    </button>
                </div>

                {/* Results Count */}
                <div style={{
                    fontSize: '0.95rem',
                    color: '#6b7280',
                    textAlign: 'center',
                    marginBottom: '20px'
                }}>
                    Found {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Selected User Details */}
            {selectedUser && (
                <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 20,
                    padding: window.innerWidth < 768 ? '20px' : '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '24px',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '12px'
                    }}>
                        <button
                            onClick={() => setSelectedUser(null)}
                            style={{
                                padding: '10px 20px',
                                background: '#fff',
                                border: '2px solid #e5e7eb',
                                borderRadius: 8,
                                color: '#374151',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                                e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#1f2937',
                            margin: 0,
                            flex: 1,
                            textAlign: 'center'
                        }}>
                            User & Vehicle Details
                        </h3>
                        <div style={{ width: '90px' }}></div>
                    </div>

                    {/* User Information */}
                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                            fontSize: window.innerWidth < 768 ? '1rem' : '1.2rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            User Information
                        </h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
                            gap: '16px'
                        }}>
                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                borderRadius: 12,
                                border: '1px solid #bae6fd'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280',
                                    marginBottom: '6px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    User Name
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#0c4a6e'
                                }}>
                                    {selectedUser.vehicleDetails?.userName || 'Not Set'}
                                </div>
                            </div>

                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                borderRadius: 12,
                                border: '1px solid #bbf7d0'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280',
                                    marginBottom: '6px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Email
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#14532d'
                                }}>
                                    {selectedUser.email}
                                </div>
                            </div>

                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                borderRadius: 12,
                                border: '1px solid #fcd34d'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280',
                                    marginBottom: '6px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Phone Number
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#78350f'
                                }}>
                                    {selectedUser.vehicleDetails?.phoneNumber || 'Not Set'}
                                </div>
                            </div>

                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                                borderRadius: 12,
                                border: '1px solid #f9a8d4'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280',
                                    marginBottom: '6px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    User ID
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#831843',
                                    wordBreak: 'break-all'
                                }}>
                                    {selectedUser.uid}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div>
                        <h4 style={{
                            fontSize: window.innerWidth < 768 ? '1rem' : '1.2rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Vehicle Information
                        </h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
                            gap: '16px'
                        }}>
                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                                borderRadius: 12,
                                border: '1px solid #c4b5fd'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280',
                                    marginBottom: '6px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Car Name
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#5b21b6'
                                }}>
                                    {selectedUser.vehicleDetails?.carName || 'Not Set'}
                                </div>
                            </div>

                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                borderRadius: 12,
                                border: '1px solid #fca5a5'
                            }}>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#6b7280',
                                    marginBottom: '6px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Car Number
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: '#991b1b'
                                }}>
                                    {selectedUser.vehicleDetails?.carNumber || 'Not Set'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Information */}
                    {(selectedUser.timeIn || selectedUser.timeOut) && (
                        <div style={{ marginTop: '32px' }}>
                            <h4 style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '16px'
                            }}>
                                Activity Log
                            </h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '16px'
                            }}>
                                {selectedUser.timeIn && (
                                    <div style={{
                                        padding: '20px',
                                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                        borderRadius: 12,
                                        border: '1px solid #7dd3fc'
                                    }}>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#6b7280',
                                            marginBottom: '6px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Last Login
                                        </div>
                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            color: '#075985'
                                        }}>
                                            {new Date(selectedUser.timeIn).toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                {selectedUser.timeOut && (
                                    <div style={{
                                        padding: '20px',
                                        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                                        borderRadius: 12,
                                        border: '1px solid #d8b4fe'
                                    }}>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: '#6b7280',
                                            marginBottom: '6px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Last Logout
                                        </div>
                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            color: '#6b21a8'
                                        }}>
                                            {new Date(selectedUser.timeOut).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* All Users List */}
            {!selectedUser && filteredUsers.length > 0 && (
                <div style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 20,
                    padding: window.innerWidth < 768 ? '20px' : '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                }}>
                    <h3 style={{
                        fontSize: window.innerWidth < 768 ? '1.25rem' : '1.5rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        marginBottom: '24px',
                        textAlign: 'center'
                    }}>
                        All Users
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 480 ? '1fr' : window.innerWidth < 768 ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {filteredUsers.map(user => (
                            <div
                                key={user.uid}
                                onClick={() => setSelectedUser(user)}
                                style={{
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                                    borderRadius: 12,
                                    border: '2px solid #e5e7eb',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.3)';
                                    e.currentTarget.style.borderColor = '#667eea';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#9ca3af',
                                    marginBottom: '8px',
                                    wordBreak: 'break-all',
                                    fontWeight: 500
                                }}>
                                    {user.email}
                                </div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    color: '#1f2937',
                                    marginBottom: '8px'
                                }}>
                                    {user.vehicleDetails?.carName || 'No Car Name'}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: '#6b7280',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{ fontWeight: 600 }}>Number:</span> {user.vehicleDetails?.carNumber || 'N/A'}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: '#6b7280',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{ fontWeight: 600 }}>User:</span> {user.vehicleDetails?.userName || 'N/A'}
                                </div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: '#9ca3af',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{ fontWeight: 600 }}>Phone:</span> {user.vehicleDetails?.phoneNumber || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
