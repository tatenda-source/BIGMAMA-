import { motion } from 'framer-motion';

/**
 * Dossier card for the dashboard triptych. Hairline-ruled title block with
 * monospace eyebrow; a sized Fraunces heading; a paper interior for the
 * children. The icon sits in the ornamental outer right, ink-outlined.
 */
const Card = ({ title, subtitle, icon: Icon, color = 'var(--ink)', eyebrow, children }) => (
  <motion.section
    initial={false}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.18, ease: [0.2, 0.7, 0.3, 1] }}
    className="dossier"
    style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
  >
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'start',
        gap: 12,
        paddingBottom: 10,
        borderBottom: '1px solid var(--ink)',
      }}
    >
      <div>
        {eyebrow && (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--granite)',
              margin: '0 0 4px',
            }}
          >
            {eyebrow}
          </p>
        )}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 72, "wght" 500',
            fontSize: 22,
            letterSpacing: '-0.015em',
            margin: 0,
            color: 'var(--ink)',
            lineHeight: 1.1,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              color: 'var(--ink-muted)',
              fontSize: 13,
              marginTop: 4,
              fontStyle: 'italic',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${color}`,
          color,
          boxShadow: '2px 2px 0 var(--paper-warm)',
        }}
      >
        <Icon size={20} />
      </span>
    </header>
    <div>{children}</div>
  </motion.section>
);

export default Card;
