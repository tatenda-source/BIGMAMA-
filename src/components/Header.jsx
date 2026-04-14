import React from 'react';
import { Search, Bell, AlertTriangle } from 'lucide-react';

const Header = ({ setShowReportModal }) => {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
      <div>
        <h2 className="font-display" style={{ fontSize: '32px', marginBottom: '8px' }}>
          Citizen <span style={{ color: '#00f2ff' }}>Portal</span>
        </h2>
        <p style={{ color: '#a0a0a0' }}>Monitor land activities and raise your voice for accountability.</p>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0a0a0' }} size={18} />
          <input 
            type="text" 
            placeholder="Search cases, stands..." 
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 10px 10px 40px', color: 'white', outline: 'none' }}
          />
        </div>
        <button 
          onClick={() => setShowReportModal(true)}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertTriangle size={18} /> New Report
        </button>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
           <Bell size={20} />
        </div>
      </div>
    </header>
  );
};

export default Header;
