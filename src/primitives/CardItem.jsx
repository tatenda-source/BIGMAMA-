import React from 'react';
import clsx from 'clsx';
import './primitives.css';

/**
 * CardItem — translucent panel used as the base chrome for list items,
 * stat tiles, feed entries, etc. Replaces the duplicated
 * `padding 20 / radius 16 / translucent bg` pattern seen across
 * PrivacyStat, SettingsOption, DiscussionPost, FeedItem.
 *
 * @typedef {Object} CardItemProps
 * @property {React.ReactNode} [children]
 * @property {'sm'|'md'|'lg'|'none'} [padding='md']   Spacing preset.
 * @property {'cyan'|'magenta'|'green'|string} [accent]  Token name or raw color.
 *   When provided the card's background/border tints toward the accent.
 * @property {boolean} [interactive=false]  Adds hover/focus affordances.
 *   Set true when the card is a button or receives onClick.
 * @property {'div'|'article'|'section'|'button'|'li'} [as='div']  Tag to render.
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 * @property {(e: React.MouseEvent) => void} [onClick]
 *
 * @param {CardItemProps & React.HTMLAttributes<HTMLElement>} props
 */
const ACCENT_TOKENS = {
  cyan: 'var(--color-accent-cyan, #00f2ff)',
  magenta: 'var(--color-accent-magenta, #ff007a)',
  green: 'var(--color-accent-green, #22e584)',
};

function resolveAccent(accent) {
  if (!accent) return null;
  return ACCENT_TOKENS[accent] || accent;
}

const CardItem = React.forwardRef(function CardItem(
  {
    children,
    padding = 'md',
    accent,
    interactive = false,
    as: Tag = 'div',
    className,
    style,
    onClick,
    ...rest
  },
  ref
) {
  const accentColor = resolveAccent(accent);
  const isInteractive = interactive || typeof onClick === 'function' || Tag === 'button';

  const mergedStyle = accentColor
    ? { ...(style || {}), '--bm-accent': accentColor }
    : style;

  const buttonProps =
    Tag === 'button'
      ? { type: rest.type || 'button' }
      : isInteractive
      ? { role: 'button', tabIndex: 0 }
      : null;

  return (
    <Tag
      ref={ref}
      className={clsx(
        'bm-card',
        `bm-card--pad-${padding}`,
        accentColor && 'bm-card--accent',
        isInteractive && 'bm-card--interactive',
        className
      )}
      style={mergedStyle}
      onClick={onClick}
      {...buttonProps}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default CardItem;
