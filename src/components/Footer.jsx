import { PLATFORM_NAME, PLATFORM_TAGLINE } from '../utils/constants';

const Footer = () => {
  return (
    <footer
      style={{
        padding: '32px 40px 36px',
        borderTop: '1px solid var(--ink)',
        marginTop: 0,
        display: 'grid',
        gridTemplateColumns: '2fr 2fr 1fr',
        gap: 24,
        background: 'var(--paper-warm)',
        alignItems: 'end',
      }}
    >
      <div>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--granite)',
            margin: '0 0 6px',
          }}
        >
          Colophon
        </p>
        <h4
          className="font-display"
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 72, "wght" 600',
            fontSize: 22,
            margin: 0,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
          }}
        >
          {PLATFORM_NAME}
        </h4>
        <p
          style={{
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ink-muted)',
            marginTop: 6,
            maxWidth: '38ch',
          }}
        >
          {PLATFORM_TAGLINE}
        </p>
      </div>

      <nav
        aria-label="Legal"
        style={{
          display: 'flex',
          gap: 28,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
        }}
      >
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="#rights">Citizen Rights</a>
      </nav>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          color: 'var(--granite)',
          textAlign: 'right',
        }}
      >
        MMXXVI<br />
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          Initiative No. 001
        </span>
      </div>
    </footer>
  );
};

export default Footer;
