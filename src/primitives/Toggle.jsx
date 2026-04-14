import React, { useCallback } from 'react';
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
 * Toggle — accessible on/off switch. Deduplicates the hand-rolled
 * switches in AnonymityToggle and SettingsOption.
 *
 * Renders a `role="switch"` button that fully supports keyboard input
 * (Space / Enter) via native button semantics.
 *
 * @typedef {Object} ToggleProps
 * @property {boolean} active                 Current on/off state (controlled).
 * @property {(next: boolean) => void} onChange  Called with the next boolean value.
 * @property {string} [label]                 Accessible label; also shown inline when provided.
 * @property {string} [description]           Optional helper text shown under label.
 * @property {'cyan'|'magenta'|'green'|string} [accent='cyan']
 * @property {'sm'|'md'} [size='md']
 * @property {boolean} [disabled=false]
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 * @property {string} [id]
 *
 * @param {ToggleProps} props
 */
const Toggle = React.forwardRef(function Toggle(
  {
    active,
    onChange,
    label,
    description,
    accent = 'cyan',
    size = 'md',
    disabled = false,
    className,
    style,
    id,
    ...rest
  },
  ref
) {
  const accentColor = resolveAccent(accent);
  const handleClick = useCallback(() => {
    if (disabled) return;
    onChange?.(!active);
  }, [active, disabled, onChange]);

  const switchEl = (
    <button
      ref={ref}
      type="button"
      role="switch"
      id={id}
      aria-checked={Boolean(active)}
      aria-label={!label ? rest['aria-label'] : undefined}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'bm-toggle-switch',
        size === 'sm' && 'bm-toggle-switch--sm',
        !label && className
      )}
      style={{
        '--bm-accent': accentColor,
        ...(label ? null : style),
      }}
      {...(label ? {} : rest)}
    >
      <span className="bm-toggle-knob" aria-hidden="true" />
    </button>
  );

  if (!label) return switchEl;

  return (
    <div
      className={clsx('bm-toggle-row', className)}
      style={{ '--bm-accent': accentColor, ...style }}
      {...rest}
    >
      <div className="bm-toggle-meta">
        <div>
          <p className="bm-toggle-label">
            <label htmlFor={id} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
              {label}
            </label>
          </p>
          {description ? (
            <p className="bm-toggle-description">{description}</p>
          ) : null}
        </div>
      </div>
      {switchEl}
    </div>
  );
});

export default Toggle;
