import React from 'react';
import { motion } from 'framer-motion';

const PetitionCard = ({ title, signatures, target, prog }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
       <p style={{ fontWeight: 600, fontSize: '14px' }}>{title}</p>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${prog}%` }}
               style={{ height: '100%', background: 'linear-gradient(to right, #00f2ff, #7000ff)' }} 
             />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a0a0a0' }}>
             <span>{signatures.toLocaleString()} signed</span>
             <span>{target.toLocaleString()} target</span>
          </div>
       </div>
       <button style={{ width: '100%', background: '#ff007a1a', border: '1px solid #ff007a33', color: '#ff007a', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          Sign Petition
       </button>
    </div>
  );
};

export default PetitionCard;
