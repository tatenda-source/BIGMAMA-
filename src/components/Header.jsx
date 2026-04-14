import React from 'react';
import { User, Bell } from 'lucide-react';

const Header = ({ title, user }) => {
  return (
    <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(5,5,5,0.5)', backdropFilter: 'blur(20px)' }}>
       <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 800 }}>{title}</h1>
       <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
             <Bell size={20} color="#a0a0a0" />
             <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ff007a', borderRadius: '50%', border: '2px solid #050505' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
             <div style={{ width: '24px', height: '24px', background: 'linear-gradient(45deg, #00f2ff, #7000ff)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                <User size={14} color="white" />
             </div>
             <span style={{ fontSize: '14px', fontWeight: 600 }}>{user?.name || "Citizen #829"}</span>
          </div>
       </div>
    </div>
  );
};

export default Header;
