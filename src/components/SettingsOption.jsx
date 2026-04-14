import React from 'react';
import { CardItem, IconAvatar, Toggle, SecondaryButton } from '../primitives';

const SettingsOption = ({
  icon,
  title,
  description,
  color,
  action,
  active,
  onToggle,
  onAction,
}) => {
  const isDanger = action === 'Execute';

  return (
    <CardItem>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-md)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <IconAvatar icon={icon} accent={active ? color : undefined} />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>{title}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>{description}</p>
          </div>
        </div>

        {onToggle ? (
          <Toggle
            active={Boolean(active)}
            onChange={() => onToggle?.()}
            aria-label={title}
            accent="cyan"
          />
        ) : (
          <SecondaryButton
            onClick={onAction}
            accent={isDanger ? 'magenta' : 'cyan'}
          >
            {action}
          </SecondaryButton>
        )}
      </div>
    </CardItem>
  );
};

export default SettingsOption;
