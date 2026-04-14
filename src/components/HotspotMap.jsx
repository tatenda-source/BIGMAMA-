import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertCircle, CheckCircle2, Navigation } from 'lucide-react';

const HotspotMap = () => {
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const hotspots = [
    { id: 1, x: 200, y: 150, status: 'unverified', title: 'Harare North', intensity: 'high' },
    { id: 2, x: 450, y: 300, status: 'verified', title: 'Borrowdale East', intensity: 'low' },
    { id: 3, x: 300, y: 450, status: 'investigating', title: 'Mount Pleasant', intensity: 'medium' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Dynamic Grid Background */}
      <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.1 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Map Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 className="font-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={20} color="#00f2ff" /> Hotspot Visualization
          </h3>
          <p style={{ color: '#a0a0a0', fontSize: '14px' }}>Real-time spatial data of land activity reports.</p>
        </div>

        <svg viewBox="0 0 800 600" style={{ width: '100%', height: '400px' }}>
          {/* Simulated Land Parcels */}
          <path d="M100,100 L250,80 L300,200 L120,220 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          <path d="M400,150 L550,140 L580,280 L420,300 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          
          {/* Hotspots */}
          {hotspots.map((h) => (
            <motion.g 
              key={h.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => setSelectedHotspot(h)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow Effect */}
              <circle cx={h.x} cy={h.y} r="15" fill={h.status === 'unverified' ? '#ff007a' : '#00f2ff'} opacity="0.3">
                <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={h.x} cy={h.y} r="6" fill={h.status === 'unverified' ? '#ff007a' : '#00f2ff'} stroke="white" strokeWidth="2" />
            </motion.g>
          ))}
        </svg>

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff007a' }} /> Unverified Report
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2ff' }} /> Verified Case
          </div>
        </div>

        {/* Hotspot Detail Overlay */}
        {selectedHotspot && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ position: 'absolute', top: '100px', left: '40px', background: 'rgba(15,15,15,0.95)', border: '1px solid #00f2ff33', borderRadius: '16px', padding: '16px', width: '240px', backdropFilter: 'blur(10px)', zIndex: 10 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#00f2ff' }}>{selectedHotspot.status}</span>
              <button onClick={() => setSelectedHotspot(null)} style={{ background: 'transparent', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}>×</button>
            </div>
            <h4 style={{ marginBottom: '4px' }}>{selectedHotspot.title}</h4>
            <p style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '12px' }}>Reports of unauthorized construction on Lot 4B.</p>
            <button className="btn-primary" style={{ width: '100%', fontSize: '12px', padding: '8px' }}>View Details</button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HotspotMap;
