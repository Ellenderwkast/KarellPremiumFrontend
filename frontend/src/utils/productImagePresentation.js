const productsWithBackgroundImages = new Set([
  'top crochet margarita',
  'top crochet boho butterfly',
  'gafas de sol luxury',
  'top crochet ibiza'
]);

export function getImageEntries(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

export function getVariantImageSources(product, variant = null) {
  const variantImages = [
    variant?.image,
    ...getImageEntries(variant?.images)
  ].filter(value => (typeof value === 'string' ? value.trim() : value));

  if (variantImages.length > 0) return [...new Set(variantImages)];

  const attributes = product?.attributes || {};
  const productImages = [
    product?.image,
    attributes.image,
    ...getImageEntries(attributes.images),
    ...getImageEntries(attributes.gallery)
  ].filter(value => (typeof value === 'string' ? value.trim() : value));

  return [...new Set(productImages)];
}

export function shouldFillProductImageFrame(product) {
  const imageFit = product?.attributes?.imageFit || product?.imageFit;
  if (imageFit === 'contain' || imageFit === 'cover') return imageFit === 'cover';

  const name = String(product?.title || product?.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return [...productsWithBackgroundImages].some(productName => name.includes(productName));
}
