import React from 'react';
import clsx from 'clsx';
import './primitives.css';

const ACCENT_TOKENS = {
  cyan: 'var(--color-accent-cyan, #00f2ff)',
  magenta: 'var(--color-accent-magenta, #ff007a)',
  green: 'var(--color-accent-green, #22e584)',
};

function resolveAccent(accent) {
  if (!accent) return null;
  return ACCENT_TOKENS[accent] || accent;
}

/**
 * StatDisplay — label + big value + subtext/trend. Consolidates the
 * repeated metric blocks in StatCard and PrivacyStat.
 *
 * Semantics: renders a `<dl>` by default so screen readers announce the
 * label/value relationship correctly. Pass `as="div"` to skip that.
 *
 * @typedef {Object} StatDisplayProps
 * @property {string} label
 * @property {string|number} value
 * @property {string} [subtext]
 * @property {string} [trend]                  Small colored delta indicator.
 * @property {React.ComponentType<{size?: number, color?: string}>} [icon]  Optional lucide icon.
 * @property {'cyan'|'magenta'|'green'|string} [accent]
 * @property {'sm'|'md'|'lg'} [size='md']
 * @property {'dl'|'div'|'article'} [as='dl']
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 *
 * @param {StatDisplayProps} props
 */
const StatDisplay = React.forwardRef(function StatDisplay(
  {
    label,
    value,
    subtext,
    trend,
    icon: Icon,
    accent,
    size = 'md',
    as: Tag = 'dl',
    className,
    style,
    ...rest
  },
  ref
) {
  const accentColor = resolveAccent(accent);
  const mergedStyle = accentColor
    ? { ...(style || {}), '--bm-accent': accentColor, margin: 0 }
    : { margin: 0, ...(style || {}) };

  const LabelTag = Tag === 'dl' ? 'dt' : 'p';
  const ValueTag = Tag === 'dl' ? 'dd' : 'span';

  return (
    <Tag
      ref={ref}
      className={clsx('bm-stat', className)}
      style={mergedStyle}
      {...rest}
    >
      <LabelTag className="bm-stat__label">{label}</LabelTag>
      <div className="bm-stat__value-row">
        <ValueTag
          className={clsx(
            'bm-stat__value',
            size === 'sm' && 'bm-stat__value--sm',
            size === 'lg' && 'bm-stat__value--lg'
          )}
          style={{ margin: 0 }}
        >
          {value}
        </ValueTag>
        {Icon ? (
          <Icon
            size={size === 'lg' ? 28 : 22}
            color={accentColor || 'currentColor'}
            aria-hidden="true"
            style={{ opacity: 0.6 }}
          />
        ) : null}
      </div>
      {trend ? <p className="bm-stat__trend">{trend}</p> : null}
      {subtext ? <p className="bm-stat__subtext">{subtext}</p> : null}
    </Tag>
  );
});

export default StatDisplay;
