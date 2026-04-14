import React from 'react';
import { Filter, Download, ChevronRight } from 'lucide-react';

const IncidentTable = ({ cases }) => {
  return (
    <div className="glass-card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 className="font-display">Incident Management Queue</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
           <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <Filter size={14} /> Filter
           </button>
           <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <Download size={14} /> Export
           </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {cases.map(c => (
          <div key={c.id} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 40px', alignItems: 'center', gap: '16px' }}>
             <span style={{ fontWeight: 700, fontSize: '14px', color: '#00f2ff' }}>{c.id}</span>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{c.type}</span>
                <span style={{ fontSize: '12px', color: '#a0a0a0' }}>{c.location}</span>
             </div>
             <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
                Status: <span style={{ color: '#white', fontWeight: 600 }}>{c.status}</span>
             </div>
             <div style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: c.urgency === 'High' ? '#ff007a22' : '#7000ff22', color: c.urgency === 'High' ? '#ff007a' : '#7000ff', textAlign: 'center', width: 'fit-content' }}>
                {c.urgency} Urgency
             </div>
             <ChevronRight size={18} color="#a0a0a0" cursor="pointer" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentTable;
