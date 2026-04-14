import React from 'react';
import clsx from 'clsx';
import './primitives.css';

/**
 * CardHeader — title (+ optional subtitle) on the left, action buttons
 * on the right. Replaces the "title + icon-button row" pattern repeated
 * at the top of many panels.
 *
 * Actions may be passed declaratively as an array for icon-only buttons,
 * or imperatively via the `actionsSlot` prop for custom controls.
 *
 * @typedef {Object} CardHeaderAction
 * @property {React.ComponentType<{size?: number}>} icon
 * @property {(e: React.MouseEvent) => void} onClick
 * @property {string} label   aria-label (required).
 * @property {string} [key]
 * @property {boolean} [disabled]
 *
 * @typedef {Object} CardHeaderProps
 * @property {React.ReactNode} title
 * @property {React.ReactNode} [subtitle]
 * @property {CardHeaderAction[]} [actions]
 * @property {React.ReactNode} [actionsSlot]  Custom right-side slot (takes precedence).
 * @property {React.ComponentType<{size?: number}>} [icon]  Optional leading icon.
 * @property {'h2'|'h3'|'h4'|'div'} [as='h3']
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 *
 * @param {CardHeaderProps} props
 */
const CardHeader = React.forwardRef(function CardHeader(
  {
    title,
    subtitle,
    actions,
    actionsSlot,
    icon: Icon,
    as: TitleTag = 'h3',
    className,
    style,
    ...rest
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx('bm-card-header', className)}
      style={style}
      {...rest}
    >
      <div className="bm-card-header__titles">
        <TitleTag className="bm-card-header__title">
          {Icon ? (
            <Icon
              size={18}
              aria-hidden="true"
              style={{ verticalAlign: 'middle', marginRight: 8 }}
            />
          ) : null}
          {title}
        </TitleTag>
        {subtitle ? <p className="bm-card-header__subtitle">{subtitle}</p> : null}
      </div>

      {actionsSlot ? (
        <div className="bm-card-header__actions">{actionsSlot}</div>
      ) : Array.isArray(actions) && actions.length > 0 ? (
        <div className="bm-card-header__actions">
          {actions.map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.key ?? action.label ?? idx}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.label}
                title={action.label}
                className="bm-card-header__action-btn"
              >
                {ActionIcon ? <ActionIcon size={16} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

export default CardHeader;
