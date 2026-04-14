import React, { useState } from 'react';
import { Lock, WifiOff, Trash2 } from 'lucide-react';
import SettingsOption from './SettingsOption';
import PrivacyStat from './PrivacyStat';
import { calculateDataSavings } from '../utils/performance';
import { emergencyWipe } from '../lib/wipe.js';
import { wipeServiceWorker } from '../pwa/register-sw.js';

const SettingsView = ({ lowDataMode, setLowDataMode }) => {
  // Two-click confirm avoids relying on window.confirm (blocked by CSP in
  // some embeds and inconsistent across browsers).
  const [wipeState, setWipeState] = useState('idle'); // idle | confirm | wiping | done

  const handleWipe = async () => {
    if (wipeState === 'idle') {
      setWipeState('confirm');
      return;
    }
    if (wipeState !== 'confirm') return;
    setWipeState('wiping');
    await Promise.allSettled([emergencyWipe(), wipeServiceWorker()]);
    setWipeState('done');
    setTimeout(() => window.location.reload(), 400);
  };

  const wipeLabel = {
    idle: 'Execute',
    confirm: 'Confirm wipe',
    wiping: 'Wiping…',
    done: 'Wiped',
  }[wipeState];

  return (
    <div className="bm-stack-lg" style={{ maxWidth: '800px' }}>
      <section className="glass-card" style={{ padding: '32px' }} aria-labelledby="settings-heading">
        <h3 id="settings-heading" className="font-display" style={{ marginBottom: '24px' }}>
          Platform Settings
        </h3>

        <div className="bm-stack-sm">
          <SettingsOption
            icon={WifiOff}
            title="Low Data Mode"
            description="Optimized for limited internet connectivity."
            color="var(--color-accent-amber)"
            active={lowDataMode}
            onToggle={() => setLowDataMode(!lowDataMode)}
          />
          <SettingsOption
            icon={Lock}
            title="In-Browser Encryption"
            description="Reports are encrypted with AES-GCM-256 before leaving this device."
            color="var(--color-accent-cyan)"
            active={true}
            action="Active"
          />
          <SettingsOption
            icon={Trash2}
            title="Emergency Wipe"
            description="Clears local storage, caches, and service workers on this device."
            color="var(--color-accent-magenta)"
            action={wipeLabel}
            onAction={handleWipe}
          />
        </div>
      </section>

      <section
        className="glass-card"
        style={{ padding: '32px' }}
        aria-labelledby="privacy-stats-heading"
      >
        <h3 id="privacy-stats-heading" className="font-display" style={{ marginBottom: '24px' }}>
          Data &amp; Privacy
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <PrivacyStat
            label="Data optimization"
            value={`${calculateDataSavings(28)} MB`}
            subtext="Saved this month"
            color="green"
          />
          <PrivacyStat
            label="Report encryption"
            value="AES-GCM-256"
            subtext="PBKDF2-SHA256 @ 250k iters, per-report key"
            color="cyan"
          />
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
