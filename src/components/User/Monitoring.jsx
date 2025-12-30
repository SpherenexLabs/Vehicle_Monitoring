import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Monitoring = ({ vehicleDetails }) => {
    const [data, setData] = useState([]);

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
            }
        });
        return () => unsubscribe();
    }, []);

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

    return (
        <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a2a36', marginBottom: 24, display: 'flex', alignItems: 'center' }}>
                <span style={{ width: 10, height: 10, background: '#10b981', borderRadius: '50%', marginRight: 12, animation: 'pulse 2s infinite' }}></span>
                Live Monitoring
            </h2>

            {/* Vibration X-Axis */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    📊 Vibration X-Axis
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="vibration_x" stroke="#667eea" strokeWidth={2} dot={false} name="X-Axis" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Vibration Y-Axis */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>📊 Vibration Y-Axis</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="vibration_y" stroke="#764ba2" strokeWidth={2} dot={false} name="Y-Axis" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Vibration Z-Axis */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>📊 Vibration Z-Axis</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="vibration_z" stroke="#9333ea" strokeWidth={2} dot={false} name="Z-Axis" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Temperature */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>🌡️ Temperature</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="temp" stroke="#c026d3" strokeWidth={2} dot={false} name="Temperature (°C)" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Humidity */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>💧 Humidity</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="humidity" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Humidity (%)" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Fuel Level */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>⛽ Fuel Level</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="fuel" stroke="#a855f7" strokeWidth={2} dot={false} name="Fuel (%)" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Oil Level */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>🛢️ Oil Level</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="oil" stroke="#7c3aed" strokeWidth={2} dot={false} name="Oil (%)" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Voltage */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>🔋 Voltage</span>
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="voltage" stroke="#6366f1" strokeWidth={2} dot={false} name="Voltage (V)" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Combined Graph */}
            <div style={cardStyle}>
                <h3 style={headerStyle}>
                    <span>📈 All Metrics Combined</span>
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

export default Monitoring;
