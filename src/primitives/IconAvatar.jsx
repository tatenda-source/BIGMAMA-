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
 * IconAvatar — icon in a colored rounded square. Consolidates the
 * 40x40 / 20-icon pattern found in SettingsOption, FeedItem, etc.
 *
 * @typedef {Object} IconAvatarProps
 * @property {React.ComponentType<{size?: number, color?: string}>} icon  Lucide icon component.
 * @property {number} [size=40]              Outer square size in px.
 * @property {number} [iconSize]             Icon glyph size; defaults to size * 0.5.
 * @property {'cyan'|'magenta'|'green'|string} [accent]
 * @property {boolean} [ring=false]          Show subtle accent-colored border.
 * @property {boolean} [muted=false]         Use neutral gray styling regardless of accent.
 * @property {string} [label]                aria-label; otherwise the avatar is aria-hidden.
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 *
 * @param {IconAvatarProps & React.HTMLAttributes<HTMLDivElement>} props
 */
const IconAvatar = React.forwardRef(function IconAvatar(
  {
    icon: Icon,
    size = 40,
    iconSize,
    accent,
    ring = false,
    muted = false,
    label,
    className,
    style,
    ...rest
  },
  ref
) {
  const accentColor = resolveAccent(accent);
  const computedIconSize = iconSize ?? Math.round(size * 0.5);

  return (
    <div
      ref={ref}
      className={clsx(
        'bm-avatar',
        ring && accentColor && 'bm-avatar--ring',
        (muted || !accentColor) && 'bm-avatar--muted',
        className
      )}
      style={{
        width: size,
        height: size,
        '--bm-accent': accentColor,
        ...style,
      }}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      {...rest}
    >
      {Icon ? (
        <Icon
          size={computedIconSize}
          color={muted ? 'currentColor' : accentColor || 'currentColor'}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
});

export default IconAvatar;
