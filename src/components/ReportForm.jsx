import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Send, Info } from 'lucide-react';
import FormHeader from './FormHeader';
import FormInput from './FormInput';
import AnonymityToggle from './AnonymityToggle';
import MediaDropzone from './MediaDropzone';
import ActionButton from './ActionButton';
import { prepareReport } from '../lib/prepare-report.js';
import { submitReport } from '../lib/submit-report.js';
import { registerAbortable } from '../lib/wipe.js';

const ENDPOINT = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE)
  ? `${import.meta.env.VITE_API_BASE}/api/reports`
  : '/api/reports';

const initialFormState = {
  title: '',
  description: '',
  location: '',
  type: 'illegal-sale',
  media: [],
  anonymous: false,
};

const ReportForm = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'delivered' | 'queued' | 'failed'
  const [caseId, setCaseId] = useState(null);

  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors({});

    const prepared = await prepareReport(formData);
    if (!prepared.ok) {
      setErrors(prepared.errors);
      setSubmitting(false);
      setStep(1);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const deregister = registerAbortable(controller);

    try {
      const result = await submitReport(prepared.ciphertext, {
        endpoint: ENDPOINT,
        abortSignal: controller.signal,
      });
      setStatus(result.status);
      setCaseId(result.caseId);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setStatus('failed');
        setErrors({ _form: 'Submission failed. You can try again.' });
      }
    } finally {
      deregister();
      setSubmitting(false);
    }
  };

  if (status === 'delivered' || status === 'queued') {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '600px', padding: '32px', textAlign: 'center' }}
      >
        <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>
          {status === 'delivered' ? 'Report received' : 'Saved — will send when online'}
        </h2>
        {caseId && (
          <p style={{ color: 'var(--color-text-dim)', marginBottom: '24px' }}>
            Case ID: <strong style={{ color: 'var(--color-text)' }}>{caseId}</strong>
          </p>
        )}
        <p style={{ color: 'var(--color-text-dim)', fontSize: '13px', marginBottom: '24px' }}>
          {status === 'delivered'
            ? 'Your encrypted report reached our edge. Thank you.'
            : 'Your report is saved locally and will submit automatically when you reconnect.'}
        </p>
        <ActionButton onClick={onClose}>Close</ActionButton>
      </motion.div>
    );
  }

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
        overflowY: 'auto',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-form-title"
    >
      <FormHeader onClose={onClose} />

      <form onSubmit={handleSubmit} className="bm-stack-md" noValidate>
        <h2 id="report-form-title" className="sr-only">File an incident report</h2>

        {step === 1 && (
          <div className="bm-stack-md">
            <FormInput
              label="Incident Title"
              placeholder="e.g. Illegal land clearing"
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              error={errors.title}
              required
              maxLength={140}
              autoComplete="off"
            />
            <FormInput
              label="Description"
              placeholder="Provide as much detail as possible..."
              value={formData.description}
              onChange={(e) => setField('description', e.target.value)}
              error={errors.description}
              required
              maxLength={5000}
              textarea
              autoComplete="off"
            />
            <ActionButton
              style={{ width: '100%', marginTop: '12px' }}
              onClick={() => setStep(2)}
              disabled={!formData.title || !formData.description}
            >
              Next Step: Location &amp; Media
            </ActionButton>
          </div>
        )}

        {step === 2 && (
          <div className="bm-stack-lg">
            <div className="bm-stack-sm">
              <span className="bm-form-label">Location (Automatic)</span>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'rgba(0,242,255,0.05)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(0,242,255,0.1)',
                }}
              >
                <MapPin size={18} color="var(--color-accent-cyan)" aria-hidden="true" />
                <span style={{ fontSize: '13px', color: 'var(--color-accent-cyan)' }}>
                  -17.8248, 31.0530 (Verified)
                </span>
              </div>
            </div>

            <MediaDropzone onUpload={() => {}} />

            <AnonymityToggle
              isAnonymous={formData.anonymous}
              onToggle={() => setField('anonymous', !formData.anonymous)}
            />

            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                padding: '12px',
                background: 'var(--color-surface-glass)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Info size={16} color="var(--color-text-dim)" aria-hidden="true" />
              <p style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
                Your report is encrypted in this browser before leaving your device.
              </p>
            </div>

            {errors._form && (
              <p role="alert" className="bm-form-error">{errors._form}</p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <ActionButton
                variant="secondary"
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Back
              </ActionButton>
              <ActionButton
                type="submit"
                style={{ flex: 2 }}
                icon={Send}
                disabled={submitting}
                aria-busy={submitting ? 'true' : undefined}
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </ActionButton>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default ReportForm;
