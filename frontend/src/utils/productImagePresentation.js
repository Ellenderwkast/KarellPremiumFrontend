const productsWithBackgroundImages = new Set([
  'top crochet margarita',
  'top crochet boho butterfly',
  'gafas de sol luxury',
  'top crochet ibiza'
]);

export function shouldFillProductImageFrame(product) {
  const imageFit = product?.attributes?.imageFit || product?.imageFit;
  if (imageFit === 'contain' || imageFit === 'cover') return imageFit === 'cover';

  const name = String(product?.title || product?.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return productsWithBackgroundImages.has(name);
}
