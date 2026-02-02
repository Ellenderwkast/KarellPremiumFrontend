import React, { useEffect, useState } from 'react';
import { shipmentService } from '../services/shipmentService';
import InlineSpinner from './InlineSpinner';
import PageSizeSelect from './ui/PageSizeSelect';
import { shippingStatusService } from '../services/shippingStatusService';

export default function ShipmentGuideList({
  guides,
  loading,
  error,
  onRefresh,
  onCreateGuide,
  onVoid,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  filter,
  onFilterChange,
  creatingGuideId
}) {
  const [voidingId, setVoidingId] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [statusEdit, setStatusEdit] = useState({});
  const [statusSaving, setStatusSaving] = useState({});
  const [statusError, setStatusError] = useState({});
  const [searchTerm, setSearchTerm] = useState(filter || '');

  // Estados internos
  const internalStatuses = [
    { code: 'pending_guide', name: 'Pendiente de guía', color: '#fbbf24' },
    { code: 'guide_created', name: 'Guía generada', color: '#818cf8' },
    { code: 'in_transit', name: 'En tránsito', color: '#38bdf8' },
    { code: 'delivered', name: 'Entregado', color: '#4ade80' },
    { code: 'cancelled', name: 'Cancelado', color: '#f87171' },
    { code: 'error', name: 'Error', color: '#f43f5e' }
  ];

  // Contenedor responsive de tabla
  const TableContainer = ({ children }) => (
    <div style={{ width: '100%', overflowX: 'auto', marginBottom: 12 }}>
      <table
        style={{
          minWidth: 900,
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden'
        }}
      >
        {children}
      </table>
    </div>
  );

  useEffect(() => {
    let mounted = true;
    const fetchStatuses = async () => {
      try {
        const res = await shippingStatusService.list();
        let custom = Array.isArray(res.data)
          ? res.data.filter(s => s.active !== false)
          : [];
        custom = custom.map(s => ({ ...s, color: s.color || '#e5e7eb' }));
        const customCodes = new Set(custom.map(s => s.code));
        const merged = [
          ...internalStatuses.filter(s => !customCodes.has(s.code)),
          ...custom
        ];
        if (mounted) setStatuses(merged);
      } catch {
        // no bloquear UI
      }
    };
    fetchStatuses();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSearchTerm(filter || '');
  }, [filter]);

  const triggerSearch = () => {
    if (typeof onFilterChange === 'function') {
      onFilterChange(searchTerm);
    }
  };

  const handleVoid = async (orderId) => {
    if (!orderId) return;
    if (!confirm(`¿Confirmas anular la guía para la orden ${orderId}? Esta acción no es reversible.`)) return;
    try {
      setVoidingId(orderId);
      if (onVoid) {
        await onVoid(orderId);
      } else {
        await shipmentService.voidGuide(orderId);
      }
      if (onRefresh) await onRefresh();
      alert('Guía anulada correctamente');
    } catch (err) {
      alert('Error anulando guía: ' + (err?.response?.data?.message || err.message));
    } finally {
      setVoidingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h4 style={{ margin: 0 }}>Guías generadas</h4>
          {typeof onPageSizeChange === 'function' && (
            <PageSizeSelect
              compact
              pageSize={pageSize}
              setPageSize={onPageSizeChange}
              storageKey="guides_page_size"
            />
          )}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            triggerSearch();
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            type="text"
            placeholder="Buscar por # orden, guía, estado..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            disabled={loading}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <button disabled={loading} style={{ padding: '0 16px', borderRadius: 8 }}>
            {loading && <InlineSpinner size={14} />}
            Buscar
          </button>
        </form>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {/* TABLA */}
      <TableContainer>
        <thead style={{ background: '#f1f5f9' }}>
          <tr>
            <th># Orden</th>
            <th>Guía</th>
            <th>Transportadora</th>
            <th>Estado</th>
            <th>Tracking</th>
            <th>Último evento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {guides?.length ? (
            guides.map(g => (
              <tr key={g.id}>
                <td align="center">{g.orderId}</td>
                <td align="center">{g.guideNumber || 'No generada'}</td>
                <td align="center">{g.carrier}</td>
                <td align="center">
                  <select
                    value={statusEdit[g.orderId] ?? g.status}
                    disabled={statusSaving[g.orderId] || loading}
                    onChange={async e => {
                      const newStatus = e.target.value;
                      setStatusEdit(p => ({ ...p, [g.orderId]: newStatus }));
                      setStatusSaving(p => ({ ...p, [g.orderId]: true }));
                      try {
                        await shipmentService.updateStatus(g.orderId, newStatus);
                        onRefresh?.();
                      } catch {
                        setStatusError(p => ({ ...p, [g.orderId]: 'Error al actualizar' }));
                      } finally {
                        setStatusSaving(p => ({ ...p, [g.orderId]: false }));
                      }
                    }}
                  >
                    {statuses.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {statusError[g.orderId] && <div style={{ color: 'red' }}>{statusError[g.orderId]}</div>}
                </td>
                <td align="center">
                  {g.trackingUrl ? (
                    <a href={g.trackingUrl} target="_blank" rel="noopener noreferrer">
                      Ver tracking
                    </a>
                  ) : '-'}
                </td>
                <td align="center">
                  {statuses.find(s => s.code === g.lastTrackingStatus)?.name || '-'}
                </td>
                <td align="center">
                  <button
                    disabled={loading || creatingGuideId === g.orderId}
                    onClick={() => onCreateGuide?.(g.orderId)}
                  >
                    {creatingGuideId === g.orderId ? 'Creando...' : 'Crear guía'}
                  </button>
                  <button
                    disabled={loading || voidingId === g.orderId}
                    onClick={() => handleVoid(g.orderId)}
                  >
                    Anular
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} align="center" style={{ padding: 16 }}>
                No hay guías registradas
              </td>
            </tr>
          )}
        </tbody>
      </TableContainer>

      {/* PAGINACIÓN */}
      {total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Anterior
          </button>
          <span style={{ margin: '0 12px' }}>
            Página {page} de {Math.ceil(total / pageSize)}
          </span>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => onPageChange(page + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
