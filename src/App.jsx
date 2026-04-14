import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Activity, 
  Map as MapIcon, 
  Search, 
  FileText,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Card from './components/Card';
import FeedItem from './components/FeedItem';
import HotspotMap from './components/HotspotMap';
import ReportForm from './components/ReportForm';
import AuthorityDashboard from './components/AuthorityDashboard';
import CommunityHub from './components/CommunityHub';
import SettingsView from './components/SettingsView';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);

  return (
    <div 
      className="app-container" 
      style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: '#050505', 
        color: 'white',
        '--glass-blur': lowDataMode ? '0px' : '20px',
        '--transition-speed': lowDataMode ? '0s' : '0.3s'
      }}
    >
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setShowReportModal={setShowReportModal}
      />

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Header setShowReportModal={setShowReportModal} />

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
                    <div style={{ background: '#ff007a1a', border: '1px solid #ff007a33', padding: '12px', borderRadius: '12px', color: '#ff007a', fontSize: '13px' }}>
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
                  <Card title="Education Hub" subtitle="Latest guides" icon={FileText} color="#00ffaa">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <div style={{ fontSize: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle color="#00ffaa" size={14} /> Legal Acquisition Process
                       </div>
                       <div style={{ fontSize: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle color="#ffaa00" size={14} /> Common Land Scams 2026
                       </div>
                    </div>
                  </Card>
                </div>

                <div className="glass-card" style={{ padding: '32px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 className="font-display">Live Incident Feed</h3>
                      <button 
                        onClick={() => setActiveTab('map')}
                        style={{ background: 'transparent', border: 'none', color: '#00f2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        View Map <ChevronRight size={16} />
                      </button>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[1, 2, 3].map((item) => (
                        <FeedItem 
                          key={item}
                          id={item}
                          title={`Illegal Stand Sale #ZR-${1000 + item}`}
                          time={`${item} hours ago`}
                          description={`Evidence suggests fraudulent documents being shared for Plot ${22 + item} in Borrowdale East.`}
                          tags={[
                            { label: 'Urgent', color: '#ff007a' },
                            { label: 'Unverified', color: '#7000ff' }
                          ]}
                        />
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <HotspotMap />
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 className="font-display" style={{ marginBottom: '16px' }}>Regional Statistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {[
                      { label: 'Total Area Scanned', val: '4,280 ha', color: '#00f2ff' },
                      { label: 'Active Hotspots', val: '12', color: '#ff007a' },
                      { label: 'Resolved Cases', val: '86', color: '#7000ff' },
                      { label: 'Verification rate', val: '92%', color: '#00ffaa' }
                    ].map(s => (
                      <div key={s.label}>
                        <p style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '4px' }}>{s.label}</p>
                        <p style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verify' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="glass-card" style={{ padding: '40px', background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.05), rgba(0,0,0,0))' }}>
                     <h3 className="font-display" style={{ fontSize: '24px', marginBottom: '8px' }}>Land Verification Tool</h3>
                     <p style={{ color: '#a0a0a0', marginBottom: '24px' }}>Enter property details to check legitimacy status against state records.</p>
                     <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="text" placeholder="Enter Stand Number / Property ID..." style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }} />
                        <button className="btn-primary" style={{ padding: '0 32px' }}>Verify Property</button>
                     </div>
                  </div>

                  <div className="glass-card" style={{ padding: '32px' }}>
                     <h4 className="font-display" style={{ marginBottom: '20px' }}>Recent Search Results</h4>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {[
                          { id: 'ST-2931', status: 'LEGITIMATE', owner: 'State Land', color: '#00ffaa' },
                          { id: 'ST-1102', status: 'FRAUDULENT', owner: 'Unknown', color: '#ff007a' },
                          { id: 'ST-4492', status: 'DISPUTED', owner: 'Joint Venture', color: '#ffaa00' }
                        ].map(res => (
                          <div key={res.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#a0a0a0' }}>ID: {res.id}</span>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: res.color }}>{res.status}</span>
                             </div>
                             <p style={{ fontWeight: 600 }}>{res.owner}</p>
                             <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: '#a0a0a0' }}>Checked 10m ago</span>
                                <ExternalLink size={14} color="#a0a0a0" />
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'authority' && (
              <AuthorityDashboard />
            )}

            {activeTab === 'community' && (
              <CommunityHub />
            )}

            {activeTab === 'settings' && (
              <SettingsView lowDataMode={lowDataMode} setLowDataMode={setLowDataMode} />
            )}

            {!['dashboard', 'map', 'verify', 'authority', 'community', 'settings'].includes(activeTab) && (
              <div className="glass-card" style={{ padding: '80px', textAlign: 'center' }}>
                <h3 className="font-display" style={{ fontSize: '24px', marginBottom: '16px' }}>Module Under Construction</h3>
                <p style={{ color: '#a0a0a0' }}>We are currently building the {activeTab} feature to the highest standards.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modal Overlay */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                position: 'fixed', 
                inset: 0, 
                background: 'rgba(0,0,0,0.8)', 
                backdropFilter: 'blur(8px)',
                zIndex: 100,
                display: 'grid',
                placeItems: 'center',
                padding: '20px'
              }}
            >
              <ReportForm onClose={() => setShowReportModal(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
