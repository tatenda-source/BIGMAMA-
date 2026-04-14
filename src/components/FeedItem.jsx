import React from 'react';
import { Map as MapIcon, Share2, ExternalLink, ChevronRight } from 'lucide-react';

const FeedItem = ({ title, time, description, tags, id }) => {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
       <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <MapIcon color="#a0a0a0" />
       </div>
       <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
             <span style={{ fontWeight: 600 }}>{title}</span>
             <span style={{ fontSize: '12px', color: '#a0a0a0' }}>{time}</span>
          </div>
          <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '8px' }}>{description}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
             {tags.map(tag => (
               <span key={tag.label} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${tag.color}22`, color: tag.color }}>
                 {tag.label}
               </span>
             ))}
          </div>
       </div>
       <div style={{ display: 'flex', gap: '12px' }}>
          <Share2 size={18} style={{ cursor: 'pointer', color: '#a0a0a0' }} />
          <ExternalLink size={18} style={{ cursor: 'pointer', color: '#a0a0a0' }} />
       </div>
    </div>
  );
};

export default FeedItem;
