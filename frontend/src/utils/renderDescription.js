// Convierte texto plano de descripción en elementos React con párrafos y listas.
// - Párrafos: separados por doble salto de línea
// - Listas: líneas que empiezan con - o *
import React from 'react';

export function renderDescription(text) {
  if (!text) return null;
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, i) => {
    // Detectar lista
    const lines = block.split(/\n/).map(l => l.trim());
    const isList = lines.every(line => /^[-*]\s+/.test(line));
    if (isList) {
      return (
        <ul key={i}>
          {lines.map((line, j) => (
            <li key={j}>{line.replace(/^[-*]\s+/, '')}</li>
          ))}
        </ul>
      );
    }
    // Si no es lista, es párrafo
    return <p key={i}>{block}</p>;
  });
}
