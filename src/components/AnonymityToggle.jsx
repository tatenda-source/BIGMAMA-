import React from 'react';
import { CardItem, Toggle } from '../primitives';

const AnonymityToggle = ({ isAnonymous, onToggle }) => (
  <CardItem accent={isAnonymous ? 'cyan' : undefined} interactive={false}>
    <Toggle
      active={Boolean(isAnonymous)}
      onChange={() => onToggle?.()}
      label="Anonymous Reporting"
      description="Hide your identity from authorities."
      accent="cyan"
    />
  </CardItem>
);

export default AnonymityToggle;
