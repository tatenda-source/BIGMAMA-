import React from 'react';
import { 
  Home, 
  Map as MapIcon, 
  ShieldCheck, 
  Activity, 
  Settings, 
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PLATFORM_NAME } from '../utils/constants';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'map', icon: MapIcon, label: 'Hotspot Map' },
    { id: 'verify', icon: ShieldCheck, label: 'Land Verify' },
    { id: 'community', icon: Activity, label: 'Community' },
    { id: 'authority', icon: Target, label: 'Authority' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div style={{ width: '280px', height: '100vh', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '40px', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(5,5,5,0.2)' }}>
      <div style={{ padding: '0 12px' }}>
         <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 900, background: 'linear-gradient(to right, #00f2ff, #7000ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{PLATFORM_NAME}</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ x: 4 }}
            onClick={() => setActiveTab(item.id)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              padding: '14px 20px', 
              borderRadius: '16px', 
              cursor: 'pointer',
              color: activeTab === item.id ? '#00f2ff' : '#a0a0a0',
              background: activeTab === item.id ? 'rgba(0, 242, 255, 0.05)' : 'transparent',
              transition: 'all 0.3s'
            }}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span style={{ fontWeight: activeTab === item.id ? 700 : 500, fontSize: '15px' }}>{item.label}</span>
          </motion.div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
         <p style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '8px' }}>System Status</p>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#00ffaa', borderRadius: '50%', boxShadow: '0 0 10px #00ffaa' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Secure Connection</span>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
