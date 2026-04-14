import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Map as MapIcon, 
  AlertTriangle, 
  Activity, 
  Search, 
  Users, 
  FileText, 
  User, 
  Settings, 
  X, 
  Menu 
} from 'lucide-react';
import { clsx } from 'clsx';

const NavItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left cursor-pointer border-none",
      active 
        ? "bg-[#00f2ff1a] text-[#00f2ff] border border-[#00f2ff33]" 
        : "bg-transparent text-[#a0a0a0] hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={20} />
    {!collapsed && <span className="font-medium">{label}</span>}
  </button>
);

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, activeTab, setActiveTab, setShowReportModal }) => {
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarOpen ? 260 : 80 }}
      className="glass-card"
      style={{ 
        height: '100vh', 
        position: 'sticky', 
        top: 0, 
        borderRadius: 0, 
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        zIndex: 50,
        background: 'rgba(10, 10, 10, 0.8)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 12px' }}>
        <div style={{ background: 'linear-gradient(135deg, #00f2ff, #7000ff)', width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Shield size={24} color="white" />
        </div>
        {isSidebarOpen && <h1 className="font-display" style={{ fontSize: '20px', fontWeight: 800 }}>BIGMAMA<span style={{ color: '#00f2ff' }}>$</span></h1>}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <NavItem icon={Activity} label="Feed" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />
        <NavItem icon={MapIcon} label="Hotspots" active={activeTab === 'map'} onClick={() => setActiveTab('map')} collapsed={!isSidebarOpen} />
        <NavItem icon={AlertTriangle} label="Report" active={activeTab === 'report'} onClick={() => setActiveTab('report')} collapsed={!isSidebarOpen} />
        <NavItem icon={Search} label="Verify" active={activeTab === 'verify'} onClick={() => setActiveTab('verify')} collapsed={!isSidebarOpen} />
        <NavItem icon={Users} label="Community" active={activeTab === 'community'} onClick={() => setActiveTab('community')} collapsed={!isSidebarOpen} />
        <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} collapsed={!isSidebarOpen} />
        
        <div style={{ margin: '20px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        
        <NavItem icon={AlertTriangle} label="Report Incident" active={false} onClick={() => setShowReportModal(true)} collapsed={!isSidebarOpen} />
        <NavItem icon={FileText} label="Authority" active={activeTab === 'authority'} onClick={() => setActiveTab('authority')} collapsed={!isSidebarOpen} />
      </nav>

      <div style={{ marginTop: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <NavItem icon={User} label="Profile" active={false} collapsed={!isSidebarOpen} />
        <NavItem icon={Settings} label="Settings" active={false} collapsed={!isSidebarOpen} />
      </div>
    </motion.aside>
  );
};

export default Sidebar;
