  const { slug } = useParams();
  const post = blogPosts.find(p => p.slug === slug);
  if (!post) return <div>Artículo no encontrado.</div>;

  // Normalizar URLs dentro del contenido del post para evitar referencias a 'localhost' o rutas
  // que resuelvan al origen del cliente. Reescribimos:
  // - src="/uploads/..."  ->  src="<backendBase>/uploads/..."
  // - http://localhost:...  ->  <backendBase>
  const normalizedContent = post.content;

  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/blog/${post.slug || post.id}`;
  const plainText = (post.excerpt || post.content?.replace(/<[^>]+>/g, '') || '').trim();
  const metaDescription = (post.seoDescription || plainText).slice(0, 155);

  // Fallback para imagen de portada
  const placeholder = 'https://via.placeholder.com/600x340?text=Sin+imagen';
  const coverUrl = post.cover || placeholder;
  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: metaDescription,
    image: coverUrl,
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
        image={coverUrl}
        type="article"
      />
      <StructuredData type="blog-post" data={articleData} />
      <StructuredData type="breadcrumb-blog-post" data={breadcrumbData} />
      <article className="blog-post-page container" style={{maxWidth:700,margin:'2em auto'}}>
        <h1 style={{fontSize:'2em',marginBottom:8}}>{post.title}</h1>
        <div style={{color:'#888',fontSize:'0.95em',marginBottom:'1.5em'}}>
          {post.publishDate ? new Date(post.publishDate).toLocaleDateString() : ''}
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
          <img
            src={coverUrl}
            alt={post.title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              background: '#f8fafc',
              borderRadius: 12,
              width: 'auto',
              height: 'auto',
              aspectRatio: '16/9',
              display: 'block'
            }}
            onError={e => { e.target.onerror = null; e.target.src = placeholder; }}
          />
        </div>
        <div className="blog-content" dangerouslySetInnerHTML={{__html: normalizedContent}} style={{fontSize:'1.15em',lineHeight:1.7,marginBottom:'2em'}} />
        <div style={{marginTop:'2em'}}>
          <Link to="/blog" style={{color:'#38bdf8',fontWeight:600}}>&larr; Volver al blog</Link>
        </div>
      </article>
    </>
  );
}

export default BlogPost;
