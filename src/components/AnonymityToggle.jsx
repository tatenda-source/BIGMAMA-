import React from 'react';
import { Shield } from 'lucide-react';

const AnonymityToggle = ({ isAnonymous, onToggle }) => {
  return (
    <div style={{ padding: '20px', borderRadius: '16px', background: isAnonymous ? 'rgba(0, 242, 255, 0.05)' : 'rgba(255,255,255,0.02)', border: isAnonymous ? '1px solid rgba(0, 242, 255, 0.2)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Shield size={20} color={isAnonymous ? '#00f2ff' : '#a0a0a0'} />
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: isAnonymous ? '#00f2ff' : 'white' }}>Anonymous Reporting</p>
          <p style={{ fontSize: '11px', color: '#a0a0a0' }}>Hide your identity from authorities.</p>
        </div>
      </div>
      <button 
        type="button"
        onClick={onToggle}
        style={{ width: '40px', height: '20px', background: isAnonymous ? '#00f2ff' : 'rgba(255,255,255,0.2)', borderRadius: '10px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
      >
        <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'absolute', left: isAnonymous ? '22px' : '4px', top: '3px', transition: 'all 0.3s' }} />
      </button>
    </div>
  );
};

export default AnonymityToggle;
