import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title, 
  description, 
  canonical, 
  image,
  type = 'website',
  keywords = 'tecnología, gadgets, accesorios, productos premium, electrónica'
}) => {
  const location = useLocation();
  let baseUrl = window.location.origin;
  try {
    const envUrl = import.meta.env.VITE_FRONTEND_URL;
    if (envUrl && typeof envUrl === 'string' && /^https?:\/\//i.test(envUrl)) {
      baseUrl = envUrl;
    }
  } catch (_) {
    // ignore, fallback to window.location.origin
  }
  const fullCanonical = canonical || `${baseUrl}${location.pathname}`;
  const defaultImage = `${baseUrl}/images/logo.png`;
  const ogImage = image || defaultImage;
  const fullTitle = title ? `${title} | Karell Premium` : 'Karell Premium - Tecnología y Accesorios Premium';

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper para crear/actualizar meta tags
    const setMeta = (name, content, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic SEO
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('author', 'Karell Premium');
    setMeta('robots', 'index, follow');
    setMeta('language', 'es');
    setMeta('revisit-after', '7 days');

    // Open Graph (Facebook, LinkedIn)
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:url', fullCanonical, true);
    setMeta('og:type', type, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:site_name', 'Karell Premium', true);
    setMeta('og:locale', 'es_CO', true);

    // Twitter Cards
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    // Canonical link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    try {
      const url = new URL(fullCanonical);
      linkCanonical.setAttribute('href', url.toString());
    } catch (_) {
      linkCanonical.setAttribute('href', window.location.href);
    }

    // Alternate for language
    let linkAlternate = document.querySelector('link[rel="alternate"][hreflang="es"]');
    if (!linkAlternate) {
      linkAlternate = document.createElement('link');
      linkAlternate.setAttribute('rel', 'alternate');
      linkAlternate.setAttribute('hreflang', 'es');
      document.head.appendChild(linkAlternate);
    }
    linkAlternate.setAttribute('href', fullCanonical);

  }, [fullTitle, description, fullCanonical, ogImage, type, keywords]);

  return null;
};

export default SEO;
