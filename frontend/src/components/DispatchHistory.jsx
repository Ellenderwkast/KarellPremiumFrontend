import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import './dispatchHistory.css';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommentIcon from '@mui/icons-material/Comment';
import DoneIcon from '@mui/icons-material/Done';

export default function DispatchHistory() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // pickup selected for modal

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [responseView, setResponseView] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/dispatch/historial')
      .then(res => { if (mounted) setPickups(res.data || []); })
      .catch(err => { if (mounted) setError(err?.response?.data?.message || err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selected) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return undefined;
  }, [selected]);

  function formatDateTime(value) {
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value || '-';
      return d.toLocaleString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return value || '-';
    }
  }

  const handleChangePage = (event, newPage) => { setPage(newPage); };
  const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

  async function markRealizada(id) {
    try {
      await api.patch(`/dispatch/realizada/${id}`);
      setPickups(prev => prev.map(x => x.id === id ? { ...x, realizada: true } : x));
    } catch (err) {
      console.error('markRealizada error', err);
      alert('No se pudo marcar como realizada');
    }
  }

  // Modal component (detail)
  function ModalPortal({ children, onClose, title, meta, data }) {
    useEffect(() => {
      function onKey(e) { if (e.key === 'Escape') onClose(); }
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleCopy = async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); } catch (err) { console.error('Copy failed', err); }
    };

    const handleDownload = () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `recogida-${data.id || 'detalle'}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    };

    return ReactDOM.createPortal(
      <div className="modal-portal-backdrop" onClick={onClose} role="presentation" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1300}}>
        <div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title || 'Detalle'} style={{width:'min(900px,96%)',maxHeight:'90vh',overflowY:'auto',background:'#fff',borderRadius:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #eee'}}>
            <div>
              <div style={{fontWeight:600}}>{title}</div>
              {meta && <div style={{fontSize:12,color:'#666'}}>{meta}</div>}
            </div>
            <div style={{display:'flex',gap:8}}>
              <Tooltip title="Copiar JSON"><IconButton size="small" onClick={handleCopy}>📋</IconButton></Tooltip>
              <Tooltip title="Descargar JSON"><IconButton size="small" onClick={handleDownload}>⬇️</IconButton></Tooltip>
              <Button onClick={onClose} size="small">Cerrar</Button>
            </div>
          </div>
          <div style={{padding:16}}>
            <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      </div>, document.body
    );
  }

  return (
    <div className="dispatch-history" style={{width:'100%'}}>
      <h3 style={{marginTop:0}}>Historial de Recogidas</h3>
      {loading && <div>Cargando...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && pickups.length === 0 && <div>No hay registros.</div>}

      {!loading && pickups.length > 0 && (
        <Paper
          variant="outlined"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            boxSizing: 'border-box',
            overflowX: 'auto'
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{minWidth:160}}>Fecha / Hora</TableCell>
                  <TableCell>Destinatario</TableCell>
                  <TableCell>Referencia</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Respuesta</TableCell>
                  <TableCell align="right">Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pickups.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>{formatDateTime(p.fecha_recogida)}</TableCell>
                    <TableCell style={{maxWidth:240}}><div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={p.nombre_destinatario || ''}>{p.nombre_destinatario || '-'}</div></TableCell>
                    <TableCell style={{maxWidth:160}}><div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={p.referencia || ''}>{p.referencia || '-'}</div></TableCell>
                    <TableCell>{p.telefono_destinatario || '-'}</TableCell>
                    <TableCell style={{maxWidth:140}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={p.respuesta_mensaje || ''}>
                          {p.respuesta_mensaje ? (p.respuesta_mensaje.length > 60 ? `${p.respuesta_mensaje.slice(0,60)}...` : p.respuesta_mensaje) : '-'}
                        </div>
                        <Tooltip title="Ver respuesta completa">
                          <IconButton size="small" onClick={() => setResponseView(p.respuesta_mensaje || '')} aria-label="Ver respuesta">
                            <CommentIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell align="right">{p.realizada ? <span style={{color:'#16a34a',display:'inline-flex',alignItems:'center',gap:6}}><DoneIcon fontSize="small"/>Realizada</span> : <span style={{color:'#f59e0b'}}>Pendiente</span>}</TableCell>
                    <TableCell align="right">
                      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                        <Tooltip title="Ver detalle"><IconButton size="small" onClick={() => setSelected(p)}><VisibilityIcon fontSize="small"/></IconButton></Tooltip>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => markRealizada(p.id)}
                          style={{ visibility: p.realizada ? 'hidden' : 'visible' }}
                          disabled={p.realizada}
                        >
                          Marcar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={pickups.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5,10,25]}
          />
        </Paper>
      )}

      {selected && (
        <ModalPortal
          onClose={() => setSelected(null)}
          title={`Detalle — Recogida #${selected.id}`}
          meta={`${selected.nombre_destinatario || ''} • ${formatDateTime(selected.fecha_recogida) || ''}`}
          data={selected}
        />
      )}

      {responseView !== null && ReactDOM.createPortal(
        <div className="modal-portal-backdrop" onClick={() => setResponseView(null)} role="presentation" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1400}}>
          <div onClick={e => e.stopPropagation()} style={{width:'min(720px,94%)',maxHeight:'80vh',overflowY:'auto',background:'#fff',borderRadius:8,padding:16}} role="dialog" aria-modal="true" aria-label="Respuesta completa">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:700}}>Respuesta completa</div>
              <div style={{display:'flex',gap:8}}>
                <Tooltip title="Copiar respuesta"><IconButton size="small" onClick={async () => { try { await navigator.clipboard.writeText(responseView || ''); } catch (e) { console.error(e); } }}><span>📋</span></IconButton></Tooltip>
                <Button size="small" onClick={() => setResponseView(null)}>Cerrar</Button>
              </div>
            </div>
            <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{responseView || ''}</pre>
          </div>
        </div>, document.body)
      }
    </div>
  );
}
