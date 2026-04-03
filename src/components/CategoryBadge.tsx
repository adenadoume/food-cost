import React from 'react';
import { Tag } from 'antd';
import { CATEGORY_COLORS } from '../lib/constants';

export const CategoryBadge: React.FC<{ category: string | null }> = ({ category }) => {
  if (!category) return <span style={{ color: '#6b7280' }}>—</span>;
  const color = CATEGORY_COLORS[category] ?? '#6b7280';
  return (
    <Tag
      style={{
        backgroundColor: color + '22',
        borderColor: color + '66',
        color,
        fontWeight: 600,
        fontSize: 12,
        borderRadius: 4,
      }}
    >
      {category}
    </Tag>
  );
};

export const RestaurantBadge: React.FC<{ restaurants: string[] }> = ({ restaurants }) => (
  <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
    {restaurants.map(r => (
      <Tag
        key={r}
        style={{
          backgroundColor: r === 'OIK104' ? '#3b82f622' : '#8b5cf622',
          borderColor: r === 'OIK104' ? '#3b82f666' : '#8b5cf666',
          color: r === 'OIK104' ? '#60a5fa' : '#a78bfa',
          fontWeight: 600,
          fontSize: 12,
          borderRadius: 4,
        }}
      >
        {r === 'OIK512' ? 'OIK5.12' : r}
      </Tag>
    ))}
  </span>
);
