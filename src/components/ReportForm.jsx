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
import MediaDropzone from './MediaDropzone';
import ActionButton from './ActionButton';

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
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormInput 
              label="Incident Title" 
              placeholder="e.g. Illegal land clearing" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <FormInput 
              label="Description" 
              placeholder="Provide as much detail as possible..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              textarea
            />
            <ActionButton 
              style={{ width: '100%', marginTop: '12px' }}
              onClick={() => setStep(2)}
            >
              Next Step: Location & Media
            </ActionButton>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <label style={{ fontSize: '13px', color: '#a0a0a0' }}>Location (Automatic)</label>
               <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,242,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,242,255,0.1)' }}>
                  <MapPin size={18} color="#00f2ff" />
                  <span style={{ fontSize: '13px', color: '#00f2ff' }}>-17.8248, 31.0530 (Verified)</span>
               </div>
            </div>
            
            <MediaDropzone onUpload={() => {}} />

            <AnonymityToggle 
              isAnonymous={formData.anonymous} 
              onToggle={() => setFormData({...formData, anonymous: !formData.anonymous})} 
            />

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <Info size={16} color="#a0a0a0" />
              <p style={{ fontSize: '12px', color: '#a0a0a0' }}>Your data is encrypted and secure.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <ActionButton 
                variant="secondary" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setStep(1)}
              >
                Back
              </ActionButton>
              <ActionButton 
                type="submit" 
                style={{ flex: 2 }}
                icon={Send}
              >
                Submit Report
              </ActionButton>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default ReportForm;
