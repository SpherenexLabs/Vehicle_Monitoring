import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = ({ vehicleDetails }) => {
    const [data, setData] = useState([]);
    const [latest, setLatest] = useState({
        temp: 0,
        humidity: 0,
        fuel: 0,
        oil: 0,
        voltage: 0,
        vibration_x: 0,
        vibration_y: 0,
        vibration_z: 0
    });

    useEffect(() => {
        const engineHealthRef = ref(db, 'Engine_Health');
        const unsubscribe = onValue(engineHealthRef, (snapshot) => {
            const healthData = snapshot.val();
            if (healthData) {
                const newData = {
                    time: new Date().toLocaleTimeString(),
                    vibration_x: healthData.MPU?.X || 0,
                    vibration_y: healthData.MPU?.Y || 0,
                    vibration_z: healthData.MPU?.Z || 0,
                    temp: healthData.Temp || 0,
                    humidity: healthData.Humidity || 0,
                    fuel: healthData.Fuel || 0,
                    oil: healthData.Oil || 0,
                    voltage: healthData.Volt || 0
                };
                setData((prev) => [...prev.slice(-19), newData]);
                setLatest(newData);
            }
        });
        return () => unsubscribe();
    }, []);

    const gradientCardStyle = {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 24,
        padding: '32px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        marginBottom: 32,
        border: '2px solid rgba(255, 255, 255, 0.3)'
    };

    const whiteCardStyle = {
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
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    };

    const badgeStyle = {
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: 12,
        fontSize: '0.9rem',
        fontWeight: 600,
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
    };

    const valueCardStyle = {
        background: 'rgba(255,255,255,0.25)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        textAlign: 'center',
        overflow: 'hidden'
    };

    return (
        <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a2a36', marginBottom: 24 }}>
                📊 Data Analytics
            </h2>

            {/* Live Metrics */}
            <div style={gradientCardStyle}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 24, textShadow: '1px 1px 2px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>📈 Live Metrics</span>
                    <span style={badgeStyle}>{vehicleDetails.userName || 'User'} • {vehicleDetails.phoneNumber || 'N/A'}</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>🌡️ Temperature</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.temp}°C</div>
                    </div>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>💧 Humidity</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.humidity}%</div>
                    </div>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>⛽ Fuel</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.fuel}%</div>
                    </div>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>🛢️ Oil</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.oil}%</div>
                    </div>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>🔋 Voltage</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.voltage}V</div>
                    </div>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>📊 Vib X</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.vibration_x}</div>
                    </div>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>📊 Vib Y</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.vibration_y}</div>
                    </div>
                    <div style={valueCardStyle}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>📊 Vib Z</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{latest.vibration_z}</div>
                    </div>
                </div>
            </div>

            {/* Combined Trends */}
            <div style={whiteCardStyle}>
                <h3 style={headerStyle}>
                    <span>📈 Combined Trends</span>
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="vibration_x" stroke="#667eea" strokeWidth={2} dot={false} name="Vib X" />
                        <Line type="monotone" dataKey="vibration_y" stroke="#764ba2" strokeWidth={2} dot={false} name="Vib Y" />
                        <Line type="monotone" dataKey="vibration_z" stroke="#9333ea" strokeWidth={2} dot={false} name="Vib Z" />
                        <Line type="monotone" dataKey="temp" stroke="#c026d3" strokeWidth={2} dot={false} name="Temp" />
                        <Line type="monotone" dataKey="humidity" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Humidity" />
                        <Line type="monotone" dataKey="fuel" stroke="#a855f7" strokeWidth={2} dot={false} name="Fuel" />
                        <Line type="monotone" dataKey="oil" stroke="#7c3aed" strokeWidth={2} dot={false} name="Oil" />
                        <Line type="monotone" dataKey="voltage" stroke="#6366f1" strokeWidth={2} dot={false} name="Voltage" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Analytics;
