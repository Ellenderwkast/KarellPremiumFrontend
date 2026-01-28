import React, { useEffect } from 'react';

export default function PageSizeSelect({ pageSize, setPageSize, storageKey = 'admin_page_size', compact = false, selectStyle = {} }) {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const n = Number(stored);
        if (!isNaN(n) && n > 0 && n !== pageSize) setPageSize(n);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    const v = Number(e.target.value) || 10;
    setPageSize(v);
    try { window.localStorage.setItem(storageKey, String(v)); } catch (e) {}
  };

  const baseSelectStyle = {
    padding: compact ? 2 : 6,
    borderRadius: 6,
    minWidth: compact ? 48 : 140,
    height: compact ? 26 : 'auto',
    fontSize: compact ? 12 : undefined,
    ...selectStyle
  };

  const labelStyle = { fontSize: compact ? 12 : 13, color: '#374151' };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={labelStyle}>Filas por página:</label>
      <select value={pageSize} onChange={onChange} style={baseSelectStyle}>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>
  );
}
