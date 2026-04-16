import { Home, Map as MapIcon, ShieldCheck, Activity, Settings, Target } from 'lucide-react';
import { PLATFORM_NAME } from '../utils/constants';

const MENU = [
  { id: 'dashboard', num: 'I',   icon: Home,        label: 'Dashboard' },
  { id: 'map',       num: 'II',  icon: MapIcon,     label: 'Hotspot Map' },
  { id: 'verify',    num: 'III', icon: ShieldCheck, label: 'Land Verify' },
  { id: 'community', num: 'IV',  icon: Activity,    label: 'Community' },
  { id: 'authority', num: 'V',   icon: Target,      label: 'Authority' },
  { id: 'settings',  num: 'VI',  icon: Settings,    label: 'Settings' },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside
      aria-label="Primary navigation"
      style={{
        width: '280px',
        minHeight: '100vh',
        padding: '36px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        borderRight: '1px solid var(--ink)',
        background: 'var(--paper-warm)',
      }}
    >
      {/* Masthead — serif wordmark with dateline */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--granite)',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Civic Dossier · Vol. 1
        </p>
        <h1
          className="font-display"
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 144, "wght" 600, "SOFT" 30',
            fontSize: 34,
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {PLATFORM_NAME}
        </h1>
        <hr className="rule-double" style={{ margin: '14px 0 0' }} />
      </div>

      {/* Table of contents */}
      <nav aria-label="Sections" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--granite)',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Table of contents
        </p>
        {MENU.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className="bm-nav-link"
              data-active={active ? 'true' : undefined}
              style={{
                all: 'unset',
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '10px 4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontVariationSettings: active
                  ? '"opsz" 24, "wght" 600'
                  : '"opsz" 24, "wght" 400',
                fontSize: 17,
                color: active ? 'var(--ink)' : 'var(--ink-muted)',
                borderBottom: '1px solid var(--color-border-subtle)',
                transition: 'color var(--transition-speed), transform var(--transition-speed)',
                transform: active ? 'translateX(4px)' : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  color: active ? 'var(--ochre-deep)' : 'var(--granite)',
                }}
              >
                § {item.num}
              </span>
              <span style={{ letterSpacing: '-0.01em' }}>{item.label}</span>
              <item.icon size={16} strokeWidth={active ? 2.2 : 1.6} aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      {/* Status block — fills to the bottom */}
      <div
        style={{
          marginTop: 'auto',
          padding: '16px 0 0',
          borderTop: '1px solid var(--ink)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--granite)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          System status
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              background: 'var(--dambo)',
              borderRadius: 1,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--ink)',
              letterSpacing: '0.04em',
            }}
          >
            Secure · AES-GCM-256
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
