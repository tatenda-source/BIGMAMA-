import React from 'react';

const StatCard = ({ label, val, icon: Icon, color }) => (
  <div className="glass-card" style={{ padding: '24px' }}>
    <p style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '8px' }}>{label}</p>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span style={{ fontSize: '32px', fontWeight: 700, color: color }}>{val}</span>
      <Icon size={24} color={color} opacity={0.5} />
    </div>
  </div>
);

export default StatCard;
