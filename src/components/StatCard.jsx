import React from 'react';
import { CardItem, StatDisplay } from '../primitives';

const StatCard = ({ label, val, icon, color }) => (
  <CardItem padding="lg">
    <StatDisplay label={label} value={val} icon={icon} accent={color} size="lg" />
  </CardItem>
);

export default StatCard;
