import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import Card from './Card';
import StatCard from './StatCard';

const AuthorityDashboard = () => {
  const cases = [
    { id: 'ZR-1024', location: 'Harare North', type: 'Illegal clearing', status: 'Pending', urgency: 'High' },
    { id: 'ZR-1025', location: 'Borrowdale East', type: 'Stand sale', status: 'Investigating', urgency: 'Medium' },
    { id: 'ZR-1026', location: 'Mount Pleasant', type: 'Encroachment', status: 'Resolved', urgency: 'Low' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Analytics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Total Reports', val: '1,429', icon: AlertTriangle, color: '#ff007a' },
          { label: 'Pending Action', val: '342', icon: Clock, color: '#ffaa00' },
          { label: 'Cases Resolved', val: '1,087', icon: CheckCircle2, color: '#00ffaa' },
          { label: 'Active Activists', val: '86', icon: Users, color: '#00f2ff' }
        ].map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Case Queue */}
        <div className="glass-card" style={{ padding: '32px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="font-display">Incident Management Queue</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                 <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <Filter size={14} /> Filter
                 </button>
                 <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <Download size={14} /> Export
                 </button>
              </div>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cases.map(c => (
                <div key={c.id} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 40px', alignItems: 'center', gap: '16px' }}>
                   <span style={{ fontWeight: 700, fontSize: '14px', color: '#00f2ff' }}>{c.id}</span>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{c.type}</span>
                      <span style={{ fontSize: '12px', color: '#a0a0a0' }}>{c.location}</span>
                   </div>
                   <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
                      Status: <span style={{ color: '#white', fontWeight: 600 }}>{c.status}</span>
                   </div>
                   <div style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: c.urgency === 'High' ? '#ff007a22' : '#7000ff22', color: c.urgency === 'High' ? '#ff007a' : '#7000ff', textAlign: 'center', width: 'fit-content' }}>
                      {c.urgency} Urgency
                   </div>
                   <ChevronRight size={18} color="#a0a0a0" cursor="pointer" />
                </div>
              ))}
           </div>
        </div>

        {/* Hotspot Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div className="glass-card" style={{ padding: '24px' }}>
              <h3 className="font-display" style={{ marginBottom: '16px', fontSize: '18px' }}>Activity Trends</h3>
              <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 12px' }}>
                 {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                   <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    style={{ flex: 1, background: 'linear-gradient(to top, #00f2ff, #7000ff)', borderRadius: '4px 4px 0 0' }} 
                   />
                 ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                 <span style={{ fontSize: '10px', color: '#a0a0a0' }}>MON</span>
                 <span style={{ fontSize: '10px', color: '#a0a0a0' }}>SUN</span>
              </div>
           </div>

           <div className="glass-card" style={{ padding: '24px' }}>
              <h3 className="font-display" style={{ marginBottom: '16px', fontSize: '18px' }}>Security Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#a0a0a0' }}>Data Encryption</span>
                    <span style={{ color: '#00ffaa' }}>Active</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#a0a0a0' }}>Anonymity Layer</span>
                    <span style={{ color: '#00ffaa' }}>Secure</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#a0a0a0' }}>Registry Sync</span>
                    <span style={{ color: '#ffaa00' }}>In Progress</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
