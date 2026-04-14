import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  MapPin, 
  Send, 
  ShieldCheck, 
  EyeOff, 
  X,
  Upload,
  Info
} from 'lucide-react';
import FormHeader from './FormHeader';
import FormInput from './FormInput';
import AnonymityToggle from './AnonymityToggle';

const ReportForm = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'illegal-sale',
    media: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submission
    alert("Report submitted successfully! Case ID: ZR-8291");
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
      style={{ 
        width: '100%', 
        maxWidth: '600px', 
        padding: '32px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
    >
      <FormHeader onClose={onClose} />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '14px', color: '#a0a0a0' }}>Description</label>
          <textarea 
            rows="4" 
            placeholder="Describe the incident in detail..." 
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none', resize: 'none' }}
          />
        </div>

        {/* Media Upload Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '14px', color: '#a0a0a0' }}>Evidence (Photos/Videos)</label>
          <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
            <Upload size={32} color="#a0a0a0" style={{ marginBottom: '8px' }} />
            <p style={{ color: '#a0a0a0', fontSize: '14px' }}>Click to upload or drag files here</p>
          </div>
        </div>

        {/* Anonymity Toggle */}
        <div style={{ background: 'rgba(0, 242, 255, 0.05)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(0, 242, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <AnonymityToggle 
             isAnonymous={formData.anonymous} 
             onToggle={() => setFormData({...formData, anonymous: !formData.anonymous})} 
           />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <Info size={16} color="#a0a0a0" />
          <p style={{ fontSize: '12px', color: '#a0a0a0' }}>Your data is encrypted and secure. See our Privacy Policy.</p>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '56px', fontSize: '18px' }}>
           Submit Report <Send size={20} />
        </button>
      </form>
    </motion.div>
  );
};

export default ReportForm;
