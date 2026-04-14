import React from 'react';
import { Camera, MapPin, Shield, X, AlertTriangle, Send } from 'lucide-react';

const FormHeader = ({ onClose }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
    <div>
      <h3 className="font-display" style={{ fontSize: '24px', marginBottom: '4px' }}>Report Illegal Activity</h3>
      <p style={{ color: '#a0a0a0', fontSize: '14px' }}>Submit evidence securely and anonymously.</p>
    </div>
    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'white' }}>
      <X size={20} />
    </button>
  </div>
);

export default FormHeader;
