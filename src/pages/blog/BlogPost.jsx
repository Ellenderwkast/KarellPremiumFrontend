import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getStaticUrl } from '../../services/api';
import SEO from '../../components/SEO';
import StructuredData from '../../components/StructuredData';

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    api.get(`/blog/${slug}`)
      .then(res => {
        setPost(res.data);
        if (res.data.products && res.data.products.length) {
          api.get('/products', { params: { ids: res.data.products.join(',') } })
            .then(r => setRelatedProducts(r.data))
            .catch(() => setRelatedProducts([]));
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div>Cargando artículo...</div>;
  if (!post) return <div>Artículo no encontrado.</div>;

  // Normalizar URLs dentro del contenido del post para evitar referencias a 'localhost' o rutas
  // que resuelvan al origen del cliente. Reescribimos:
  // - src="/uploads/..."  ->  src="<backendBase>/uploads/..."
  // - http://localhost:...  ->  <backendBase>
  const backendBase = API_URL.replace('/api', '');
  const normalizedContent = post.content
    ? post.content
        .replace(/src=(['"])\/uploads\//gi, `src=$1${backendBase}/uploads/`)
        .replace(/https?:\/\/localhost(:\d+)?/gi, backendBase)
        .replace(/https?:\/\/127\.0\.0\.1(:\d+)?/gi, backendBase)
    : '';

  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/blog/${post.slug || post.id}`;
  const plainText = (post.excerpt || post.content?.replace(/<[^>]+>/g, '') || '').trim();
  const metaDescription = (post.seoDescription || plainText).slice(0, 155);

  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: metaDescription,
    image: getStaticUrl(post.cover),
    author: post.author ? {
      '@type': 'Person',
      name: post.author
    } : undefined,
    datePublished: post.publishDate,
    dateModified: post.updatedAt || post.publishDate,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: canonicalUrl
      }
    ]
  };

  return (
    <>
      <SEO
        title={post.seoTitle || post.title}
        description={metaDescription}
        canonical={canonicalUrl}
        image={getStaticUrl(post.cover)}
        type="article"
      />
      <StructuredData type="blog-post" data={articleData} />
      <StructuredData type="breadcrumb-blog-post" data={breadcrumbData} />
      <article className="blog-post-page container" style={{maxWidth:700,margin:'2em auto'}}>
      <div style={{color:'#38bdf8',fontWeight:600,marginBottom:8}}>{post.category}</div>
      <h1 style={{fontSize:'2em',marginBottom:8}}>{post.title}</h1>
      <div style={{color:'#888',fontSize:'0.95em',marginBottom:'1.5em'}}>
        {new Date(post.publishDate).toLocaleDateString()} {post.author && <>| {post.author}</>}
      </div>
      <div style={{
        width: '100%',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '38vw',
        minHeight: 180,
        maxHeight: 340,
        marginBottom: '2em',
        borderRadius: 12
      }}>
        <img src={getStaticUrl(post.cover)} alt={post.title} style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          background: '#f8fafc',
          borderRadius: 12,
          width: 'auto',
          height: 'auto',
          aspectRatio: '16/9',
          display: 'block'
        }} />
      </div>
      <div className="blog-content" dangerouslySetInnerHTML={{__html: normalizedContent}} style={{fontSize:'1.15em',lineHeight:1.7,marginBottom:'2em'}} />
      {relatedProducts.length > 0 && (
        <section style={{margin:'2em 0'}}>
          <h2 style={{fontSize:'1.2em',color:'#16a34a',marginBottom:'1em'}}>Productos recomendados</h2>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {relatedProducts.map(prod => (
              <Link key={prod.id} to={`/products/${prod.id}`} style={{textDecoration:'none',color:'inherit',background:'#f0f9ff',borderRadius:8,padding:12,display:'flex',flexDirection:'column',alignItems:'center',width:180}}>
                <img src={getStaticUrl(prod.attributes?.image || prod.image)} alt={prod.name} style={{width:120,height:120,objectFit:'cover',borderRadius:8,marginBottom:8}} />
                <div style={{fontWeight:600,marginBottom:4}}>{prod.name}</div>
                <div style={{color:'#16a34a',fontWeight:700}}>${prod.price}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <div style={{marginTop:'2em'}}>
        <Link to="/blog" style={{color:'#38bdf8',fontWeight:600}}>&larr; Volver al blog</Link>
      </div>
      </article>
    </>
  );
}

export default BlogPost;
