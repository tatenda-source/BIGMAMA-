import React from 'react';

const FormInput = ({ label, type = 'text', placeholder, value, onChange, textarea = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '13px', color: '#a0a0a0', fontWeight: 500 }}>{label}</label>
    {textarea ? (
      <textarea 
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none', minHeight: '100px', resize: 'none' }}
      />
    ) : (
      <input 
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
      />
    )}
  </div>
);

export default FormInput;
