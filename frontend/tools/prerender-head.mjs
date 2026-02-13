import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('No se encontró dist/index.html. Ejecuta primero "npm run build".');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');

const routeMeta = {
  '/': {
    title: 'Audífonos Bluetooth y Accesorios Tecnológicos al Mejor Precio Colombia',
    description: 'Compra audífonos Bluetooth, relojes inteligentes y accesorios tecnológicos en Colombia. Envíos rápidos, pago contra entrega y garantía.',
    robots: 'index, follow'
  },
  '/products': {
    title: 'Catálogo de Productos | Karell Premium',
    description: 'Explora nuestro catálogo de audífonos, relojes inteligentes y accesorios tecnológicos con envío a toda Colombia.',
    robots: 'index, follow'
  },
  '/blog': {
    title: 'Blog de Tecnología y Audio | Karell Premium',
    description: 'Consejos, guías y noticias sobre audífonos, smartwatches y gadgets en Colombia.',
    robots: 'index, follow'
  },
  '/cart': {
    title: 'Carrito | Karell Premium',
    description: 'Revisa los productos en tu carrito antes de comprar.',
    robots: 'noindex, nofollow'
  },
  '/checkout': {
    title: 'Checkout | Karell Premium',
    description: 'Confirma tu compra con pago contra entrega o en línea.',
    robots: 'noindex, nofollow'
  },
  '/payment-return': {
    title: 'Retorno de pago | Karell Premium',
    description: 'Procesando tu pago, por favor espera.',
    robots: 'noindex, nofollow'
  },
  '/payment-result': {
    title: 'Resultado de pago | Karell Premium',
    description: 'Resumen del estado de tu pago.',
    robots: 'noindex, nofollow'
  },
  '/login': {
    title: 'Iniciar sesión | Karell Premium',
    description: 'Accede a tu cuenta para gestionar pedidos y compras.',
    robots: 'noindex, nofollow'
  },
  '/register': {
    title: 'Crear cuenta | Karell Premium',
    description: 'Regístrate para comprar más rápido y seguir tus pedidos.',
    robots: 'noindex, nofollow'
  },
  '/terms': {
    title: 'Términos y Condiciones | Karell Premium',
    description: 'Consulta los términos y condiciones de servicio de Karell Premium.',
    robots: 'index, follow'
  },
  '/privacy': {
    title: 'Política de Privacidad | Karell Premium',
    description: 'Lee cómo protegemos y usamos tus datos personales en Karell Premium.',
    robots: 'index, follow'
  }
};

const baseRoutes = Object.keys(routeMeta);

async function getBlogRoutes() {
  try {
    const blogModule = await import(pathToFileURL(path.resolve(__dirname, '../src/blogdata/posts.js')).href);
    const posts = blogModule.blogPosts || [];
    return posts.map(p => `/blog/${p.slug}`).filter(Boolean);
  } catch (e) {
    console.warn('No se pudieron obtener slugs de blog:', e.message);
    return [];
  }
}

function getProductRoutes() {
  const routes = [];
  const env = process.env.PRERENDER_PRODUCT_SLUGS;
  if (env) {
    env.split(',').map(s => s.trim()).filter(Boolean).forEach(slug => routes.push(`/products/${slug}`));
  }

  const jsonPath = path.resolve(__dirname, './product-slugs.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.filter(Boolean).forEach(slug => routes.push(`/products/${slug}`));
      }
    } catch (e) {
      console.warn('No se pudieron leer product-slugs.json:', e.message);
    }
  }

  return routes;
}

function metaForRoute(route) {
  if (routeMeta[route]) return routeMeta[route];
  const isProductDetail = /^\/products\/[A-Za-z0-9._~%-]+/.test(route);
  const isBlogPost = /^\/blog\/[A-Za-z0-9._~%-]+/.test(route);
  if (isProductDetail) {
    const slug = route.split('/').pop();
    return {
      title: `${decodeURIComponent(slug).replace(/[-_]+/g, ' ')} | Comprar en Karell Premium`,
      description: `Compra ${decodeURIComponent(slug).replace(/[-_]+/g, ' ')} con envío a toda Colombia y pago contra entrega en Karell Premium.`,
      robots: 'index, follow',
      ogType: 'product'
    };
  }
  if (isBlogPost) {
    const slug = route.split('/').pop();
    return {
      title: `${decodeURIComponent(slug).replace(/[-_]+/g, ' ')} | Blog Karell Premium`,
      description: `Lee el artículo ${decodeURIComponent(slug).replace(/[-_]+/g, ' ')} en el blog de Karell Premium: consejos y guías sobre audio y gadgets.`,
      robots: 'index, follow',
      ogType: 'article'
    };
  }
  return null;
}

function setMeta(html, name, content, attr = 'name') {
  if (!content) return html;
  const pattern = new RegExp(`(<meta[^>]*${attr}=["']${name}["'][^>]*content=["'])[^"']*(["'][^>]*>)`, 'i');
  if (pattern.test(html)) {
    return html.replace(pattern, `$1${content}$2`);
  }
  // si no existe, insertar antes del cierre de </head>
  const injection = `  <meta ${attr}="${name}" content="${content}" />\n`; 
  return html.replace('</head>', `${injection}</head>`);
}

function setTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
}

function setCanonical(html, href) {
  const pattern = /(<link[^>]*rel=["']canonical["'][^>]*href=["'])[^"']*(["'][^>]*>)/i;
  if (pattern.test(html)) return html.replace(pattern, `$1${href}$2`);
  const injection = `  <link rel="canonical" href="${href}" />\n`;
  return html.replace('</head>', `${injection}</head>`);
}

async function main() {
  const blogRoutes = await getBlogRoutes();
  const productRoutes = getProductRoutes();
  const allRoutes = Array.from(new Set([...baseRoutes, ...blogRoutes, ...productRoutes]));

  for (const route of allRoutes) {
    const meta = metaForRoute(route);
    if (!meta) continue;

    let html = template;
    const canonical = `https://www.karellpremium.com.co${route === '/' ? '' : route}`;

    html = setTitle(html, meta.title);
    html = setMeta(html, 'title', meta.title, 'name');
    html = setMeta(html, 'description', meta.description, 'name');
    html = setMeta(html, 'robots', meta.robots || 'index, follow', 'name');
    html = setMeta(html, 'og:title', meta.title, 'property');
    html = setMeta(html, 'og:description', meta.description, 'property');
    html = setMeta(html, 'og:type', meta.ogType || 'website', 'property');
    html = setMeta(html, 'twitter:title', meta.title, 'name');
    html = setMeta(html, 'twitter:description', meta.description, 'name');
    html = setCanonical(html, canonical);

    const outDir = route === '/' ? distDir : path.join(distDir, route.replace(/^\//, ''));
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = route === '/' ? path.join(outDir, 'index.html') : path.join(outDir, 'index.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('Prerender head:', route, '->', outPath);
  }
}

main().catch(err => {
  console.error('Error en prerender:', err);
  process.exit(1);
});
