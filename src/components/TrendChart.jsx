import React from 'react';
import { motion } from 'framer-motion';

const TrendChart = () => {
  return (
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
  );
};

export default TrendChart;
