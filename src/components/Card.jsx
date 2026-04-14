import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ title, subtitle, icon: Icon, color, children }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card" 
    style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Icon size={20} color={color} /> {title}
        </h3>
        <p style={{ color: '#a0a0a0', fontSize: '14px' }}>{subtitle}</p>
      </div>
      <div style={{ opacity: 0.1 }}>
        <Icon size={48} color={color} />
      </div>
    </div>
    {children}
  </motion.div>
);

export default Card;
