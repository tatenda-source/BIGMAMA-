import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  ThumbsUp, 
  Flag,
  Send,
  Plus
} from 'lucide-react';

const CommunityHub = () => {
  const petitions = [
    { id: 1, title: 'Stop Illegal Allocation in Harare West', signatures: 1240, target: 2000, prog: 62 },
    { id: 2, title: 'Petition for Transparent Land Title Registry', signatures: 5400, target: 10000, prog: 54 },
  ];

  const discussions = [
    { id: 1, user: 'John D.', text: 'Has anyone seen the clearing near Lot 22?', replies: 12, likes: 24 },
    { id: 2, user: 'Mary S.', text: 'I was scammed by a fake agent for Plot B. Beware!', replies: 45, likes: 82 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Discussion Forum */}
        <div className="glass-card" style={{ padding: '32px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="font-display">Community Discussions</h3>
              <button style={{ background: '#00f2ff1a', border: '1px solid #00f2ff33', color: '#00f2ff', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                 <Plus size={16} /> Start Topic
              </button>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {discussions.map(d => (
                <div key={d.id} style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}>
                         <Users size={20} color="#a0a0a0" />
                      </div>
                      <div>
                         <p style={{ fontWeight: 600, fontSize: '14px' }}>{d.user}</p>
                         <p style={{ fontSize: '12px', color: '#a0a0a0' }}>Active Member</p>
                      </div>
                   </div>
                   <p style={{ color: '#e0e0e0', fontSize: '15px', lineHeight: '1.5', marginBottom: '16px' }}>{d.text}</p>
                   <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', fontSize: '13px', cursor: 'pointer' }}>
                         <ThumbsUp size={16} /> {d.likes}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', fontSize: '13px', cursor: 'pointer' }}>
                         <MessageSquare size={16} /> {d.replies}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a0a0a0', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}>
                         <Share2 size={16} /> Share
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Petitions & Campaigns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div className="glass-card" style={{ padding: '24px' }}>
              <h3 className="font-display" style={{ marginBottom: '20px', fontSize: '18px' }}>Active Petitions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {petitions.map(p => (
                    <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       <p style={{ fontWeight: 600, fontSize: '14px' }}>{p.title}</p>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${p.prog}%` }}
                               style={{ height: '100%', background: 'linear-gradient(to right, #00f2ff, #7000ff)' }} 
                             />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a0a0a0' }}>
                             <span>{p.signatures.toLocaleString()} signed</span>
                             <span>{p.target.toLocaleString()} target</span>
                          </div>
                       </div>
                       <button style={{ width: '100%', background: '#ff007a1a', border: '1px solid #ff007a33', color: '#ff007a', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                          Sign Petition
                       </button>
                    </div>
                 ))}
              </div>
           </div>

           <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(112,0,255,0.1), rgba(0,242,255,0.1))' }}>
              <h3 className="font-display" style={{ marginBottom: '12px', fontSize: '18px' }}>Launch Campaign</h3>
              <p style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '20px' }}>Start a movement against illegal land activities in your area.</p>
              <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 <Flag size={18} /> New Campaign
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
