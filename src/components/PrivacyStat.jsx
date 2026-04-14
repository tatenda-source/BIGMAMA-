import React from 'react';
import { CardItem, StatDisplay } from '../primitives';

const PrivacyStat = ({ label, value, subtext, color }) => (
  <CardItem>
    <StatDisplay label={label} value={value} subtext={subtext} accent={color} />
  </CardItem>
);

export default PrivacyStat;
