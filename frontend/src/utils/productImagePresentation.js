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
