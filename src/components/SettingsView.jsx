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
import SettingsOption from './SettingsOption';

const SettingsView = ({ lowDataMode, setLowDataMode }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      <div className="glass-card" style={{ padding: '32px' }}>
        <h3 className="font-display" style={{ marginBottom: '24px' }}>Platform Settings</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SettingsOption 
            icon={WifiOff} 
            title="Low Data Mode" 
            description="Optimized for limited internet connectivity." 
            color="#ffaa00" 
            active={lowDataMode} 
            onToggle={() => setLowDataMode(!lowDataMode)} 
          />
          <SettingsOption 
            icon={Lock} 
            title="Local Persistence Encryption" 
            description="Encrypt reports stored on this device." 
            color="#00f2ff" 
            active={true} 
            action="Enabled" 
          />
          <SettingsOption 
            icon={Trash2} 
            title="Emergency Wipe" 
            description="Delete all local activity and identity traces." 
            color="#ff007a" 
            action="Execute" 
          />
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
