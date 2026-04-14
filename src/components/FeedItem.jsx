import React from 'react';
import { Map as MapIcon, Share2, ExternalLink } from 'lucide-react';
import { CardItem, IconAvatar, Badge } from '../primitives';

const FeedItem = ({ title, time, description, tags = [], id }) => (
  <CardItem as="article" padding="md" aria-labelledby={id ? `feed-${id}-title` : undefined}>
    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
      <IconAvatar icon={MapIcon} size={60} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', marginBottom: 4 }}>
          <h3
            id={id ? `feed-${id}-title` : undefined}
            style={{ fontWeight: 600, fontSize: 15, margin: 0, color: 'var(--color-text)' }}
          >
            {title}
          </h3>
          <time style={{ fontSize: 12, color: 'var(--color-text-dim)', flexShrink: 0 }}>{time}</time>
        </header>

        <p style={{ color: 'var(--color-text-dim)', fontSize: 14, marginBottom: 'var(--space-sm)' }}>
          {description}
        </p>

        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Badge key={tag.label} accent={tag.color}>{tag.label}</Badge>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button type="button" aria-label="Share" className="bm-icon-button">
          <Share2 size={18} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Open details" className="bm-icon-button">
          <ExternalLink size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  </CardItem>
);

export default FeedItem;
