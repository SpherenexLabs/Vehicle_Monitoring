import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import './UserDashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [engineHealth, setEngineHealth] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [vehicleDetails, setVehicleDetails] = useState({
        carName: '',
        userName: '',
        phoneNumber: '',
        carNumber: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Dashboard');
    const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
    const [diagnosticResults, setDiagnosticResults] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', notes: '' });

    useEffect(() => {
        const engineHealthRef = ref(db, 'Engine_Health');
        const unsubscribe = onValue(engineHealthRef, (snapshot) => {
            const data = snapshot.val();
            setEngineHealth(data);

            // Update chart data
            if (data) {
                setChartData(prev => {
                    const newData = [...prev, {
                        time: new Date().toLocaleTimeString(),
                        fuel: data.Fuel || 0,
                        oil: data.Oil || 0,
                        temp: data.Temp || 0,
                        volt: data.Volt || 0,
                        humidity: data.Humidity || 0,
                        water: data.Water || 0,
                        vibrationX: data.MPU?.X || 0,
                        vibrationY: data.MPU?.Y || 0,
                        vibrationZ: data.MPU?.Z || 0
                    }];
                    // Keep last 20 data points
                    const updatedData = newData.slice(-20);
                    console.log('Chart Data Updated:', updatedData.length, 'points');
                    console.log('Latest values:', {
                        fuel: data.Fuel,
                        oil: data.Oil,
                        temp: data.Temp,
                        volt: data.Volt,
                        humidity: data.Humidity,
                        water: data.Water
                    });
                    return updatedData;
                });

                // Generate alerts and suggestions
                const newAlerts = [];
                const newSuggestions = [];

                // Fuel alerts
                if (data.Fuel < 20) {
                    newAlerts.push(`Critical: Low Fuel Level ${data.Fuel}% - Refuel Immediately!`);
                } else if (data.Fuel > 95) {
                    newAlerts.push(`Warning: Fuel Tank Nearly Full ${data.Fuel}%`);
                }

                // Oil alerts
                if (data.Oil < 30) {
                    newAlerts.push(`Critical: Low Oil Level ${data.Oil}% - Check Immediately!`);
                } else if (data.Oil > 95) {
                    newAlerts.push(`Warning: Oil Level Too High ${data.Oil}%`);
                }

                // Temperature alerts
                if (data.Temp > 90) {
                    newAlerts.push(`DANGER: Engine Overheating ${data.Temp}°C - Stop Vehicle!`);
                } else if (data.Temp < 0) {
                    newAlerts.push(`Warning: Engine Very Cold ${data.Temp}°C`);
                }

                // Voltage alerts
                if (data.Volt < 12) {
                    newAlerts.push(`Critical: Low Battery Voltage ${data.Volt}V`);
                } else if (data.Volt > 14.5) {
                    newAlerts.push(`Warning: High Voltage ${data.Volt}V - Charging Issue`);
                }

                // Vibration alerts
                if (data.MPU) {
                    const vibX = Math.abs(data.MPU.X || 0);
                    const vibY = Math.abs(data.MPU.Y || 0);
                    const vibZ = Math.abs(data.MPU.Z || 0);
                    if (vibX > 50 || vibY > 50 || vibZ > 50) {
                        newAlerts.push(`High Vibration Detected - Check Vehicle Balance!`);
                    }
                }

                setAlerts(newAlerts);

                // Add suggestions
                if (newAlerts.length === 0) {
                    setSuggestions(['All systems operating normally', 'Schedule maintenance every 10,000 km', 'Drive smoothly for best efficiency']);
                } else {
                    setSuggestions(['Address critical alerts immediately', 'Contact service center if issues persist', 'Regular monitoring recommended']);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // Load vehicle details from Firebase
    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const vehicleDetailsRef = ref(db, `users/${user.uid}/vehicleDetails`);
            onValue(vehicleDetailsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setVehicleDetails(data);
                }
            });
        }
    }, []);

    const handleInputChange = (e) => {
        setVehicleDetails({ ...vehicleDetails, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const vehicleDetailsRef = ref(db, `users/${user.uid}/vehicleDetails`);
                const dataToSave = {
                    ...vehicleDetails,
                    userEmail: user.email,
                    lastUpdated: new Date().toISOString()
                };
                await set(vehicleDetailsRef, dataToSave);
                console.log('Vehicle details saved successfully!');
                setIsEditing(false);
            } catch (error) {
                console.error('Error saving vehicle details:', error);
                alert('Failed to save vehicle details. Please try again.');
            }
        } else {
            alert('Please login to save vehicle details.');
        }
    };

    const handleEditClick = () => {
        if (isEditing) {
            handleSave();
        } else {
            setIsEditing(true);
        }
    };

    const handleLogout = async () => {
        try {
            console.log('Attempting to logout...');
            const user = auth.currentUser;
            console.log('Current user:', user);

            // Save logout time to Firebase before signing out
            if (user) {
                try {
                    const userRef = ref(db, `users/${user.uid}`);
                    await update(userRef, {
                        timeOut: new Date().toISOString()
                    });
                    console.log('TimeOut saved successfully');
                } catch (updateError) {
                    console.error('Error saving timeOut:', updateError);
                    // Continue with logout even if update fails
                }
            }

            console.log('Signing out...');
            await signOut(auth);
            console.log('Sign out successful');

            console.log('Clearing localStorage...');
            localStorage.clear();
            sessionStorage.clear();

            console.log('Navigating to login...');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error during logout:', error);
            console.error('Error details:', error.code, error.message);

            // Force navigation even if there's an error
            localStorage.clear();
            sessionStorage.clear();
            navigate('/login', { replace: true });
        }
    };

    const handleSystemCheck = () => {
        const results = [];

        // Check all systems
        if (engineHealth) {
            // Fuel System
            if (engineHealth.Fuel < 20) {
                results.push({ system: 'Fuel System', status: 'Critical', message: `Fuel level at ${engineHealth.Fuel}% - Refuel immediately`, color: '#ef4444' });
            } else if (engineHealth.Fuel < 50) {
                results.push({ system: 'Fuel System', status: 'Warning', message: `Fuel level at ${engineHealth.Fuel}% - Consider refueling soon`, color: '#f59e0b' });
            } else {
                results.push({ system: 'Fuel System', status: 'OK', message: `Fuel level optimal at ${engineHealth.Fuel}%`, color: '#10b981' });
            }

            // Oil System
            if (engineHealth.Oil < 30) {
                results.push({ system: 'Oil System', status: 'Critical', message: `Oil level at ${engineHealth.Oil}% - Service required`, color: '#ef4444' });
            } else if (engineHealth.Oil < 50) {
                results.push({ system: 'Oil System', status: 'Warning', message: `Oil level at ${engineHealth.Oil}% - Monitor closely`, color: '#f59e0b' });
            } else {
                results.push({ system: 'Oil System', status: 'OK', message: `Oil level normal at ${engineHealth.Oil}%`, color: '#10b981' });
            }

            // Engine Temperature
            if (engineHealth.Temp > 90) {
                results.push({ system: 'Engine Temperature', status: 'Critical', message: `Temperature at ${engineHealth.Temp}°C - Engine overheating!`, color: '#ef4444' });
            } else if (engineHealth.Temp > 80) {
                results.push({ system: 'Engine Temperature', status: 'Warning', message: `Temperature at ${engineHealth.Temp}°C - Running warm`, color: '#f59e0b' });
            } else {
                results.push({ system: 'Engine Temperature', status: 'OK', message: `Temperature normal at ${engineHealth.Temp}°C`, color: '#10b981' });
            }

            // Battery Voltage
            if (engineHealth.Volt < 12) {
                results.push({ system: 'Battery', status: 'Critical', message: `Voltage at ${engineHealth.Volt}V - Battery weak`, color: '#ef4444' });
            } else if (engineHealth.Volt > 14.5) {
                results.push({ system: 'Battery', status: 'Warning', message: `Voltage at ${engineHealth.Volt}V - Possible charging issue`, color: '#f59e0b' });
            } else {
                results.push({ system: 'Battery', status: 'OK', message: `Voltage optimal at ${engineHealth.Volt}V`, color: '#10b981' });
            }

            // Coolant/Water
            if (engineHealth.Water < 40) {
                results.push({ system: 'Coolant System', status: 'Critical', message: `Coolant at ${engineHealth.Water}% - Add coolant immediately`, color: '#ef4444' });
            } else if (engineHealth.Water < 60) {
                results.push({ system: 'Coolant System', status: 'Warning', message: `Coolant at ${engineHealth.Water}% - Check level`, color: '#f59e0b' });
            } else {
                results.push({ system: 'Coolant System', status: 'OK', message: `Coolant level good at ${engineHealth.Water}%`, color: '#10b981' });
            }

            // Humidity/Air Quality
            if (engineHealth.Humidity > 80) {
                results.push({ system: 'Air Quality', status: 'Warning', message: `High humidity at ${engineHealth.Humidity}% - Check air filter`, color: '#f59e0b' });
            } else {
                results.push({ system: 'Air Quality', status: 'OK', message: `Humidity normal at ${engineHealth.Humidity}%`, color: '#10b981' });
            }

            // Vibration Check
            if (engineHealth.MPU) {
                const maxVib = Math.max(
                    Math.abs(engineHealth.MPU.X || 0),
                    Math.abs(engineHealth.MPU.Y || 0),
                    Math.abs(engineHealth.MPU.Z || 0)
                );
                if (maxVib > 50) {
                    results.push({ system: 'Vibration Monitor', status: 'Warning', message: `High vibration detected (${maxVib.toFixed(1)}) - Check alignment`, color: '#f59e0b' });
                } else {
                    results.push({ system: 'Vibration Monitor', status: 'OK', message: `Vibration levels normal`, color: '#10b981' });
                }
            }
        } else {
            results.push({ system: 'Connection', status: 'Error', message: 'Unable to retrieve vehicle data', color: '#ef4444' });
        }

        setDiagnosticResults(results);
        setShowDiagnosticModal(true);
    };

    const handleClearErrorCodes = () => {
        if (window.confirm('Are you sure you want to clear all error codes? This will reset all active alerts.')) {
            setAlerts([]);
            alert('Error codes cleared successfully! Note: New alerts will be generated if issues persist.');
        }
    };

    const handleExportReport = () => {
        const timestamp = new Date().toLocaleString();
        const reportData = `
========================================
VEHICLE MONITORING REPORT
========================================

Generated: ${timestamp}

----------------------------------------
VEHICLE INFORMATION
----------------------------------------
Car Name: ${vehicleDetails.carName || 'N/A'}
Car Number: ${vehicleDetails.carNumber || 'N/A'}
Owner: ${vehicleDetails.userName || 'N/A'}
Phone: ${vehicleDetails.phoneNumber || 'N/A'}

----------------------------------------
CURRENT SYSTEM STATUS
----------------------------------------
Fuel Level: ${engineHealth?.Fuel || 0}%
Oil Level: ${engineHealth?.Oil || 0}%
Engine Temperature: ${engineHealth?.Temp || 0}°C
Battery Voltage: ${engineHealth?.Volt || 0}V
Coolant Level: ${engineHealth?.Water || 0}%
Humidity: ${engineHealth?.Humidity || 0}%

----------------------------------------
VIBRATION READINGS
----------------------------------------
X-Axis: ${engineHealth?.MPU?.X || 0}
Y-Axis: ${engineHealth?.MPU?.Y || 0}
Z-Axis: ${engineHealth?.MPU?.Z || 0}

----------------------------------------
ACTIVE ALERTS (${alerts.length})
----------------------------------------
${alerts.length > 0 ? alerts.map((alert, i) => `${i + 1}. ${alert}`).join('\n') : 'No active alerts - All systems normal'}

----------------------------------------
MAINTENANCE SUGGESTIONS
----------------------------------------
${suggestions.map((suggestion, i) => `${i + 1}. ${suggestion}`).join('\n')}

----------------------------------------
RECENT PERFORMANCE DATA
----------------------------------------
${chartData.slice(-5).map((data, i) => `
Reading ${i + 1} at ${data.time}:
  - Fuel: ${data.fuel}%
  - Oil: ${data.oil}%
  - Temperature: ${data.temp}°C
  - Voltage: ${data.volt}V`).join('\n')}

========================================
END OF REPORT
========================================
        `.trim();

        // Create blob and download
        const blob = new Blob([reportData], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vehicle_report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        alert('Report exported successfully!');
    };

    const handleScheduleService = (serviceName, priority) => {
        setSelectedService({ name: serviceName, priority });
        setShowScheduleModal(true);
        setScheduleForm({ date: '', time: '', notes: '' });
    };

    const handleScheduleSubmit = () => {
        if (!scheduleForm.date || !scheduleForm.time) {
            alert('Please select both date and time for the appointment.');
            return;
        }

        const appointmentDetails = `
Service Appointment Scheduled!

Service: ${selectedService.name}
Date: ${scheduleForm.date}
Time: ${scheduleForm.time}
${scheduleForm.notes ? `Notes: ${scheduleForm.notes}` : ''}

You will receive a confirmation email shortly.
        `;

        alert(appointmentDetails);
        setShowScheduleModal(false);
        setSelectedService(null);
        setScheduleForm({ date: '', time: '', notes: '' });
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: '#f5f7fa',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            flexDirection: window.innerWidth < 768 ? 'column' : 'row'
        }}>
            {/* Sidebar */}
            <div style={{
                width: window.innerWidth < 768 ? '100%' : window.innerWidth < 1024 ? '240px' : '280px',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                padding: window.innerWidth < 768 ? '16px' : '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
                height: window.innerWidth < 768 ? 'auto' : '100vh',
                overflow: window.innerWidth < 768 ? 'visible' : 'hidden',
                position: window.innerWidth < 768 ? 'relative' : 'sticky',
                top: 0
            }}>
                {/* Logo/Brand */}
                <div style={{ marginBottom: window.innerWidth < 400 ? '12px' : window.innerWidth < 768 ? '24px' : '48px' }}>
                    <h2 style={{
                        color: '#fff',
                        fontSize: window.innerWidth < 400 ? '0.875rem' : window.innerWidth < 768 ? '1.25rem' : '1.5rem',
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: '-0.5px'
                    }}>
                        VehicleTrack
                    </h2>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem',
                        margin: window.innerWidth < 400 ? '4px 0 0 0' : '8px 0 0 0'
                    }}>
                        Real-time Monitoring
                    </p>
                </div>

                {/* Navigation */}
                <div style={{ marginBottom: window.innerWidth < 400 ? '12px' : '24px' }}>
                    {['Dashboard', 'Analytics', 'Reports', 'Service Check'].map(menu => (
                        <div
                            key={menu}
                            onClick={() => setActiveMenu(menu)}
                            style={{
                                padding: window.innerWidth < 400 ? '6px 8px' : window.innerWidth < 768 ? '10px 12px' : '12px 16px',
                                background: activeMenu === menu ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                borderRadius: window.innerWidth < 400 ? 8 : 12,
                                marginBottom: window.innerWidth < 400 ? '4px' : '8px',
                                borderLeft: activeMenu === menu ? '3px solid #38bdf8' : '3px solid transparent',
                                color: activeMenu === menu ? '#38bdf8' : '#94a3b8',
                                fontWeight: activeMenu === menu ? 600 : 500,
                                fontSize: window.innerWidth < 400 ? '0.7rem' : window.innerWidth < 768 ? '0.875rem' : '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (activeMenu !== menu) {
                                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                                    e.currentTarget.style.color = '#cbd5e1';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeMenu !== menu) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#94a3b8';
                                }
                            }}
                        >
                            {menu}
                        </div>
                    ))}
                </div>

                {/* User Profile & Logout */}
                <div style={{
                    padding: window.innerWidth < 400 ? '12px' : '20px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: window.innerWidth < 400 ? 12 : 16,
                    marginTop: 'auto'
                }}>
                    <div style={{
                        color: '#e2e8f0',
                        fontSize: window.innerWidth < 400 ? '0.75rem' : '0.9rem',
                        fontWeight: 600,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {vehicleDetails.userName || auth.currentUser?.email?.split('@')[0] || 'User'}
                    </div>
                    <div style={{
                        color: '#64748b',
                        fontSize: window.innerWidth < 400 ? '0.625rem' : '0.8rem',
                        marginBottom: window.innerWidth < 400 ? '8px' : '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: window.innerWidth < 400 ? 'none' : 'block'
                    }}>
                        {auth.currentUser?.email || 'user@example.com'}
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: window.innerWidth < 400 ? '8px' : '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: window.innerWidth < 400 ? 6 : 8,
                            color: '#fca5a5',
                            fontWeight: 600,
                            fontSize: window.innerWidth < 400 ? '0.75rem' : '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
                {/* Top Bar */}
                <div style={{
                    background: '#fff',
                    padding: window.innerWidth < 400 ? '8px 12px' : window.innerWidth < 768 ? '16px 20px' : window.innerWidth < 1024 ? '20px 30px' : '24px 40px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: window.innerWidth < 400 ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: window.innerWidth < 400 ? 'flex-start' : 'center',
                    gap: window.innerWidth < 400 ? '8px' : '0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>                    <div>
                        <h1 style={{
                            fontSize: window.innerWidth < 400 ? '0.875rem' : window.innerWidth < 768 ? '1.25rem' : window.innerWidth < 1024 ? '1.5rem' : '1.75rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>
                            {window.innerWidth < 400 ? 'Dashboard' : 'Vehicle Dashboard'}
                        </h1>
                        <p style={{
                            color: '#64748b',
                            fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.9rem',
                            margin: '4px 0 0 0',
                            display: window.innerWidth < 400 ? 'none' : 'block'
                        }}>
                            Real-time monitoring and analytics
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: window.innerWidth < 400 ? '8px' : '12px',
                        background: '#f8fafc',
                        padding: window.innerWidth < 400 ? '6px 10px' : '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0'
                    }}>
                        <div>
                            <div style={{
                                fontSize: window.innerWidth < 400 ? '0.6rem' : '0.7rem',
                                color: '#64748b',
                                fontWeight: 600,
                                marginBottom: '2px'
                            }}>
                                📍 Location
                            </div>
                            <div style={{
                                fontSize: window.innerWidth < 400 ? '0.55rem' : '0.65rem',
                                color: '#475569',
                                fontFamily: 'monospace',
                                lineHeight: 1.4
                            }}>
                                Lat: 12.9716°N<br />
                                Lng: 77.5946°E
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: window.innerWidth < 400 ? '8px 12px' : window.innerWidth < 768 ? '16px 20px' : window.innerWidth < 1024 ? '24px 30px' : '32px 40px' }}>

                    {activeMenu === 'Dashboard' && (
                        <>
                            {/* Alert Notification Button - Fixed Position */}
                            {alerts.length > 0 && (
                                <div style={{
                                    position: 'fixed',
                                    top: window.innerWidth < 400 ? '70px' : '107px',
                                    right: window.innerWidth < 400 ? '8px' : '24px',
                                    zIndex: 999
                                }}>
                                    <button
                                        onClick={() => setShowAlertModal(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: window.innerWidth < 400 ? '4px' : '8px',
                                            padding: window.innerWidth < 400 ? '6px 12px' : '10px 20px',
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: window.innerWidth < 400 ? 20 : 24,
                                            fontSize: window.innerWidth < 400 ? '0.7rem' : '0.875rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <div style={{
                                            width: window.innerWidth < 400 ? '14px' : '20px',
                                            height: window.innerWidth < 400 ? '14px' : '20px',
                                            borderRadius: '50%',
                                            background: '#fff',
                                            color: '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: window.innerWidth < 400 ? '0.7rem' : '0.875rem',
                                            fontWeight: 700
                                        }}>
                                            !
                                        </div>
                                        <span>{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</span>
                                    </button>
                                </div>
                            )}

                            {/* Vehicle Details Section */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                padding: window.innerWidth < 400 ? '16px' : '32px',
                                border: '1px solid #e2e8f0',
                                marginBottom: window.innerWidth < 400 ? '16px' : '24px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: window.innerWidth < 400 ? '16px' : '24px'
                                }}>
                                    <h3 style={{
                                        fontSize: window.innerWidth < 400 ? '1rem' : '1.5rem',
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        margin: 0,
                                        letterSpacing: '-0.5px'
                                    }}>
                                        Vehicle Details
                                    </h3>
                                    <button
                                        onClick={handleEditClick}
                                        style={{
                                            padding: window.innerWidth < 400 ? '8px 16px' : '10px 24px',
                                            background: isEditing ? '#38bdf8' : '#fff',
                                            border: `2px solid ${isEditing ? '#38bdf8' : '#e2e8f0'}`,
                                            borderRadius: 10,
                                            color: isEditing ? '#fff' : '#475569',
                                            fontWeight: 600,
                                            fontSize: window.innerWidth < 400 ? '0.8rem' : '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            boxShadow: isEditing ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none'
                                        }}
                                    >
                                        {isEditing ? 'Save' : 'Edit'}
                                    </button>
                                </div>

                                {vehicleDetails.lastUpdated && (
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: window.innerWidth < 400 ? '8px 12px' : '12px 16px',
                                        borderRadius: 10,
                                        marginBottom: window.innerWidth < 400 ? '16px' : '24px',
                                        fontSize: window.innerWidth < 400 ? '0.7rem' : '0.875rem',
                                        color: '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <span style={{ fontWeight: 600 }}>Last Updated:</span>
                                        <span>{new Date(vehicleDetails.lastUpdated).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                )}

                                {isEditing ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: window.innerWidth < 400 ? '12px' : '16px' }}>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#475569',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                fontSize: window.innerWidth < 400 ? '0.75rem' : '0.875rem'
                                            }}>
                                                Car Name
                                            </label>
                                            <input
                                                type="text"
                                                name="carName"
                                                value={vehicleDetails.carName}
                                                onChange={handleInputChange}
                                                placeholder="Enter car name"
                                                style={{
                                                    width: '100%',
                                                    padding: window.innerWidth < 400 ? '10px 12px' : '12px 16px',
                                                    borderRadius: 10,
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#0f172a',
                                                    fontSize: window.innerWidth < 400 ? '0.875rem' : '1rem',
                                                    outline: 'none',
                                                    transition: 'border 0.3s'
                                                }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#475569',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                fontSize: window.innerWidth < 400 ? '0.75rem' : '0.875rem'
                                            }}>
                                                User Name
                                            </label>
                                            <input
                                                type="text"
                                                name="userName"
                                                value={vehicleDetails.userName}
                                                onChange={handleInputChange}
                                                placeholder="Enter user name"
                                                style={{
                                                    width: '100%',
                                                    padding: window.innerWidth < 400 ? '10px 12px' : '12px 16px',
                                                    borderRadius: 10,
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#0f172a',
                                                    fontSize: window.innerWidth < 400 ? '0.875rem' : '1rem',
                                                    outline: 'none',
                                                    transition: 'border 0.3s'
                                                }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#475569',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                fontSize: window.innerWidth < 400 ? '0.75rem' : '0.875rem'
                                            }}>
                                                Phone Number
                                            </label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={vehicleDetails.phoneNumber}
                                                onChange={handleInputChange}
                                                placeholder="Enter phone number"
                                                style={{
                                                    width: '100%',
                                                    padding: window.innerWidth < 400 ? '10px 12px' : '12px 16px',
                                                    borderRadius: 10,
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#0f172a',
                                                    fontSize: window.innerWidth < 400 ? '0.875rem' : '1rem',
                                                    outline: 'none',
                                                    transition: 'border 0.3s'
                                                }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#475569',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                fontSize: window.innerWidth < 400 ? '0.75rem' : '0.875rem'
                                            }}>
                                                Car Number
                                            </label>
                                            <input
                                                type="text"
                                                name="carNumber"
                                                value={vehicleDetails.carNumber}
                                                onChange={handleInputChange}
                                                placeholder="Enter car number"
                                                style={{
                                                    width: '100%',
                                                    padding: window.innerWidth < 400 ? '10px 12px' : '12px 16px',
                                                    borderRadius: 10,
                                                    border: '1px solid #e2e8f0',
                                                    background: '#fff',
                                                    color: '#0f172a',
                                                    fontSize: window.innerWidth < 400 ? '0.875rem' : '1rem',
                                                    outline: 'none',
                                                    transition: 'border 0.3s'
                                                }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: window.innerWidth < 400 ? '12px' : '16px' }}>
                                        <div style={{
                                            padding: window.innerWidth < 400 ? '12px' : '20px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '0.7rem' : '0.875rem',
                                                color: '#64748b',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Car Name
                                            </div>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '1rem' : '1.25rem',
                                                fontWeight: 700,
                                                color: '#0f172a'
                                            }}>
                                                {vehicleDetails.carName || 'Not Set'}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: window.innerWidth < 400 ? '12px' : '20px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '0.7rem' : '0.875rem',
                                                color: '#64748b',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                User Name
                                            </div>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '1rem' : '1.25rem',
                                                fontWeight: 700,
                                                color: '#0f172a'
                                            }}>
                                                {vehicleDetails.userName || 'Not Set'}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: window.innerWidth < 400 ? '12px' : '20px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '0.7rem' : '0.875rem',
                                                color: '#64748b',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Phone Number
                                            </div>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '1rem' : '1.25rem',
                                                fontWeight: 700,
                                                color: '#0f172a'
                                            }}>
                                                {vehicleDetails.phoneNumber || 'Not Set'}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: window.innerWidth < 400 ? '12px' : '20px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '0.7rem' : '0.875rem',
                                                color: '#64748b',
                                                marginBottom: '8px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                Car Number
                                            </div>
                                            <div style={{
                                                fontSize: window.innerWidth < 400 ? '1rem' : '1.25rem',
                                                fontWeight: 700,
                                                color: '#0f172a'
                                            }}>
                                                {vehicleDetails.carNumber || 'Not Set'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Performance Overview */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth < 480 ? '1fr' : window.innerWidth < 768 ? 'repeat(2, 1fr)' : window.innerWidth < 1024 ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
                                gap: window.innerWidth < 768 ? '12px' : '20px',
                                marginBottom: window.innerWidth < 768 ? '20px' : '32px'
                            }}>
                                {[
                                    { label: 'Avg Fuel', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.fuel, 0) / chartData.length) : 0}%`, color: '#3b82f6' },
                                    { label: 'Avg Oil', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.oil, 0) / chartData.length) : 0}%`, color: '#8b5cf6' },
                                    { label: 'Avg Temp', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.temp, 0) / chartData.length) : 0}°C`, color: '#f59e0b' },
                                    { label: 'Battery', value: `${chartData.length > 0 ? (chartData.reduce((acc, d) => acc + d.volt, 0) / chartData.length).toFixed(1) : 0}V`, color: '#10b981' },
                                    { label: 'Humidity', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.humidity, 0) / chartData.length) : 0}%`, color: '#06b6d4' },
                                    { label: 'Coolant', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.water, 0) / chartData.length) : 0}%`, color: '#ec4899' }
                                ].map((stat, i) => (
                                    <div key={i} style={{
                                        background: '#fff',
                                        borderRadius: window.innerWidth < 400 ? 8 : 12,
                                        padding: window.innerWidth < 400 ? '8px' : window.innerWidth < 768 ? '16px' : '20px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.85rem', color: '#64748b', marginBottom: window.innerWidth < 400 ? '4px' : '8px', fontWeight: 600 }}>{stat.label}</div>
                                        <div style={{ fontSize: window.innerWidth < 400 ? '1rem' : window.innerWidth < 768 ? '1.5rem' : '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Stats Grid - Conditional */}
                            {showDetails && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '24px',
                                    marginBottom: '32px'
                                }}>
                                    {/* Fuel Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Fuel Level
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.Fuel || 0}<span style={{ fontSize: '1.5rem', color: '#64748b' }}>%</span>
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: engineHealth?.Fuel < 20 ? '#fee2e2' : engineHealth?.Fuel < 50 ? '#fef3c7' : '#dcfce7',
                                            color: engineHealth?.Fuel < 20 ? '#dc2626' : engineHealth?.Fuel < 50 ? '#f59e0b' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {engineHealth?.Fuel < 20 ? 'Critical' : engineHealth?.Fuel < 50 ? 'Low' : 'Good'}
                                        </div>
                                    </div>

                                    {/* Oil Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Oil Level
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.Oil || 0}<span style={{ fontSize: '1.5rem', color: '#64748b' }}>%</span>
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: engineHealth?.Oil < 30 ? '#fee2e2' : engineHealth?.Oil < 50 ? '#fef3c7' : '#dcfce7',
                                            color: engineHealth?.Oil < 30 ? '#dc2626' : engineHealth?.Oil < 50 ? '#f59e0b' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {engineHealth?.Oil < 30 ? 'Critical' : engineHealth?.Oil < 50 ? 'Low' : 'Good'}
                                        </div>
                                    </div>

                                    {/* Temperature Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Temperature
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.Temp || 0}<span style={{ fontSize: '1.5rem', color: '#64748b' }}>°C</span>
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: engineHealth?.Temp > 90 ? '#fee2e2' : engineHealth?.Temp > 70 ? '#fef3c7' : '#dcfce7',
                                            color: engineHealth?.Temp > 90 ? '#dc2626' : engineHealth?.Temp > 70 ? '#f59e0b' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {engineHealth?.Temp > 90 ? 'Critical' : engineHealth?.Temp > 70 ? 'High' : 'Normal'}
                                        </div>
                                    </div>

                                    {/* Voltage Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #10b981, #34d399)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Battery
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.Volt || 0}<span style={{ fontSize: '1.5rem', color: '#64748b' }}>V</span>
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: (engineHealth?.Volt < 12 || engineHealth?.Volt > 14.5) ? '#fee2e2' : '#dcfce7',
                                            color: (engineHealth?.Volt < 12 || engineHealth?.Volt > 14.5) ? '#dc2626' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {engineHealth?.Volt < 12 ? 'Low' : engineHealth?.Volt > 14.5 ? 'High' : 'Good'}
                                        </div>
                                    </div>

                                    {/* Humidity Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #06b6d4, #22d3ee)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Humidity
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.Humidity || 0}<span style={{ fontSize: '1.5rem', color: '#64748b' }}>%</span>
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: (engineHealth?.Humidity < 20 || engineHealth?.Humidity > 80) ? '#fef3c7' : '#dcfce7',
                                            color: (engineHealth?.Humidity < 20 || engineHealth?.Humidity > 80) ? '#f59e0b' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {engineHealth?.Humidity < 20 ? 'Low' : engineHealth?.Humidity > 80 ? 'High' : 'Normal'}
                                        </div>
                                    </div>

                                    {/* Water Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #ec4899, #f472b6)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Coolant
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.Water || 0}<span style={{ fontSize: '1.5rem', color: '#64748b' }}>%</span>
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: engineHealth?.Water < 30 ? '#fee2e2' : engineHealth?.Water < 50 ? '#fef3c7' : '#dcfce7',
                                            color: engineHealth?.Water < 30 ? '#dc2626' : engineHealth?.Water < 50 ? '#f59e0b' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {engineHealth?.Water < 30 ? 'Critical' : engineHealth?.Water < 50 ? 'Low' : 'Good'}
                                        </div>
                                    </div>

                                    {/* Vibration X Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #ef4444, #f87171)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Vibration X
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.MPU?.X || 0}
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: Math.abs(engineHealth?.MPU?.X || 0) > 50 ? '#fee2e2' : '#dcfce7',
                                            color: Math.abs(engineHealth?.MPU?.X || 0) > 50 ? '#dc2626' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {Math.abs(engineHealth?.MPU?.X || 0) > 50 ? 'High' : 'Normal'}
                                        </div>
                                    </div>

                                    {/* Vibration Y Card */}
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: '24px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: 'linear-gradient(90deg, #f97316, #fb923c)'
                                        }} />
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '12px'
                                        }}>
                                            Vibration Y
                                        </div>
                                        <div style={{
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            marginBottom: '8px'
                                        }}>
                                            {engineHealth?.MPU?.Y || 0}
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            background: Math.abs(engineHealth?.MPU?.Y || 0) > 50 ? '#fee2e2' : '#dcfce7',
                                            color: Math.abs(engineHealth?.MPU?.Y || 0) > 50 ? '#dc2626' : '#16a34a',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {Math.abs(engineHealth?.MPU?.Y || 0) > 50 ? 'High' : 'Normal'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Alert Modal */}
                            {showAlertModal && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 9999,
                                    backdropFilter: 'blur(4px)',
                                    padding: window.innerWidth < 400 ? '8px' : '16px'
                                }}
                                    onClick={() => setShowAlertModal(false)}
                                >
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: window.innerWidth < 400 ? 12 : 20,
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                        padding: window.innerWidth < 400 ? '16px' : '32px',
                                        maxWidth: window.innerWidth < 400 ? '100%' : '600px',
                                        width: window.innerWidth < 400 ? '100%' : '90%',
                                        maxHeight: '80vh',
                                        overflowY: 'auto',
                                        position: 'relative'
                                    }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Close Button */}
                                        <button
                                            onClick={() => setShowAlertModal(false)}
                                            style={{
                                                position: 'absolute',
                                                top: window.innerWidth < 400 ? '8px' : '16px',
                                                right: window.innerWidth < 400 ? '8px' : '16px',
                                                background: '#f1f5f9',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: window.innerWidth < 400 ? '28px' : '36px',
                                                height: window.innerWidth < 400 ? '28px' : '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: window.innerWidth < 400 ? '1.25rem' : '1.5rem',
                                                color: '#64748b',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#e2e8f0';
                                                e.target.style.color = '#0f172a';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#f1f5f9';
                                                e.target.style.color = '#64748b';
                                            }}
                                        >
                                            ×
                                        </button>

                                        {/* Modal Header */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: window.innerWidth < 400 ? '8px' : '12px',
                                            marginBottom: window.innerWidth < 400 ? '16px' : '24px',
                                            paddingRight: window.innerWidth < 400 ? '32px' : '40px'
                                        }}>
                                            <div style={{
                                                width: window.innerWidth < 400 ? '32px' : '48px',
                                                height: window.innerWidth < 400 ? '32px' : '48px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: window.innerWidth < 400 ? '1rem' : '1.5rem',
                                                fontWeight: 700,
                                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                            }}>
                                                !
                                            </div>
                                            <div>
                                                <h3 style={{
                                                    fontSize: window.innerWidth < 400 ? '1rem' : '1.5rem',
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    margin: 0,
                                                    letterSpacing: '-0.5px'
                                                }}>
                                                    Critical Alerts
                                                </h3>
                                                <p style={{
                                                    color: '#64748b',
                                                    fontSize: window.innerWidth < 400 ? '0.7rem' : '0.9rem',
                                                    margin: '4px 0 0 0',
                                                    display: window.innerWidth < 400 ? 'none' : 'block'
                                                }}>
                                                    {alerts.length} issue{alerts.length > 1 ? 's' : ''} requiring attention
                                                </p>
                                            </div>
                                        </div>

                                        {/* Alert List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: window.innerWidth < 400 ? '8px' : '12px' }}>
                                            {alerts.map((alert, index) => (
                                                <div key={index} style={{
                                                    background: '#fef2f2',
                                                    padding: window.innerWidth < 400 ? '10px 12px' : '16px 20px',
                                                    borderRadius: window.innerWidth < 400 ? 8 : 12,
                                                    border: '1px solid #fecaca',
                                                    color: '#991b1b',
                                                    fontSize: window.innerWidth < 400 ? '0.7rem' : '0.95rem',
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: window.innerWidth < 400 ? '8px' : '12px'
                                                }}>
                                                    <div style={{
                                                        width: window.innerWidth < 400 ? '6px' : '8px',
                                                        height: window.innerWidth < 400 ? '6px' : '8px',
                                                        borderRadius: '50%',
                                                        background: '#dc2626',
                                                        flexShrink: 0
                                                    }} />
                                                    <span>{alert}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Combined Monitoring Chart */}
                            <div style={{
                                marginBottom: window.innerWidth < 400 ? '16px' : window.innerWidth < 768 ? '20px' : '32px'
                            }}>
                                <div style={{
                                    background: '#fff',
                                    borderRadius: window.innerWidth < 400 ? 12 : 16,
                                    padding: window.innerWidth < 400 ? '12px' : window.innerWidth < 768 ? '20px' : '32px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ marginBottom: window.innerWidth < 400 ? '12px' : window.innerWidth < 768 ? '16px' : '24px' }}>
                                        <h3 style={{
                                            fontSize: window.innerWidth < 400 ? '0.875rem' : window.innerWidth < 768 ? '1.125rem' : '1.5rem',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            margin: 0,
                                            letterSpacing: '-0.5px'
                                        }}>
                                            {window.innerWidth < 400 ? 'Vehicle Monitor' : 'Real-Time Vehicle Monitoring'}
                                        </h3>
                                        <p style={{
                                            color: '#64748b',
                                            fontSize: window.innerWidth < 400 ? '0.65rem' : '0.9rem',
                                            margin: '8px 0 0 0'
                                        }}>
                                            {/* All key metrics in one comprehensive view */}
                                        </p>
                                    </div>

                                    {/* Legend */}
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: window.innerWidth < 400 ? '8px' : window.innerWidth < 768 ? '12px' : '16px',
                                        marginBottom: window.innerWidth < 400 ? '12px' : '20px',
                                        padding: window.innerWidth < 400 ? '8px' : '16px',
                                        background: '#f8fafc',
                                        borderRadius: window.innerWidth < 400 ? 8 : 12
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 400 ? '4px' : '8px' }}>
                                            <div style={{ width: window.innerWidth < 400 ? '8px' : '12px', height: window.innerWidth < 400 ? '8px' : '12px', borderRadius: '50%', background: '#3b82f6' }} />
                                            <span style={{ fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem', color: '#64748b', fontWeight: 500 }}>Fuel (%)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 400 ? '4px' : '8px' }}>
                                            <div style={{ width: window.innerWidth < 400 ? '8px' : '12px', height: window.innerWidth < 400 ? '8px' : '12px', borderRadius: '50%', background: '#8b5cf6' }} />
                                            <span style={{ fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem', color: '#64748b', fontWeight: 500 }}>Oil (%)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 400 ? '4px' : '8px' }}>
                                            <div style={{ width: window.innerWidth < 400 ? '8px' : '12px', height: window.innerWidth < 400 ? '8px' : '12px', borderRadius: '50%', background: '#f59e0b' }} />
                                            <span style={{ fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem', color: '#64748b', fontWeight: 500 }}>Temp (°C)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 400 ? '4px' : '8px' }}>
                                            <div style={{ width: window.innerWidth < 400 ? '8px' : '12px', height: window.innerWidth < 400 ? '8px' : '12px', borderRadius: '50%', background: '#10b981' }} />
                                            <span style={{ fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem', color: '#64748b', fontWeight: 500 }}>Battery (V)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 400 ? '4px' : '8px' }}>
                                            <div style={{ width: window.innerWidth < 400 ? '8px' : '12px', height: window.innerWidth < 400 ? '8px' : '12px', borderRadius: '50%', background: '#06b6d4' }} />
                                            <span style={{ fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem', color: '#64748b', fontWeight: 500 }}>Humidity (%)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: window.innerWidth < 400 ? '4px' : '8px' }}>
                                            <div style={{ width: window.innerWidth < 400 ? '8px' : '12px', height: window.innerWidth < 400 ? '8px' : '12px', borderRadius: '50%', background: '#ec4899' }} />
                                            <span style={{ fontSize: window.innerWidth < 400 ? '0.625rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem', color: '#64748b', fontWeight: 500 }}>Coolant (%)</span>
                                        </div>
                                    </div>

                                    {chartData.length > 0 && chartData.length < 3 && (
                                        <div style={{
                                            padding: window.innerWidth < 400 ? '8px 10px' : '12px 16px',
                                            background: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: window.innerWidth < 400 ? 8 : 10,
                                            marginBottom: window.innerWidth < 400 ? '8px' : '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: window.innerWidth < 400 ? '6px' : '12px'
                                        }}>
                                            <span style={{ color: '#1e40af', fontSize: window.innerWidth < 400 ? '0.65rem' : window.innerWidth < 768 ? '0.75rem' : '0.875rem', fontWeight: 500 }}>
                                                {window.innerWidth < 400 ? 'Collecting data...' : 'Collecting initial data... Chart will show trends after more data points are received.'}
                                            </span>
                                        </div>
                                    )}

                                    <ResponsiveContainer width="100%" height={window.innerWidth < 400 ? 250 : window.innerWidth < 768 ? 300 : 400}>
                                        <LineChart data={chartData} margin={{ top: 5, right: window.innerWidth < 400 ? 10 : 30, left: window.innerWidth < 400 ? 0 : 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="time"
                                                stroke="#94a3b8"
                                                style={{ fontSize: window.innerWidth < 400 ? '0.55rem' : window.innerWidth < 768 ? '0.65rem' : '0.75rem' }}
                                                tick={{ fill: '#64748b' }}
                                                angle={window.innerWidth < 400 ? -60 : -45}
                                                textAnchor="end"
                                                height={window.innerWidth < 400 ? 60 : 80}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                style={{ fontSize: window.innerWidth < 400 ? '0.55rem' : window.innerWidth < 768 ? '0.65rem' : '0.75rem' }}
                                                tick={{ fill: '#64748b' }}
                                                domain={[0, 100]}
                                                width={window.innerWidth < 400 ? 30 : 40}
                                            />
                                            <YAxis
                                                yAxisId="voltage"
                                                orientation="right"
                                                stroke="#10b981"
                                                style={{ fontSize: window.innerWidth < 400 ? '0.55rem' : window.innerWidth < 768 ? '0.65rem' : '0.75rem' }}
                                                tick={{ fill: '#10b981' }}
                                                domain={[0, 16]}
                                                width={window.innerWidth < 400 ? 30 : 40}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#fff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 8,
                                                    fontSize: window.innerWidth < 400 ? '0.65rem' : '0.75rem'
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="fuel"
                                                stroke="#3b82f6"
                                                strokeWidth={window.innerWidth < 400 ? 2 : 3}
                                                name="Fuel (%)"
                                                dot={{ fill: '#3b82f6', r: window.innerWidth < 400 ? 3 : 4 }}
                                                activeDot={{ r: window.innerWidth < 400 ? 4 : 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="oil"
                                                stroke="#8b5cf6"
                                                strokeWidth={window.innerWidth < 400 ? 2 : 3}
                                                name="Oil (%)"
                                                dot={{ fill: '#8b5cf6', r: window.innerWidth < 400 ? 3 : 4 }}
                                                activeDot={{ r: window.innerWidth < 400 ? 4 : 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="temp"
                                                stroke="#f59e0b"
                                                strokeWidth={window.innerWidth < 400 ? 2 : 3}
                                                name="Temperature (°C)"
                                                dot={{ fill: '#f59e0b', r: window.innerWidth < 400 ? 3 : 4 }}
                                                activeDot={{ r: window.innerWidth < 400 ? 4 : 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="volt"
                                                stroke="#10b981"
                                                strokeWidth={window.innerWidth < 400 ? 2 : 3}
                                                name="Battery (V)"
                                                dot={{ fill: '#10b981', r: window.innerWidth < 400 ? 3 : 4 }}
                                                activeDot={{ r: window.innerWidth < 400 ? 4 : 6 }}
                                                yAxisId="voltage"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="humidity"
                                                stroke="#06b6d4"
                                                strokeWidth={window.innerWidth < 400 ? 2 : 3}
                                                name="Humidity (%)"
                                                dot={{ fill: '#06b6d4', r: window.innerWidth < 400 ? 3 : 4 }}
                                                activeDot={{ r: window.innerWidth < 400 ? 4 : 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="water"
                                                stroke="#ec4899"
                                                strokeWidth={window.innerWidth < 400 ? 2 : 3}
                                                name="Coolant (%)"
                                                dot={{ fill: '#ec4899', r: window.innerWidth < 400 ? 3 : 4 }}
                                                activeDot={{ r: window.innerWidth < 400 ? 4 : 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Individual Metric Charts */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                gap: window.innerWidth < 768 ? '16px' : '24px',
                                marginBottom: window.innerWidth < 768 ? '20px' : '32px'
                            }}>
                                {/* Fuel Chart */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: window.innerWidth < 768 ? '16px' : '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{
                                        fontSize: window.innerWidth < 400 ? '0.75rem' : window.innerWidth < 768 ? '0.875rem' : '0.95rem',
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: window.innerWidth < 400 ? '8px' : '12px'
                                    }}>
                                        Fuel Level
                                    </h4>
                                    <ResponsiveContainer width="100%" height={window.innerWidth < 400 ? 100 : window.innerWidth < 768 ? 120 : 150}>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis stroke="#94a3b8" style={{ fontSize: window.innerWidth < 400 ? '0.6rem' : '0.7rem' }} width={window.innerWidth < 400 ? 25 : 35} />
                                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: window.innerWidth < 400 ? '0.65rem' : '0.75rem' }} />
                                            <Area type="monotone" dataKey="fuel" stroke="#3b82f6" strokeWidth={window.innerWidth < 400 ? 1.5 : 2} fill="url(#fuelGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        marginTop: window.innerWidth < 400 ? '8px' : '12px',
                                        padding: window.innerWidth < 400 ? '8px' : '12px',
                                        background: engineHealth?.Fuel < 20 ? '#fef2f2' : engineHealth?.Fuel < 50 ? '#fef3c7' : '#f0fdf4',
                                        borderRadius: window.innerWidth < 400 ? 6 : 8,
                                        border: `1px solid ${engineHealth?.Fuel < 20 ? '#fecaca' : engineHealth?.Fuel < 50 ? '#fde68a' : '#bbf7d0'}`
                                    }}>
                                        <div style={{
                                            fontSize: window.innerWidth < 400 ? '0.65rem' : '0.8rem',
                                            color: engineHealth?.Fuel < 20 ? '#dc2626' : engineHealth?.Fuel < 50 ? '#d97706' : '#16a34a',
                                            fontWeight: 600,
                                            lineHeight: '1.4'
                                        }}>
                                            {engineHealth?.Fuel < 20 ? 'Critical: Refuel immediately to avoid running out' :
                                                engineHealth?.Fuel < 50 ? 'Warning: Plan to refuel soon' :
                                                    'Good: Fuel level is optimal'}
                                        </div>
                                    </div>
                                </div>

                                {/* Oil Chart */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: '12px'
                                    }}>
                                        Oil Pressure
                                    </h4>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem' }} />
                                            <Line type="monotone" dataKey="oil" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: engineHealth?.Oil < 30 ? '#fef2f2' : engineHealth?.Oil < 50 ? '#fef3c7' : '#f0fdf4',
                                        borderRadius: 8,
                                        border: `1px solid ${engineHealth?.Oil < 30 ? '#fecaca' : engineHealth?.Oil < 50 ? '#fde68a' : '#bbf7d0'}`
                                    }}>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: engineHealth?.Oil < 30 ? '#dc2626' : engineHealth?.Oil < 50 ? '#d97706' : '#16a34a',
                                            fontWeight: 600,
                                            lineHeight: '1.4'
                                        }}>
                                            {engineHealth?.Oil < 30 ? 'Critical: Schedule oil change immediately' :
                                                engineHealth?.Oil < 50 ? 'Warning: Oil change recommended within 1000 km' :
                                                    'Good: Oil level is normal'}
                                        </div>
                                    </div>
                                </div>

                                {/* Temperature Chart */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: '12px'
                                    }}>
                                        Engine Temperature
                                    </h4>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem' }} />
                                            <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} fill="url(#tempGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: engineHealth?.Temp > 90 ? '#fef2f2' : engineHealth?.Temp > 80 ? '#fef3c7' : '#f0fdf4',
                                        borderRadius: 8,
                                        border: `1px solid ${engineHealth?.Temp > 90 ? '#fecaca' : engineHealth?.Temp > 80 ? '#fde68a' : '#bbf7d0'}`
                                    }}>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: engineHealth?.Temp > 90 ? '#dc2626' : engineHealth?.Temp > 80 ? '#d97706' : '#16a34a',
                                            fontWeight: 600,
                                            lineHeight: '1.4'
                                        }}>
                                            {engineHealth?.Temp > 90 ? 'Danger: Engine overheating - Stop vehicle and check coolant' :
                                                engineHealth?.Temp > 80 ? 'Warning: Engine running warm - Monitor temperature' :
                                                    'Good: Engine temperature is normal'}
                                        </div>
                                    </div>
                                </div>

                                {/* Battery Chart */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: '12px'
                                    }}>
                                        Battery Voltage
                                    </h4>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} domain={[10, 16]} />
                                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem' }} />
                                            <Line type="monotone" dataKey="volt" stroke="#10b981" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: (engineHealth?.Volt < 12 || engineHealth?.Volt > 14.5) ? '#fef2f2' : '#f0fdf4',
                                        borderRadius: 8,
                                        border: `1px solid ${(engineHealth?.Volt < 12 || engineHealth?.Volt > 14.5) ? '#fecaca' : '#bbf7d0'}`
                                    }}>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: (engineHealth?.Volt < 12 || engineHealth?.Volt > 14.5) ? '#dc2626' : '#16a34a',
                                            fontWeight: 600,
                                            lineHeight: '1.4'
                                        }}>
                                            {engineHealth?.Volt < 12 ? 'Critical: Battery weak - Check charging system' :
                                                engineHealth?.Volt > 14.5 ? 'Warning: High voltage - Possible alternator issue' :
                                                    'Good: Battery voltage is optimal (12-14.5V)'}
                                        </div>
                                    </div>
                                </div>

                                {/* Humidity Chart */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: '12px'
                                    }}>
                                        Humidity Level
                                    </h4>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem' }} />
                                            <Area type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} fill="url(#humidityGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: engineHealth?.Humidity > 80 ? '#fef3c7' : '#f0fdf4',
                                        borderRadius: 8,
                                        border: `1px solid ${engineHealth?.Humidity > 80 ? '#fde68a' : '#bbf7d0'}`
                                    }}>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: engineHealth?.Humidity > 80 ? '#d97706' : '#16a34a',
                                            fontWeight: 600,
                                            lineHeight: '1.4'
                                        }}>
                                            {engineHealth?.Humidity > 80 ? 'Warning: High humidity - Check air filter and ventilation' :
                                                'Good: Humidity level is normal'}
                                        </div>
                                    </div>
                                </div>

                                {/* Coolant Chart */}
                                <div style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <h4 style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: '12px'
                                    }}>
                                        Coolant Level
                                    </h4>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis stroke="#94a3b8" style={{ fontSize: '0.7rem' }} />
                                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem' }} />
                                            <Line type="monotone" dataKey="water" stroke="#ec4899" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: engineHealth?.Water < 40 ? '#fef2f2' : engineHealth?.Water < 60 ? '#fef3c7' : '#f0fdf4',
                                        borderRadius: 8,
                                        border: `1px solid ${engineHealth?.Water < 40 ? '#fecaca' : engineHealth?.Water < 60 ? '#fde68a' : '#bbf7d0'}`
                                    }}>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: engineHealth?.Water < 40 ? '#dc2626' : engineHealth?.Water < 60 ? '#d97706' : '#16a34a',
                                            fontWeight: 600,
                                            lineHeight: '1.4'
                                        }}>
                                            {engineHealth?.Water < 40 ? 'Critical: Add coolant immediately - Risk of overheating' :
                                                engineHealth?.Water < 60 ? 'Warning: Coolant level low - Top up soon' :
                                                    'Good: Coolant level is adequate'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </>
                    )}

                    {/* Analytics Section */}
                    {activeMenu === 'Analytics' && (
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: '24px'
                            }}>
                                Vehicle Analytics
                            </h2>

                            {/* Performance Overview */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '20px',
                                marginBottom: '32px'
                            }}>
                                {[
                                    { label: 'Avg Fuel', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.fuel, 0) / chartData.length) : 0}%`, color: '#3b82f6' },
                                    { label: 'Avg Oil', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.oil, 0) / chartData.length) : 0}%`, color: '#8b5cf6' },
                                    { label: 'Avg Temp', value: `${chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.temp, 0) / chartData.length) : 0}°C`, color: '#f59e0b' },
                                    { label: 'Avg Voltage', value: `${chartData.length > 0 ? (chartData.reduce((acc, d) => acc + d.volt, 0) / chartData.length).toFixed(1) : 0}V`, color: '#10b981' }
                                ].map((stat, i) => (
                                    <div key={i} style={{
                                        background: '#fff',
                                        borderRadius: 12,
                                        padding: '20px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>{stat.label}</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Historical Trends */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                marginBottom: '32px'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Fuel Trend Analysis
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="fuelTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                                        <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                                        <Area type="monotone" dataKey="fuel" stroke="#3b82f6" strokeWidth={3} fill="url(#fuelTrend)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Temperature Analysis */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                marginBottom: '32px'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Temperature Monitoring
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                                        <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
                                        <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Performance Insights */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Performance Insights
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { title: 'Fuel Efficiency', status: engineHealth?.Fuel > 50 ? 'Excellent' : 'Needs Attention', color: engineHealth?.Fuel > 50 ? '#10b981' : '#f59e0b' },
                                        { title: 'Engine Health', status: engineHealth?.Temp < 90 && engineHealth?.Oil > 30 ? 'Optimal' : 'Check Required', color: engineHealth?.Temp < 90 && engineHealth?.Oil > 30 ? '#10b981' : '#ef4444' },
                                        { title: 'Battery Status', status: engineHealth?.Volt >= 12 && engineHealth?.Volt <= 14.5 ? 'Healthy' : 'Attention', color: engineHealth?.Volt >= 12 && engineHealth?.Volt <= 14.5 ? '#10b981' : '#f59e0b' },
                                        { title: 'Overall Rating', status: alerts.length === 0 ? 'Excellent' : alerts.length < 3 ? 'Good' : 'Poor', color: alerts.length === 0 ? '#10b981' : alerts.length < 3 ? '#f59e0b' : '#ef4444' }
                                    ].map((insight, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <span style={{ fontWeight: 600, color: '#475569' }}>{insight.title}</span>
                                            <span style={{
                                                padding: '6px 16px',
                                                background: `${insight.color}15`,
                                                color: insight.color,
                                                borderRadius: 8,
                                                fontWeight: 600,
                                                fontSize: '0.875rem'
                                            }}>
                                                {insight.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reports Section */}
                    {activeMenu === 'Reports' && (
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: '24px'
                            }}>
                                Vehicle Reports
                            </h2>

                            {/* Summary Report */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Daily Summary Report
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Vehicle Info</div>
                                        <div style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}><strong>Name:</strong> {vehicleDetails.carName || 'N/A'}</div>
                                        <div style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}><strong>Number:</strong> {vehicleDetails.carNumber || 'N/A'}</div>
                                        <div style={{ fontSize: '1rem', color: '#0f172a' }}><strong>Owner:</strong> {vehicleDetails.userName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Current Status</div>
                                        <div style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}><strong>Fuel:</strong> {engineHealth?.Fuel || 0}%</div>
                                        <div style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}><strong>Oil:</strong> {engineHealth?.Oil || 0}%</div>
                                        <div style={{ fontSize: '1rem', color: '#0f172a' }}><strong>Temperature:</strong> {engineHealth?.Temp || 0}°C</div>
                                    </div>
                                </div>
                            </div>

                            {/* Alert History */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Recent Alerts
                                </h3>
                                {alerts.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {alerts.map((alert, i) => (
                                            <div key={i} style={{
                                                padding: '16px',
                                                background: '#fef2f2',
                                                border: '1px solid #fecaca',
                                                borderRadius: 12,
                                                color: '#dc2626',
                                                fontSize: '0.95rem',
                                                fontWeight: 500
                                            }}>
                                                {alert}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '32px',
                                        textAlign: 'center',
                                        color: '#10b981',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        background: '#f0fdf4',
                                        borderRadius: 12,
                                        border: '1px solid #bbf7d0'
                                    }}>
                                        No alerts - All systems normal
                                    </div>
                                )}
                            </div>

                            {/* Maintenance Log */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Maintenance Recommendations
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {suggestions.map((suggestion, i) => (
                                        <div key={i} style={{
                                            padding: '16px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            color: '#475569',
                                            fontSize: '0.95rem',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service Check Section */}
                    {activeMenu === 'Service Check' && (
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: '24px'
                            }}>
                                Service Check & Diagnostics
                            </h2>

                            {/* Health Score */}
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 16,
                                padding: '40px',
                                marginBottom: '24px',
                                textAlign: 'center',
                                color: '#fff'
                            }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', opacity: 0.9 }}>
                                    VEHICLE HEALTH SCORE
                                </div>
                                <div style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '8px' }}>
                                    {alerts.length === 0 ? '95' : alerts.length < 3 ? '70' : '45'}
                                </div>
                                <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                                    {alerts.length === 0 ? 'Excellent Condition' : alerts.length < 3 ? 'Minor Issues' : 'Needs Attention'}
                                </div>
                            </div>

                            {/* Component Status */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Component Status
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    {[
                                        { name: 'Engine', status: engineHealth?.Temp < 90 ? 'Healthy' : 'Warning' },
                                        { name: 'Fuel System', status: engineHealth?.Fuel > 20 ? 'Normal' : 'Low' },
                                        { name: 'Oil System', status: engineHealth?.Oil > 30 ? 'Good' : 'Critical' },
                                        { name: 'Battery', status: engineHealth?.Volt >= 12 && engineHealth?.Volt <= 14.5 ? 'Charged' : 'Check' },
                                        { name: 'Cooling', status: engineHealth?.Water > 40 ? 'Optimal' : 'Low' },
                                        { name: 'Sensors', status: engineHealth ? 'Active' : 'Offline' }
                                    ].map((component, i) => (
                                        <div key={i} style={{
                                            padding: '20px',
                                            background: '#f8fafc',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontWeight: 600, color: '#475569' }}>{component.name}</span>
                                            </div>
                                            <span style={{
                                                padding: '6px 12px',
                                                background: component.status === 'Critical' || component.status === 'Warning' || component.status === 'Low' || component.status === 'Check' ? '#fef2f2' : '#f0fdf4',
                                                color: component.status === 'Critical' || component.status === 'Warning' || component.status === 'Low' || component.status === 'Check' ? '#ef4444' : '#10b981',
                                                borderRadius: 8,
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}>
                                                {component.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Service Schedule */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                marginBottom: '24px'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Recommended Services
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { service: 'Oil Change', due: engineHealth?.Oil < 30 ? 'URGENT' : 'Soon', priority: engineHealth?.Oil < 30 ? 'high' : 'medium' },
                                        { service: 'Coolant Check', due: engineHealth?.Water < 40 ? 'URGENT' : 'Normal', priority: engineHealth?.Water < 40 ? 'high' : 'low' },
                                        { service: 'Battery Test', due: engineHealth?.Volt < 12 ? 'URGENT' : 'Scheduled', priority: engineHealth?.Volt < 12 ? 'high' : 'low' },
                                        { service: 'General Inspection', due: 'Monthly', priority: 'low' }
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            padding: '20px',
                                            background: item.priority === 'high' ? '#fef2f2' : '#f8fafc',
                                            border: `1px solid ${item.priority === 'high' ? '#fecaca' : '#e2e8f0'}`,
                                            borderRadius: 12,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{item.service}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Due: {item.due}</div>
                                            </div>
                                            <button
                                                onClick={() => handleScheduleService(item.service, item.priority)}
                                                style={{
                                                    padding: '8px 20px',
                                                    background: item.priority === 'high' ? '#ef4444' : '#3b82f6',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                                Schedule
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Diagnostic Tools */}
                            <div style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
                                    Quick Diagnostics
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    <button onClick={handleSystemCheck} style={{
                                        padding: '20px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        transition: 'transform 0.2s'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                        Run System Check
                                    </button>
                                    <button onClick={handleExportReport} style={{
                                        padding: '20px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        transition: 'transform 0.2s'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                        Export Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Diagnostic Results Modal */}
                {showDiagnosticModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: 20,
                            padding: '40px',
                            maxWidth: '800px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setShowDiagnosticModal(false)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e2e8f0';
                                    e.currentTarget.style.color = '#0f172a';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f1f5f9';
                                    e.currentTarget.style.color = '#64748b';
                                }}
                            >
                                ×
                            </button>

                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: '8px'
                            }}>
                                System Diagnostic Results
                            </h2>
                            <p style={{
                                color: '#64748b',
                                fontSize: '0.95rem',
                                marginBottom: '32px'
                            }}>
                                Complete vehicle system analysis
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {diagnosticResults.map((result, index) => (
                                    <div key={index} style={{
                                        padding: '20px',
                                        background: '#f8fafc',
                                        borderRadius: 12,
                                        border: `2px solid ${result.color}20`,
                                        borderLeft: `4px solid ${result.color}`
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <span style={{
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                fontSize: '1.05rem'
                                            }}>
                                                {result.system}
                                            </span>
                                            <span style={{
                                                padding: '6px 16px',
                                                background: `${result.color}15`,
                                                color: result.color,
                                                borderRadius: 8,
                                                fontWeight: 600,
                                                fontSize: '0.85rem'
                                            }}>
                                                {result.status}
                                            </span>
                                        </div>
                                        <p style={{
                                            color: '#475569',
                                            fontSize: '0.95rem',
                                            margin: 0
                                        }}>
                                            {result.message}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                marginTop: '32px',
                                padding: '20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 12,
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    color: '#fff',
                                    fontSize: '1.1rem',
                                    fontWeight: 600
                                }}>
                                    Overall System Health: {diagnosticResults.filter(r => r.status === 'OK').length}/{diagnosticResults.length} Systems OK
                                </div>
                            </div>

                            <button
                                onClick={() => setShowDiagnosticModal(false)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    marginTop: '24px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Schedule Service Modal */}
                {showScheduleModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: 20,
                            padding: '40px',
                            maxWidth: '500px',
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e2e8f0';
                                    e.currentTarget.style.color = '#0f172a';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f1f5f9';
                                    e.currentTarget.style.color = '#64748b';
                                }}
                            >
                                ×
                            </button>

                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: '8px'
                            }}>
                                Schedule Service
                            </h2>
                            <p style={{
                                color: '#64748b',
                                fontSize: '0.95rem',
                                marginBottom: '32px'
                            }}>
                                Book an appointment for <strong>{selectedService?.name}</strong>
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Date Input */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#475569',
                                        marginBottom: '8px'
                                    }}>
                                        Preferred Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={scheduleForm.date}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 10,
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                    />
                                </div>

                                {/* Time Input */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#475569',
                                        marginBottom: '8px'
                                    }}>
                                        Preferred Time *
                                    </label>
                                    <input
                                        type="time"
                                        value={scheduleForm.time}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 10,
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                    />
                                </div>

                                {/* Notes Input */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#475569',
                                        marginBottom: '8px'
                                    }}>
                                        Additional Notes (Optional)
                                    </label>
                                    <textarea
                                        value={scheduleForm.notes}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                                        placeholder="Any specific concerns or requirements..."
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 10,
                                            fontSize: '1rem',
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                    />
                                </div>

                                {/* Alert for urgent services */}
                                {selectedService?.priority === 'high' && (
                                    <div style={{
                                        padding: '12px 16px',
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: 500 }}>
                                            This is an urgent service. Please schedule as soon as possible.
                                        </span>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                    <button
                                        onClick={() => setShowScheduleModal(false)}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            background: '#fff',
                                            color: '#64748b',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 10,
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#fff';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleScheduleSubmit}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            background: selectedService?.priority === 'high' ? '#ef4444' : '#3b82f6',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 10,
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = selectedService?.priority === 'high' ? '#dc2626' : '#2563eb';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = selectedService?.priority === 'high' ? '#ef4444' : '#3b82f6';
                                        }}
                                    >
                                        Confirm Appointment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
