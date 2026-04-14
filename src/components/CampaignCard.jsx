import React from 'react';
import { Flag } from 'lucide-react';

const CampaignCard = () => {
  return (
    <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(112,0,255,0.1), rgba(0,242,255,0.1))' }}>
       <h3 className="font-display" style={{ marginBottom: '12px', fontSize: '18px' }}>Launch Campaign</h3>
       <p style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '20px' }}>Start a movement against illegal land activities in your area.</p>
       <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Flag size={18} /> New Campaign
       </button>
    </div>
  );
};

export default CampaignCard;
