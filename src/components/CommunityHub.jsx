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
import DiscussionPost from './DiscussionPost';
import PetitionCard from './PetitionCard';
import ActionButton from './ActionButton';
import CampaignCard from './CampaignCard';

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
              <h2 className="font-display" style={{ fontSize: '24px' }}>Community Discussion</h2>
              <ActionButton 
                variant="primary" 
                style={{ padding: '8px 16px', fontSize: '13px' }}
                icon={Plus}
              >
                New Post
              </ActionButton>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {discussions.map(d => (
                <DiscussionPost key={d.id} {...d} />
              ))}
           </div>
        </div>

        {/* Petitions & Campaigns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div className="glass-card" style={{ padding: '24px' }}>
              <h3 className="font-display" style={{ marginBottom: '20px', fontSize: '18px' }}>Active Petitions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {petitions.map(p => (
                    <PetitionCard key={p.id} {...p} />
                 ))}
              </div>
           </div>

           <CampaignCard />
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
