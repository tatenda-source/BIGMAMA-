import React from 'react';
import { Camera, Upload } from 'lucide-react';

const MediaDropzone = ({ onUpload }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ fontSize: '13px', color: '#a0a0a0', fontWeight: 500 }}>Evidence (Photo/Video)</label>
      <div 
        style={{ 
          height: '120px', 
          border: '2px dashed rgba(255,255,255,0.1)', 
          borderRadius: '16px', 
          display: 'grid', 
          placeItems: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => e.currentTarget.style.borderColor = '#00f2ff'}
        onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
      >
        <div style={{ textAlign: 'center' }}>
          <Upload size={24} color="#a0a0a0" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '12px', color: '#a0a0a0' }}>Tap to upload or drag & drop</p>
        </div>
      </div>
    </div>
  );
};

export default MediaDropzone;
