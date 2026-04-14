import React from 'react';

const PrivacyStat = ({ label, value, subtext, color }) => {
  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
       <p style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '4px' }}>{label}</p>
       <p style={{ fontSize: '24px', fontWeight: 700 }}>{value}</p>
       <p style={{ fontSize: '11px', color: color }}>{subtext}</p>
    </div>
  );
};

export default PrivacyStat;
