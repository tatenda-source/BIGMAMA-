import { Bell } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import ActionButton from './ActionButton';

function todayStamp() {
  const d = new Date();
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const Header = ({ title = 'Recent Filings', setShowReportModal, caseCount = 0 }) => {
  return (
    <header
      style={{
        padding: '28px 40px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 24,
        borderBottom: '1px solid var(--ink)',
        background: 'var(--paper)',
      }}
    >
      <div style={{ minWidth: 0 }}>
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
          Filed {todayStamp()} · Vol. 1 · No. {String(caseCount).padStart(4, '0')}
        </p>
        <h2
          className="font-display"
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 144, "wght" 500, "SOFT" 20',
            fontSize: 'clamp(34px, 5vw, 54px)',
            lineHeight: 1.02,
            letterSpacing: '-0.025em',
            margin: 0,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Notifications"
          className="bm-icon-button"
          style={{ position: 'relative' }}
        >
          <Bell size={18} aria-hidden="true" />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              background: 'var(--stamp)',
              borderRadius: 1,
              border: '1px solid var(--paper)',
            }}
          />
        </button>
        <ActionButton icon={AlertTriangle} onClick={() => setShowReportModal?.(true)}>
          File report
        </ActionButton>
      </div>
    </header>
  );
};

export default Header;
