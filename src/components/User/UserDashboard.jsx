import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import Monitoring from './Monitoring';
import Analytics from './Analytics';
import ServiceCheck from './ServiceCheck';

import './UserDashboard.css';

const thresholds = {
    Fuel: { low: 20, high: 95 },
    Oil: { low: 30, high: 95 },
    Voltage: { low: 12, high: 14.5 },
    Temp: { low: 0, high: 90 },
    Humidity: { low: 20, high: 80 },
    Water: { low: 30, high: 95 },
    Vibration: { low: 0, high: 50 }
};

const UserDashboard = () => {
    const navigate = useNavigate();
    const [engineHealth, setEngineHealth] = useState(null);
    const [vehicleDetails, setVehicleDetails] = useState({
        carName: '',
        userName: '',
        phoneNumber: '',
        carNumber: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [prevAlerts, setPrevAlerts] = useState([]);

    useEffect(() => {
        const engineHealthRef = ref(db, 'Engine_Health');
        const unsubscribe = onValue(engineHealthRef, (snapshot) => {
            const data = snapshot.val();
            setEngineHealth(data);

            // Generate alerts and suggestions based on engine health data
            if (data) {
                const newAlerts = [];
                const newSuggestions = [];

                // Check Fuel Level - LOW
                if (data.Fuel < thresholds.Fuel.low) {
                    newAlerts.push(`⚠️ Low Fuel: ${data.Fuel}% - Refuel immediately!`);
                    newSuggestions.push(`💡 Fuel level is critically low at ${data.Fuel}%. Locate the nearest fuel station and refuel as soon as possible to avoid running out.`);
                } else if (data.Fuel >= thresholds.Fuel.low && data.Fuel < 40) {
                    newSuggestions.push(`⛽ Fuel Health: ${data.Fuel}% - Consider refueling soon for optimal range and peace of mind.`);
                } else if (data.Fuel >= 40 && data.Fuel < 60) {
                    newSuggestions.push(`⛽ Fuel Health: ${data.Fuel}% - Good level. Monitor consumption patterns for better fuel economy.`);
                } else if (data.Fuel >= 60 && data.Fuel < thresholds.Fuel.high) {
                    newSuggestions.push(`⛽ Fuel Health: ${data.Fuel}% - Excellent! Maintain smooth driving habits for best efficiency.`);
                } else if (data.Fuel >= thresholds.Fuel.high) {
                    newAlerts.push(`⚠️ High Fuel: ${data.Fuel}% - Tank nearly full, avoid overfilling!`);
                    newSuggestions.push(`💡 Fuel level is very high at ${data.Fuel}%. Avoid topping off to prevent spillage and fuel system issues.`);
                }

                // Check Oil Level - LOW & HIGH
                if (data.Oil < thresholds.Oil.low) {
                    newAlerts.push(`⚠️ Low Oil: ${data.Oil}% - Check oil level immediately!`);
                    newSuggestions.push(`💡 Oil level is critically low at ${data.Oil}%. Schedule an oil change or top up oil level immediately to prevent engine damage.`);
                } else if (data.Oil >= thresholds.Oil.low && data.Oil < 50) {
                    newSuggestions.push(`🛢️ Oil Health: ${data.Oil}% - Consider scheduling an oil change within next 1000-2000 km.`);
                } else if (data.Oil >= 50 && data.Oil < 70) {
                    newSuggestions.push(`🛢️ Oil Health: ${data.Oil}% - Good condition. Check oil quality and color during next service.`);
                } else if (data.Oil >= 70 && data.Oil < thresholds.Oil.high) {
                    newSuggestions.push(`🛢️ Oil Health: ${data.Oil}% - Excellent! Fresh oil ensures engine longevity and performance.`);
                } else if (data.Oil >= thresholds.Oil.high) {
                    newAlerts.push(`⚠️ High Oil Level: ${data.Oil}% - Oil level too high!`);
                    newSuggestions.push(`💡 Oil level is abnormally high at ${data.Oil}%. This may indicate overfilling or contamination. Have it checked by a mechanic.`);
                }

                // Check Voltage - LOW & HIGH
                if (data.Volt < thresholds.Voltage.low) {
                    newAlerts.push(`⚠️ Low Battery Voltage: ${data.Volt}V - Battery may need charging!`);
                    newSuggestions.push(`💡 Battery voltage is critically low at ${data.Volt}V. Check battery health and charging system. Battery may need replacement.`);
                } else if (data.Volt >= thresholds.Voltage.low && data.Volt < 12.5) {
                    newSuggestions.push(`🔋 Battery Health: ${data.Volt}V - Adequate charge. Check battery terminals for corrosion and clean if needed.`);
                } else if (data.Volt >= 12.5 && data.Volt < 13) {
                    newSuggestions.push(`🔋 Battery Health: ${data.Volt}V - Good condition. Battery and charging system functioning normally.`);
                } else if (data.Volt >= 13 && data.Volt < thresholds.Voltage.high) {
                    newSuggestions.push(`🔋 Battery Health: ${data.Volt}V - Excellent! Alternator charging system working perfectly.`);
                } else if (data.Volt >= thresholds.Voltage.high) {
                    newAlerts.push(`⚠️ High Battery Voltage: ${data.Volt}V - Charging system issue!`);
                    newSuggestions.push(`💡 Battery voltage is too high at ${data.Volt}V. This may indicate alternator overcharging. Have the charging system inspected immediately.`);
                }

                // Check Temperature - LOW & HIGH
                if (data.Temp < thresholds.Temp.low) {
                    newAlerts.push(`❄️ Very Low Temperature: ${data.Temp}°C - Engine extremely cold!`);
                    newSuggestions.push(`💡 Engine temperature is extremely low at ${data.Temp}°C. Allow engine to warm up properly before driving. Check thermostat if issue persists.`);
                } else if (data.Temp >= thresholds.Temp.low && data.Temp < 70) {
                    newSuggestions.push(`🌡️ Temperature Health: ${data.Temp}°C - Engine warming up. Avoid high RPMs until engine reaches optimal temperature.`);
                } else if (data.Temp >= 70 && data.Temp < thresholds.Temp.high) {
                    newSuggestions.push(`🌡️ Temperature Health: ${data.Temp}°C - Normal operating range. Ensure coolant level is topped up regularly.`);
                } else if (data.Temp >= thresholds.Temp.high) {
                    newAlerts.push(`🔥 High Temperature: ${data.Temp}°C - Engine overheating!`);
                    newSuggestions.push(`💡 Engine temperature is dangerously high at ${data.Temp}°C. Stop vehicle safely immediately, let engine cool down, and check coolant level. Do not continue driving.`);
                }

                // Check Humidity - LOW & HIGH
                if (data.Humidity !== undefined) {
                    if (data.Humidity < thresholds.Humidity.low) {
                        newAlerts.push(`⚠️ Low Humidity: ${data.Humidity}% - Very dry conditions!`);
                        newSuggestions.push(`💡 Humidity is very low at ${data.Humidity}%. This can affect cabin comfort and increase static electricity. Consider using cabin moisture control.`);
                    } else if (data.Humidity >= thresholds.Humidity.high) {
                        newAlerts.push(`⚠️ High Humidity: ${data.Humidity}% - Very humid conditions!`);
                        newSuggestions.push(`💡 Humidity is very high at ${data.Humidity}%. Use AC dehumidifier mode to prevent window fogging and improve comfort. Check for water leaks.`);
                    }
                }

                // Check Vibration levels (MPU) - HIGH
                if (data.MPU) {
                    const vibrationX = Math.abs(data.MPU.X || 0);
                    const vibrationY = Math.abs(data.MPU.Y || 0);
                    const vibrationZ = Math.abs(data.MPU.Z || 0);

                    if (vibrationX > thresholds.Vibration.high || vibrationY > thresholds.Vibration.high || vibrationZ > thresholds.Vibration.high) {
                        newAlerts.push(`⚠️ High Vibration Detected - Check vehicle balance!`);
                        newSuggestions.push(`💡 Abnormal vibration detected (X: ${vibrationX}, Y: ${vibrationY}, Z: ${vibrationZ}). Check wheel alignment, tire pressure, and suspension system immediately.`);
                    } else if (vibrationX > 30 || vibrationY > 30 || vibrationZ > 30) {
                        newSuggestions.push(`📊 Vibration Health: Moderate levels (X:${vibrationX}, Y:${vibrationY}, Z:${vibrationZ}). Check tire pressure and balance for smoother ride.`);
                    } else {
                        newSuggestions.push(`📊 Vibration Health: Normal levels (X:${vibrationX}, Y:${vibrationY}, Z:${vibrationZ}). Vehicle running smoothly - excellent!`);
                    }
                }

                // Check Water Level - LOW & HIGH
                if (data.Water !== undefined) {
                    if (data.Water < thresholds.Water.low) {
                        newAlerts.push(`💧 Low Water Level: ${data.Water}% - Check coolant immediately!`);
                        newSuggestions.push(`💡 Coolant/Water level is critically low at ${data.Water}%. Top up with appropriate coolant mixture immediately to prevent overheating.`);
                    } else if (data.Water >= thresholds.Water.low && data.Water < 50) {
                        newSuggestions.push(`💧 Coolant Health: ${data.Water}% - Consider topping up coolant reservoir to prevent future issues.`);
                    } else if (data.Water >= 50 && data.Water < 70) {
                        newSuggestions.push(`💧 Coolant Health: ${data.Water}% - Good level. Inspect hoses and check for any leaks during next service.`);
                    } else if (data.Water >= 70 && data.Water < thresholds.Water.high) {
                        newSuggestions.push(`💧 Coolant Health: ${data.Water}% - Excellent! Cooling system is well maintained and optimal.`);
                    } else if (data.Water >= thresholds.Water.high) {
                        newAlerts.push(`⚠️ High Water Level: ${data.Water}% - Coolant overfilled!`);
                        newSuggestions.push(`💡 Coolant level is too high at ${data.Water}%. Overfilling can cause pressure buildup. Have it checked and adjusted to proper level.`);
                    }
                }

                // Overall health status and preventive maintenance
                if (newAlerts.length === 0) {
                    newSuggestions.push(`✅ Overall Vehicle Health: EXCELLENT! All systems are operating within optimal parameters.`);
                    newSuggestions.push(`🔧 Preventive Maintenance: Schedule regular service every 10,000 km or 6 months for continued reliability.`);
                    newSuggestions.push(`🚗 Driving Tips: Smooth acceleration and gentle braking can extend vehicle lifespan by up to 20%.`);
                    newSuggestions.push(`📅 Regular Inspection Schedule: Check tire pressure weekly, all fluids monthly, and air/oil filters quarterly.`);
                    newSuggestions.push(`🌍 Eco-Friendly Tip: Maintaining proper tire pressure improves fuel efficiency by 3-5%.`);
                }

                setAlerts(newAlerts);
                setSuggestions(newSuggestions);
            }
        });
        return () => unsubscribe();
    }, [prevAlerts]);

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

    return (
        <div style={{ width: '100%', padding: '2rem', minHeight: '100vh', background: '#f8f9fc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a2a36', margin: 0 }}>🚗 Vehicle Monitoring Dashboard</h1>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Logout button clicked!');
                        handleLogout();
                    }}
                    type="button"
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
                >
                    🚪 Logout
                </button>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 20, boxShadow: '0 8px 32px rgba(102,126,234,0.3)', padding: '24px 32px', marginBottom: 24, border: '2px solid rgba(255,255,255,0.3)' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 16, textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>🚨 Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.map((alert, index) => (
                            <div key={index} style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '1rem', fontWeight: 500, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                {alert}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions Section */}
            {suggestions.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: 20, boxShadow: '0 8px 32px rgba(79,70,229,0.3)', padding: '24px 32px', marginBottom: 24, border: '2px solid rgba(255,255,255,0.3)' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: 16, textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>💡 Health Suggestions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {suggestions.map((suggestion, index) => (
                            <div key={index} style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '1rem', fontWeight: 500, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                {suggestion}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vehicle Details Card */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: '32px', marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>📝 Vehicle Details</h3>
                    <button
                        onClick={handleEditClick}
                        style={{
                            background: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {isEditing ? '✔️ Save' : '✏️ Edit'}
                    </button>
                </div>

                {vehicleDetails.lastUpdated && (
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        padding: '10px 16px',
                        borderRadius: 10,
                        marginBottom: 20,
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                        <span>🕐</span>
                        <span>Last Updated: {new Date(vehicleDetails.lastUpdated).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                )}

                {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500, fontSize: '0.95rem' }}>🚗 Car Name</label>
                            <input
                                type="text"
                                name="carName"
                                value={vehicleDetails.carName}
                                onChange={handleInputChange}
                                placeholder="Enter car name"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500, fontSize: '0.95rem' }}>👤 User Name</label>
                            <input
                                type="text"
                                name="userName"
                                value={vehicleDetails.userName}
                                onChange={handleInputChange}
                                placeholder="Enter user name"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500, fontSize: '0.95rem' }}>📞 Phone Number</label>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={vehicleDetails.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="Enter phone number"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500, fontSize: '0.95rem' }}>🔢 Car Number</label>
                            <input
                                type="text"
                                name="carNumber"
                                value={vehicleDetails.carNumber}
                                onChange={handleInputChange}
                                placeholder="Enter car number"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500 }}>🚗 Car Name</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{vehicleDetails.carName || 'Not Set'}</div>
                        </div>
                        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500 }}>👤 User Name</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{vehicleDetails.userName || 'Not Set'}</div>
                        </div>
                        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500 }}>📞 Phone Number</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{vehicleDetails.phoneNumber || 'Not Set'}</div>
                        </div>
                        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: 500 }}>🔢 Car Number</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{vehicleDetails.carNumber || 'Not Set'}</div>
                        </div>
                    </div>
                )}
            </div>

            <Monitoring vehicleDetails={vehicleDetails} />
            <Analytics vehicleDetails={vehicleDetails} />
            <ServiceCheck />
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '24px', marginTop: '24px' }}>
                <h3 style={{ marginBottom: 20, fontSize: '1.3rem', fontWeight: 600, color: '#2563eb', borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>📍 Location</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: 16 }}>
                    <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: 8, borderLeft: '4px solid #0284c7' }}>
                        <div style={{ fontSize: '0.875rem', color: '#0c4a6e', marginBottom: 4 }}>Latitude</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#075985' }}>17.385044</div>
                    </div>
                    <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: 8, borderLeft: '4px solid #0284c7' }}>
                        <div style={{ fontSize: '0.875rem', color: '#0c4a6e', marginBottom: 4 }}>Longitude</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#075985' }}>78.486671</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
