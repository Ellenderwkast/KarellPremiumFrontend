

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../../blogdata/posts';
import api from '../../services/api';
import SEO from '../../components/SEO';
import StructuredData from '../../components/StructuredData';
import ProductCard from '../../components/ProductCard';
import { getStaticUrl, productService } from '../../services/api';



function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const localPost = blogPosts.find(p => p.slug === slug);
    if (localPost) {
      setPost(localPost);
      setLoading(true);
      setNotFound(false);
      // Si el post local tiene campo 'products', buscar productos relacionados
      if (Array.isArray(localPost.products) && localPost.products.length > 0) {
        productService.getAll().then(res => {
          const allProducts = Array.isArray(res.data) ? res.data : [];
          // Filtrar productos por los IDs en localPost.products
          const related = localPost.products.map(id => allProducts.find(p => String(p.id) === String(id))).filter(Boolean).map(product => {
            let img = product.image || (product.attributes && product.attributes.image);
            if (!img && Array.isArray(product.images) && product.images.length > 0) img = product.images[0];
            if (!img && product.attributes && Array.isArray(product.attributes.images) && product.attributes.images.length > 0) img = product.attributes.images[0];
            if (!img && Array.isArray(product.gallery) && product.gallery.length > 0) img = product.gallery[0];
            return { ...product, image: getStaticUrl(img) };
          });
          setRelatedProducts(related);
        }).catch(() => setRelatedProducts([])).finally(() => setLoading(false));
      } else {
        setRelatedProducts([]);
        setLoading(false);
      }
    } else {
      api.get(`/blog/${slug}`)
        .then(async res => {
          setPost(res.data);
          setNotFound(false);
          // Debug: mostrar en consola el post recibido
          console.log('BlogPost API response:', res.data);
          const relatedIds = Array.isArray(res.data.products) ? res.data.products : [];
          if (relatedIds.length > 0) {
            try {
              let products = await Promise.all(
                relatedIds.map(id => productService.getById(id).then(r => r.data).catch(() => null))
              );
              products = products.filter(Boolean).map(product => {
                let img = product.image || (product.attributes && product.attributes.image);
                if (!img && Array.isArray(product.images) && product.images.length > 0) img = product.images[0];
                if (!img && product.attributes && Array.isArray(product.attributes.images) && product.attributes.images.length > 0) img = product.attributes.images[0];
                if (!img && Array.isArray(product.gallery) && product.gallery.length > 0) img = product.gallery[0];
                return { ...product, image: getStaticUrl(img) };
              });
              // Debug: mostrar en consola los productos relacionados obtenidos
              console.log('Productos relacionados obtenidos:', products);
              setRelatedProducts(products);
            } catch (err) {
              console.error('Error obteniendo productos relacionados:', err);
              setRelatedProducts([]);
            }
          } else {
            console.warn('No hay productos relacionados en el post o está vacío.');
            setRelatedProducts([]);
          }
        })
        .catch(() => {
          setNotFound(true);
        })
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return <div>Cargando artículo...</div>;
  if (notFound || !post) return <div>Artículo no encontrado.</div>;

  const normalizedContent = post.content;
  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/blog/${post.slug || post.id}`;
  const plainText = (post.excerpt || post.content?.replace(/<[^>]+>/g, '') || '').trim();
  const metaDescription = (post.seoDescription || plainText).slice(0, 155);
  const placeholder = 'https://via.placeholder.com/600x340?text=Sin+imagen';
  const coverUrl = post.cover?.src || placeholder;
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
            alt={post.cover?.alt || post.title}
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
        <section style={{margin:'2em 0'}}>
          <h2 style={{fontSize:'1.2em',marginBottom:16}}>Productos relacionados</h2>
          {relatedProducts.length > 0 ? (
            <div style={{display:'flex',flexWrap:'wrap',gap:12,overflowX:'auto',paddingBottom:8}}>
              {relatedProducts.map(product => {
                const title = product.title || product.name || product.attributes?.name || product.attributes?.title || product.attributes?.imageAlt || 'Sin título';
                const img = product.attributes?.image || product.image || (product.images && product.images[0]) || null;
                const sku = product.sku || product.code || '';
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    style={{
                      border: '1.5px solid #ccc',
                      background: '#fff',
                      borderRadius: 10,
                      padding: '0.6em 1em',
                      cursor: 'pointer',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      minWidth: 140,
                      textAlign: 'left',
                      textDecoration: 'none',
                      color: 'inherit',
                      boxShadow: '0 1px 6px #0001',
                      transition: 'border 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.border = '2px solid #16a34a'}
                    onMouseOut={e => e.currentTarget.style.border = '1.5px solid #ccc'}
                  >
                    {img ? (
                      <img src={getStaticUrl(img)} alt={title} style={{width:48,height:48,objectFit:'cover',borderRadius:6,background:'#f3f4f6'}} />
                    ) : (
                      <div style={{width:48,height:48,background:'#f3f4f6',borderRadius:6,display:'inline-block'}} />
                    )}
                    <div style={{display:'flex',flexDirection:'column',justifyContent:'center'}}>
                      <div style={{fontSize:14, fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:110}}>{title}</div>
                      <div style={{fontSize:12, color:'var(--gray-600)'}}>{sku}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{color:'#888',fontSize:'1em'}}>No hay productos relacionados para este artículo o no se pudieron cargar.</div>
          )}
        </section>
        <div style={{marginTop:'2em'}}>
          <Link to="/blog" style={{color:'#38bdf8',fontWeight:600}}>&larr; Volver al blog</Link>
        </div>
      </article>
    </>
  );
}

export default BlogPost;
