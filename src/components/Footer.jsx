import React from 'react';
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '../utils/constants';

const Footer = () => {
  return (
    <footer style={{ padding: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,5,5,0.3)' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: '#00f2ff' }}>{PLATFORM_NAME}</h4>
          <p style={{ fontSize: '12px', color: '#a0a0a0' }}>{PLATFORM_TAGLINE}</p>
       </div>
       <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#a0a0a0' }}>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          <span style={{ cursor: 'pointer' }}>Citizen Rights</span>
       </div>
       <div style={{ fontSize: '12px', color: '#606060' }}>
          © 2026 BIGMAMA$ Initiative
       </div>
    </footer>
  );
};

export default Footer;
