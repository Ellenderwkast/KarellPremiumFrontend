import { useEffect } from 'react';

const getCanonicalBaseUrl = () => {
  const fallbackCanonical = 'https://www.karellpremium.com.co';
  try {
    const envUrl = import.meta.env.VITE_FRONTEND_URL;
    if (envUrl && typeof envUrl === 'string' && /^https?:\/\//i.test(envUrl)) {
      return envUrl.replace(/\/+$/, '');
    }
  } catch (_) {}

  if (typeof window !== 'undefined' && window.location?.origin && import.meta.env.DEV) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return fallbackCanonical;
};

const StructuredData = ({ type, data }) => {
  useEffect(() => {
    const canonicalBaseUrl = getCanonicalBaseUrl();
    const scriptId = `structured-data-${type}`;
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    // Validar y limpiar datos antes de stringify
    const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
      // Remover valores undefined o null
      if (value === undefined || value === null) return undefined;
      // Asegurar que URLs sean válidas, soportando arrays
      if (key === 'url' || key === 'image') {
        if (Array.isArray(value)) {
          return value.map(v =>
            typeof v === 'string' && v.startsWith('http')
              ? v
              : `${canonicalBaseUrl}${v}`
          );
        }
        if (typeof value === 'string') {
          return value.startsWith('http') ? value : `${canonicalBaseUrl}${value}`;
        }
      }
      return value;
    }));

    script.textContent = JSON.stringify(cleanData);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [type, data]);

  return null;
};

export default StructuredData;
