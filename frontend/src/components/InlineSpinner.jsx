import React from 'react';

export default function InlineSpinner({ size = 14, color = '#fff' }) {
  const s = Number(size) || 14;
  return (
    <svg width={s} height={s} viewBox="0 0 50 50" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <circle cx="25" cy="25" r="20" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray="31.4 31.4" transform="rotate(-90 25 25)">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
