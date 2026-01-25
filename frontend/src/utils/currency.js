export function formatCOPFromUnits(units) {
  const n = Number(units) || 0;
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatCOPFromCents(cents) {
  const n = Number(cents) || 0;
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(n / 100));
}
