import { useEffect } from 'react';

const StructuredData = ({ type, data }) => {
  useEffect(() => {
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
              : `${window.location.origin}${v}`
          );
        }
        if (typeof value === 'string') {
          return value.startsWith('http') ? value : `${window.location.origin}${value}`;
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
