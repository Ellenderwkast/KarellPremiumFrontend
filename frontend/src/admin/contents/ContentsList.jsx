import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminPosts, deletePost } from './api';
import { getStaticUrl } from '../../services/api';

function ContentsList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // En el panel de administración queremos ver todas las publicaciones
        const resp = await fetchAdminPosts();
        const data = resp?.data ?? resp;
        if (!mounted) return;
        // Aceptar formato { posts: [...] } o array directo
        let rows = Array.isArray(data) ? data : (data.posts || data.rows || []);
        setPosts(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.error('fetchPosts error', err);
        if (!mounted) return;
        setError('No se pudieron cargar las publicaciones. Verifica el backend.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // Manejar eliminación de una publicación (optimista + manejo de errores)
  const handleDelete = async (postId) => {
    try {
      setLoading(true);
      await deletePost(postId);
      // actualizar estado de forma optimista sin refetch costoso
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('deletePost error', err);
      alert('No se pudo eliminar la publicación. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-contents-list">
      <div className="list-header">
        <h1>Publicaciones del Blog</h1>
        <div className="list-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/contents/new')}>Nueva publicación</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando publicaciones...</div>
      ) : error ? (
        <div className="error" style={{color: 'var(--danger)', marginTop: 12}}>{error}</div>
      ) : posts.length === 0 ? (
        <p className="info-text">No hay publicaciones aún.</p>
      ) : (
        <div className="table-container">
          <table className="admin-table" style={{marginTop:'2em'}}>
            <thead>
              <tr>
                <th>Portada</th>
                <th>Título</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} style={{borderBottom:'1px solid #eee'}}>
                  <td>
                    {post.cover ? (
                      <img src={getStaticUrl(post.cover)} alt={post.title} style={{width:80,borderRadius:8}} />
                    ) : (
                      <div style={{width:80,height:48,background:'#eee',borderRadius:8}} />
                    )}
                  </td>
                  <td>{post.title}</td>
                  <td>{post.category || (post.tags || []).join(', ')}</td>
                  <td>{post.publishDate ? new Date(post.publishDate).toLocaleString() : '-'}</td>
                  <td>{post.status || (post.published ? 'Publicado' : 'Borrador')}</td>
                  <td style={{display:'flex',gap:8}}>
                    <button className="btn" onClick={() => navigate(`/admin/contents/edit/${post.id}`)}>Editar</button>
                    <button
                      className="btn btn-danger"
                      aria-label={"Eliminar publicación"}
                      title={"Eliminar"}
                      style={{padding:6, width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:8}}
                      onClick={() => {
                        const ok = window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.');
                        if (!ok) return;
                        handleDelete(post.id);
                      }}
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM8 6a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6A.5.5 0 0 1 8 6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2.5a1 1 0 1 1 0-2H5h6h2.5a1 1 0 0 1 1 1zM11 4H5v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ContentsList;
