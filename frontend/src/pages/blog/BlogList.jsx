import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getStaticUrl } from '../../services/api';
import SEO from '../../components/SEO';
import StructuredData from '../../components/StructuredData';

function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blog')
      .then(res => setPosts(res.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Cargando artículos...</div>;

  const baseUrl = window.location.origin;
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
      }
    ]
  };

  const blogListData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    url: `${baseUrl}/blog`,
    name: 'Blog de tecnología y audífonos Karell Premium',
    description:
      'Artículos, guías y consejos sobre audífonos, gadgets y tecnología premium en Colombia de Karell Premium.',
    blogPost: posts.map(post => {
      const plainText = (post.excerpt || post.content?.replace(/<[^>]+>/g, '') || '').trim();
      const description = plainText ? `${plainText.slice(0, 155)}${plainText.length > 155 ? '…' : ''}` : undefined;
      return {
        '@type': 'BlogPosting',
        headline: post.seoTitle || post.title,
        url: `${baseUrl}/blog/${post.slug || post.id}`,
        image: getStaticUrl(post.cover),
        datePublished: post.publishDate,
        description
      };
    })
  };

  return (
    <>
      <SEO
        title="Blog de tecnología y audífonos en Colombia"
        description="Artículos, guías y consejos sobre audífonos, gadgets y tecnología premium en Colombia. Descubre cómo sacar el máximo provecho a tus productos Karell Premium."
      />
      <StructuredData type="breadcrumb-blog" data={breadcrumbData} />
      <StructuredData type="blog-list" data={blogListData} />
      <div className="blog-list-page container">
        <h1>Blog</h1>
        <div className="blog-list-grid" style={{
        display: 'grid',
        gap: '2em',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        marginTop: '2em',
        alignItems: 'stretch'
      }}>
        {posts.map(post => (
          <div key={post.id} className="blog-card" style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 12px #0001',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
            height: '100%'
          }}>
            <Link to={`/blog/${post.slug || post.id}`} style={{textDecoration:'none',color:'inherit'}}>
              <div style={{
                width: '100%',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '28vw',
                minHeight: 140,
                maxHeight: 220
              }}>
              <img src={getStaticUrl(post.cover)} alt={post.title} style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  background: '#f8fafc',
                  width: 'auto',
                  height: 'auto',
                  aspectRatio: '16/9',
                  display: 'block'
                }} />
              </div>
              <div style={{padding:'1.2em'}}>
                <div style={{fontSize:'0.95em',color:'#38bdf8',fontWeight:600}}>{post.category}</div>
                <h2 style={{fontSize:'1.25em',margin:'0.5em 0 0.2em'}}>{post.title}</h2>
                <div style={{color:'#888',fontSize:'0.95em',marginBottom:'0.7em'}}>{new Date(post.publishDate).toLocaleDateString()}</div>
                <div style={{color:'#444',fontSize:'1em',marginBottom:'1em'}}>{post.excerpt || (post.content?.replace(/<[^>]+>/g,'').slice(0,120)+'...')}</div>
                <span style={{color:'#16a34a',fontWeight:600}}>Leer más →</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}

export default BlogList;
