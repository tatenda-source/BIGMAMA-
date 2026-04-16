import { X } from 'lucide-react';

const FormHeader = ({ onClose }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
      paddingBottom: 14,
      borderBottom: '1px solid var(--ink)',
    }}
  >
    <div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.28em',
          color: 'var(--granite)',
          textTransform: 'uppercase',
          margin: '0 0 6px',
        }}
      >
        Form § I — Incident Declaration
      </p>
      <h2
        className="font-display"
        style={{
          fontFamily: 'var(--font-display)',
          fontVariationSettings: '"opsz" 144, "wght" 500',
          fontSize: 32,
          lineHeight: 1.05,
          margin: 0,
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
        }}
      >
        File a report
      </h2>
      <p
        style={{
          fontStyle: 'italic',
          color: 'var(--ink-muted)',
          fontSize: 13,
          marginTop: 6,
        }}
      >
        Evidence is encrypted in this browser before it leaves your device.
      </p>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label="Close report form"
      style={{
        background: 'transparent',
        border: '1.5px solid var(--ink)',
        borderRadius: 'var(--radius-sm)',
        width: 36,
        height: 36,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        color: 'var(--ink)',
        transition: 'background var(--transition-speed), color var(--transition-speed)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--ink)';
        e.currentTarget.style.color = 'var(--paper)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--ink)';
      }}
    >
      <X size={18} aria-hidden="true" />
    </button>
  </div>
);

export default FormHeader;
