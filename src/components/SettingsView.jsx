import React from 'react';
import { 
  Shield, 
  Database, 
  Lock, 
  Eye, 
  WifiOff, 
  Bell, 
  Trash2,
  ChevronRight
} from 'lucide-react';

const SettingsView = ({ lowDataMode, setLowDataMode }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      <div className="glass-card" style={{ padding: '32px' }}>
        <h3 className="font-display" style={{ marginBottom: '24px' }}>Platform Settings</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Performance: Low Data Mode */}
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: lowDataMode ? '#ffaa001a' : 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}>
                <WifiOff size={20} color={lowDataMode ? '#ffaa00' : '#a0a0a0'} />
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Low Data Mode</p>
                <p style={{ fontSize: '13px', color: '#a0a0a0' }}>Optimized for limited internet connectivity.</p>
              </div>
            </div>
            <button 
              onClick={() => setLowDataMode(!lowDataMode)}
              style={{ width: '50px', height: '26px', background: lowDataMode ? '#00f2ff' : 'rgba(255,255,255,0.2)', borderRadius: '13px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
            >
              <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', left: lowDataMode ? '26px' : '4px', top: '3px', transition: 'all 0.3s' }} />
            </button>
          </div>

          {/* Privacy: Local Encryption */}
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#00f2ff1a', display: 'grid', placeItems: 'center' }}>
                <Lock size={20} color="#00f2ff" />
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Local Persistence Encryption</p>
                <p style={{ fontSize: '13px', color: '#a0a0a0' }}>Encrypt reports stored on this device.</p>
              </div>
            </div>
            <button style={{ background: '#00f2ff', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>Enabled</button>
          </div>

          {/* Security: Clear Records */}
          <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ff007a1a', display: 'grid', placeItems: 'center' }}>
                <Trash2 size={20} color="#ff007a" />
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Emergency Wipe</p>
                <p style={{ fontSize: '13px', color: '#a0a0a0' }}>Delete all local activity and identity traces.</p>
              </div>
            </div>
            <button style={{ background: 'transparent', border: '1px solid #ff007a', color: '#ff007a', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>Execute</button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '32px' }}>
         <h3 className="font-display" style={{ marginBottom: '24px' }}>Data & Privacy Stats</h3>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
               <p style={{ fontSize: '12px', color: '#a0a0a0' }}>Data usage (This Month)</p>
               <p style={{ fontSize: '24px', fontWeight: 700 }}>12.4 MB</p>
               <p style={{ fontSize: '11px', color: '#00ffaa' }}>↓ 45% with Low Data Mode</p>
            </div>
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
               <p style={{ fontSize: '12px', color: '#a0a0a0' }}>Incident Encryption</p>
               <p style={{ fontSize: '24px', fontWeight: 700 }}>AES-256</p>
               <p style={{ fontSize: '11px', color: '#00ccff' }}>Military grade protection</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsView;
