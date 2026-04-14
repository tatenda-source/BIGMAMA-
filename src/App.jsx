import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Map as MapIcon, 
  AlertTriangle, 
  Activity, 
  Search, 
  Menu, 
  X,
  ChevronRight,
  User,
  Settings,
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
  Share2,
  Users,
  FileText
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

const Card = ({ title, subtitle, icon: Icon, color, children }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card" 
    style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Icon size={20} color={color} /> {title}
        </h3>
        <p style={{ color: '#a0a0a0', fontSize: '14px' }}>{subtitle}</p>
      </div>
      <div style={{ opacity: 0.1 }}>
        <Icon size={48} color={color} />
      </div>
    </div>
    {children}
  </motion.div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: 'white' }}>
      {/* Sidebar */}
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
          
          <div style={{ margin: '20px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          
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

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
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
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> New Report
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
               <Bell size={20} />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  <Card title="Crisis Alert" subtitle="High intensity hotspot detected" icon={AlertTriangle} color="#ff007a">
                    <div style={{ background: '#ff007a1a', border: '1px solid #ff00733', padding: '12px', borderRadius: '12px', color: '#ff007a', fontSize: '13px' }}>
                      Large scale illegal land clearing reported in Harare North Sector.
                    </div>
                  </Card>
                  <Card title="Digital Activism" subtitle="Petition progress" icon={Activity} color="#00f2ff">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Anti-Land Baron Petition</span>
                        <span>84%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '84%', height: '100%', background: '#00f2ff' }} />
                      </div>
                    </div>
                  </Card>
                  <Card title="System Health" subtitle="Active Monitoring" icon={CheckCircle} color="#7000ff">
                     <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '24px', fontWeight: 700 }}>1,280</span>
                           <span style={{ fontSize: '12px', color: '#a0a0a0' }}>Active Reports</span>
                        </div>
                        <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '24px', fontWeight: 700 }}>42</span>
                           <span style={{ fontSize: '12px', color: '#a0a0a0' }}>Hotspots Resolved</span>
                        </div>
                     </div>
                  </Card>
                </div>

                <div className="glass-card" style={{ padding: '32px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 className="font-display">Live Incident Feed</h3>
                      <button style={{ background: 'transparent', border: 'none', color: '#00f2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View Map <ChevronRight size={16} />
                      </button>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[1, 2, 3].map((item) => (
                        <div key={item} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                           <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                              <MapIcon color="#a0a0a0" />
                           </div>
                           <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                 <span style={{ fontWeight: 600 }}>Illegal Stand Sale #ZR-{1000 + item}</span>
                                 <span style={{ fontSize: '12px', color: '#a0a0a0' }}>2 hours ago</span>
                              </div>
                              <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '8px' }}>Evidence suggests fraudulent documents being shared for Plot {22 + item} in Borrowdale East.</p>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                 <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#ff007a22', color: '#ff007a' }}>Urgent</span>
                                 <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#7000ff22', color: '#7000ff' }}>Unverified</span>
                              </div>
                           </div>
                           <div style={{ display: 'flex', gap: '12px' }}>
                              <Share2 size={18} style={{ cursor: 'pointer', color: '#a0a0a0' }} />
                              <ExternalLink size={18} style={{ cursor: 'pointer', color: '#a0a0a0' }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab !== 'dashboard' && (
              <div className="glass-card" style={{ padding: '80px', textAlign: 'center' }}>
                <h3 className="font-display" style={{ fontSize: '24px', marginBottom: '16px' }}>Module Under Construction</h3>
                <p style={{ color: '#a0a0a0' }}>We are currently building the {activeTab} feature to the highest standards.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
