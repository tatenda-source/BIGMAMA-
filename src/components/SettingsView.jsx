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
import PrivacyStat from './PrivacyStat';
import { calculateDataSavings } from '../utils/performance';

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
            <PrivacyStat 
              label="Data optimization" 
              value={`${calculateDataSavings(28)} MB`} 
              subtext="Saved this month" 
              color="#00ffaa" 
            />
            <PrivacyStat 
              label="Incident Encryption" 
              value="AES-256" 
              subtext="Military grade protection" 
              color="#00ccff" 
            />
         </div>
      </div>
    </div>
  );
};

export default SettingsView;
