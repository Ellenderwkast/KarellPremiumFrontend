import { useMemo } from 'react';
import { API_URL } from '../services/api';

const barStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  background: '#0b1020',
  color: '#c7d2fe',
  borderBottom: '1px solid #1f2937',
  fontSize: 12
};

const btnStyle = {
  background: '#1f2937',
  color: '#e5e7eb',
  border: '1px solid #374151',
  borderRadius: 6,
  padding: '4px 8px',
  cursor: 'pointer'
};

const badgeStyle = {
  background: '#111827',
  color: '#d1d5db',
  border: '1px solid #374151',
  borderRadius: 6,
  padding: '2px 6px',
  fontFamily: 'monospace'
};

function normalizeUrl(input) {
  try {
    let value = String(input || '').trim();
    if (!value) return '';
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    // asegurar sufijo /api
    if (!/\/api\/?$/i.test(value)) {
      value = value.replace(/\/?$/,'');
      value = value + '/api';
    }
    return value;
  } catch {
    return '';
  }
}

export default function ApiSwitchBanner() {
  // Solo se muestra si la variable está explícitamente activada
  const showBanner = import.meta.env.VITE_SHOW_API_SWITCH === 'true';
  
  if (!showBanner) return null;

  const current = API_URL;
  const mode = useMemo(() => {
    try {
      const ls = typeof window !== 'undefined' ? window.localStorage.getItem('NGROK_API_URL') : null;
      if (ls) return 'ngrok';
      if (/ngrok|trycloudflare/i.test(current)) return 'ngrok';
      return 'local';
    } catch {
      return 'local';
    }
  }, [current]);

  const setNgrok = () => {
    const input = window.prompt('Pega la URL pública de tu backend (ngrok):', 'https://xxxx-xxxx.ngrok.app/api');
    const value = normalizeUrl(input);
    if (!value) return;
    try {
      window.localStorage.setItem('NGROK_API_URL', value);
      window.location.reload();
    } catch {}
  };

  const setLocal = () => {
    try {
      window.localStorage.removeItem('NGROK_API_URL');
      window.location.reload();
    } catch {}
  };

  return (
    <div style={barStyle}>
      <span style={{ opacity: 0.8 }}>API</span>
      <span style={badgeStyle}>{current}</span>
      <span style={{ opacity: 0.7 }}>|</span>
      {mode === 'ngrok' ? (
        <>
          <span style={{ color: '#34d399' }}>ngrok</span>
          <button style={btnStyle} onClick={setLocal}>Usar local</button>
        </>
      ) : (
        <>
          <span style={{ color: '#f59e0b' }}>local</span>
          <button style={btnStyle} onClick={setNgrok}>Usar ngrok</button>
        </>
      )}
    </div>
  );
}
