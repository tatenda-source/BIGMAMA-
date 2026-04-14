import React from 'react';
import { Users, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

const DiscussionPost = ({ user, text, replies, likes }) => {
  return (
    <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
       <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}>
             <Users size={20} color="#a0a0a0" />
          </div>
          <div>
             <p style={{ fontWeight: 600, fontSize: '14px' }}>{user}</p>
             <p style={{ fontSize: '12px', color: '#a0a0a0' }}>Active Member</p>
          </div>
       </div>
       <p style={{ color: '#e0e0e0', fontSize: '15px', lineHeight: '1.5', marginBottom: '16px' }}>{text}</p>
       <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', fontSize: '13px', cursor: 'pointer' }}>
             <ThumbsUp size={16} /> {likes}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', fontSize: '13px', cursor: 'pointer' }}>
             <MessageSquare size={16} /> {replies}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}>
             <Share2 size={16} /> Share
          </div>
       </div>
    </div>
  );
};

export default DiscussionPost;
