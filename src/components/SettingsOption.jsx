import React from 'react';

const SettingsOption = ({ icon: Icon, title, description, color, action, active, onToggle }) => {
  return (
    <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: active ? `${color}1a` : 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}>
          <Icon size={20} color={active ? color : '#a0a0a0'} />
        </div>
        <div>
          <p style={{ fontWeight: 600 }}>{title}</p>
          <p style={{ fontSize: '13px', color: '#a0a0a0' }}>{description}</p>
        </div>
      </div>
      {onToggle ? (
        <button 
          onClick={onToggle}
          style={{ width: '50px', height: '26px', background: active ? '#00f2ff' : 'rgba(255,255,255,0.2)', borderRadius: '13px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
        >
          <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', left: active ? '26px' : '4px', top: '3px', transition: 'all 0.3s' }} />
        </button>
      ) : (
        <button style={{ background: action === 'Execute' ? 'transparent' : '#00f2ff', border: action === 'Execute' ? '1px solid #ff007a' : 'none', color: action === 'Execute' ? '#ff007a' : 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          {action}
        </button>
      )}
    </div>
  );
};

export default SettingsOption;
