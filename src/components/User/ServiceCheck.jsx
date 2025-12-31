import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';

const ServiceCheck = () => {
    const [serviceItems, setServiceItems] = useState([]);
    const [engineHealth, setEngineHealth] = useState(null);
    const [vibrationHistory, setVibrationHistory] = useState([]);

    useEffect(() => {
        const engineHealthRef = ref(db, 'Engine_Health');
        const unsubscribe = onValue(engineHealthRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setEngineHealth(data);

                // Track vibration history
                if (data.MPU) {
                    const vibLevel = Math.max(
                        Math.abs(data.MPU.X || 0),
                        Math.abs(data.MPU.Y || 0),
                        Math.abs(data.MPU.Z || 0)
                    );
                    setVibrationHistory(prev => [...prev.slice(-20), { value: vibLevel, time: Date.now() }]);
                }

                // Generate service recommendations
                const services = [];

                // Rule 1: Oil < 30% → Change engine oil
                if (data.Oil < 30) {
                    services.push({
                        id: 1,
                        title: ' Engine Oil Change',
                        status: data.Oil < 15 ? 'URGENT' : 'REQUIRED',
                        condition: `Oil Level: ${data.Oil}%`,
                        suggestion: 'Schedule an engine oil change immediately. Low oil can cause engine damage.',
                        priority: 1,
                        color: data.Oil < 15 ? '#ef4444' : '#f59e0b'
                    });
                } else if (data.Oil < 50) {
                    services.push({
                        id: 1,
                        title: ' Engine Oil Check',
                        status: 'RECOMMENDED',
                        condition: `Oil Level: ${data.Oil}%`,
                        suggestion: 'Consider scheduling an oil change within next 1000-2000 km.',
                        priority: 3,
                        color: '#3b82f6'
                    });
                }

                // Rule 2: High vibration for long time → Check engine mount
                const highVibCount = vibrationHistory.filter(v => v.value > 50).length;
                if (highVibCount > 10) {
                    services.push({
                        id: 2,
                        title: 'Engine Mount Inspection',
                        status: 'REQUIRED',
                        condition: 'High vibration detected for extended period',
                        suggestion: 'Check engine mounts, suspension, and wheel alignment. Prolonged vibration can damage components.',
                        priority: 1,
                        color: '#f59e0b'
                    });
                } else if (highVibCount > 5) {
                    services.push({
                        id: 2,
                        title: ' Vibration Check',
                        status: 'RECOMMENDED',
                        condition: 'Moderate vibration levels detected',
                        suggestion: 'Inspect tire balance and pressure. Check suspension system.',
                        priority: 3,
                        color: '#3b82f6'
                    });
                }

                // Rule 3: Voltage unstable → Battery check
                if (data.Volt < 12) {
                    services.push({
                        id: 3,
                        title: ' Battery Replacement',
                        status: 'URGENT',
                        condition: `Voltage: ${data.Volt}V (Critical)`,
                        suggestion: 'Battery voltage critically low. Replace battery immediately to avoid starting issues.',
                        priority: 1,
                        color: '#ef4444'
                    });
                } else if (data.Volt < 12.4) {
                    services.push({
                        id: 3,
                        title: ' Battery Check',
                        status: 'SOON',
                        condition: `Voltage: ${data.Volt}V (Low)`,
                        suggestion: 'Battery health declining. Check battery terminals, charging system, and consider replacement.',
                        priority: 2,
                        color: '#f59e0b'
                    });
                }

                // Rule 4: Fuel consumption abnormal → Engine tuning
                if (data.Fuel < 20) {
                    services.push({
                        id: 4,
                        title: ' Fuel System Check',
                        status: 'REQUIRED',
                        condition: `Fuel Level: ${data.Fuel}% (Low)`,
                        suggestion: 'Refuel immediately. Consider checking fuel system efficiency.',
                        priority: 1,
                        color: '#f59e0b'
                    });
                }

                // Rule 5: Temperature monitoring
                if (data.Temp > 90) {
                    services.push({
                        id: 5,
                        title: ' Cooling System Service',
                        status: 'URGENT',
                        condition: `Temperature: ${data.Temp}°C (High)`,
                        suggestion: 'Engine overheating! Check coolant level, radiator, and water pump immediately.',
                        priority: 1,
                        color: '#ef4444'
                    });
                } else if (data.Temp > 80) {
                    services.push({
                        id: 5,
                        title: ' Cooling System Check',
                        status: 'RECOMMENDED',
                        condition: `Temperature: ${data.Temp}°C (Warm)`,
                        suggestion: 'Monitor engine temperature. Check coolant level and thermostat.',
                        priority: 3,
                        color: '#3b82f6'
                    });
                }

                // Rule 6: General maintenance (if all good)
                if (services.length === 0) {
                    services.push({
                        id: 6,
                        title: '✅ All Systems OK',
                        status: 'HEALTHY',
                        condition: 'All parameters within normal range',
                        suggestion: 'Continue regular maintenance schedule. Next service recommended at 10,000 km.',
                        priority: 4,
                        color: '#10b981'
                    });
                    services.push({
                        id: 7,
                        title: ' Routine Maintenance',
                        status: 'SCHEDULED',
                        condition: 'Preventive maintenance',
                        suggestion: 'Schedule regular service: Check all fluids, filters, brakes, and tire pressure.',
                        priority: 4,
                        color: '#6b7280'
                    });
                }

                // Sort by priority
                services.sort((a, b) => a.priority - b.priority);
                setServiceItems(services);
            }
        });
        return () => unsubscribe();
    }, [vibrationHistory]);

    const cardStyle = {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        marginBottom: 32,
        border: '1px solid rgba(255, 255, 255, 0.3)'
    };

    const headerStyle = {
        fontSize: '1.5rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 24
    };

    const getStatusBadge = (status, color) => {
        return {
            background: color,
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: `0 4px 15px ${color}40`
        };
    };

    return (
        <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a2a36', marginBottom: 24 }}>
                 Service Check
            </h2>

            <div style={cardStyle}>
                <h3 style={headerStyle}>
                     Service Status
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {serviceItems.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                borderRadius: 16,
                                padding: '24px',
                                border: `2px solid ${item.color}20`,
                                borderLeft: `5px solid ${item.color}`,
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a2a36', margin: 0 }}>
                                    {item.title}
                                </h4>
                                <span style={getStatusBadge(item.status, item.color)}>
                                    {item.status}
                                </span>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 4 }}>
                                    <strong>Condition:</strong> {item.condition}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.7)',
                                backdropFilter: 'blur(10px)',
                                padding: '12px 16px',
                                borderRadius: 10,
                                borderLeft: `3px solid ${item.color}`,
                                fontSize: '0.95rem',
                                color: '#374151',
                                lineHeight: 1.6
                            }}>
                                <strong> Suggestion:</strong> {item.suggestion}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Service Rules Info */}
                <div style={{
                    marginTop: 32,
                    padding: '24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 16,
                    color: '#fff'
                }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                        📋 Auto Service Check Rules
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: 10 }}>
                            <strong>Oil Level:</strong> Oil &lt; 30% triggers maintenance alert
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: 10 }}>
                            <strong>Vibration:</strong> Sustained high vibration alerts mount check
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: 10 }}>
                            <strong>Battery:</strong> Voltage &lt; 12.4V triggers battery check
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: 10 }}>
                            <strong>Temperature:</strong> Temp &gt; 90°C triggers cooling system alert
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceCheck;
