import React from 'react';
import clsx from 'clsx';
import './primitives.css';

const ACCENT_TOKENS = {
  cyan: 'var(--color-accent-cyan, #00f2ff)',
  magenta: 'var(--color-accent-magenta, #ff007a)',
  green: 'var(--color-accent-green, #22e584)',
};

const VARIANT_ACCENTS = {
  default: 'var(--color-accent-cyan, #00f2ff)',
  success: 'var(--color-accent-green, #22e584)',
  warning: 'var(--color-accent-amber, #ffb020)',
  danger: 'var(--color-accent-magenta, #ff007a)',
  info: 'var(--color-accent-cyan, #00f2ff)',
  neutral: 'var(--color-text-dim, #a0a0a0)',
};

function resolveAccent(accent, variant) {
  if (accent) return ACCENT_TOKENS[accent] || accent;
  return VARIANT_ACCENTS[variant] || VARIANT_ACCENTS.default;
}

/**
 * Badge — inline colored tag/pill. Replaces ad-hoc
 * `{tag.color}22` spans found across FeedItem and other list rows.
 *
 * @typedef {Object} BadgeProps
 * @property {React.ReactNode} children
 * @property {'default'|'success'|'warning'|'danger'|'info'|'neutral'} [variant='default']
 * @property {'soft'|'solid'|'outline'} [tone='soft']
 * @property {'cyan'|'magenta'|'green'|string} [accent]  Explicit accent overrides variant.
 * @property {React.ComponentType<{size?: number}>} [icon]  Optional leading lucide icon.
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 * @property {string} [title]
 *
 * @param {BadgeProps} props
 */
const Badge = React.forwardRef(function Badge(
  {
    children,
    variant = 'default',
    tone = 'soft',
    accent,
    icon: Icon,
    className,
    style,
    ...rest
  },
  ref
) {
  const accentColor = resolveAccent(accent, variant);
  return (
    <span
      ref={ref}
      className={clsx(
        'bm-badge',
        tone === 'solid' && 'bm-badge--solid',
        tone === 'outline' && 'bm-badge--outline',
        className
      )}
      style={{ '--bm-accent': accentColor, ...style }}
      {...rest}
    >
      {Icon ? <Icon size={12} aria-hidden="true" /> : null}
      {children}
    </span>
  );
});

export default Badge;
