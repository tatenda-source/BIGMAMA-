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
 * SecondaryButton — ghost/outline button for toolbar actions such as
 * "Filter", "Export", "Cancel". Not to be confused with the primary
 * gradient CTA in the app.
 *
 * @typedef {Object} SecondaryButtonProps
 * @property {React.ReactNode} [children]
 * @property {React.ComponentType<{size?: number}>} [icon]      Leading lucide icon.
 * @property {React.ComponentType<{size?: number}>} [trailingIcon]
 * @property {'sm'|'md'|'lg'} [size='md']
 * @property {'cyan'|'magenta'|'green'|string} [accent]
 * @property {boolean} [disabled=false]
 * @property {'button'|'submit'|'reset'} [type='button']
 * @property {(e: React.MouseEvent) => void} [onClick]
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 * @property {string} [ariaLabel]
 *
 * @param {SecondaryButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
const SecondaryButton = React.forwardRef(function SecondaryButton(
  {
    children,
    icon: Icon,
    trailingIcon: TrailingIcon,
    size = 'md',
    accent,
    disabled = false,
    type = 'button',
    onClick,
    className,
    style,
    ariaLabel,
    ...rest
  },
  ref
) {
  const accentColor = resolveAccent(accent);
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const iconOnly = !children;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel || (iconOnly ? rest['aria-label'] : undefined)}
      className={clsx(
        'bm-btn-secondary',
        size === 'sm' && 'bm-btn-secondary--sm',
        size === 'lg' && 'bm-btn-secondary--lg',
        className
      )}
      style={{
        '--bm-accent': accentColor,
        ...style,
      }}
      {...rest}
    >
      {Icon ? <Icon size={iconSize} aria-hidden="true" /> : null}
      {children}
      {TrailingIcon ? <TrailingIcon size={iconSize} aria-hidden="true" /> : null}
    </button>
  );
});

export default SecondaryButton;
