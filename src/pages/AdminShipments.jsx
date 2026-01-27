


import { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ShipmentGuideList from '../components/ShipmentGuideList';
import { shipmentService } from '../services/shipmentService';

function Guias() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [creatingGuideId, setCreatingGuideId] = useState(null);
  const filterTimeout = useRef();
  const [debouncedFilter, setDebouncedFilter] = useState('');

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, pageSize, filter: debouncedFilter.trim() };
      const res = await shipmentService.list(params);
      setGuides(res.data?.rows || res.data || []);
      setTotal(res.data?.count ?? (res.data?.rows ? res.data.rows.length : (res.data?.length || 0)));
    } catch (err) {
      setError('Error cargando guías');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedFilter]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  useEffect(() => {
    if (filterTimeout.current) clearTimeout(filterTimeout.current);
    filterTimeout.current = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 400);
    return () => {
      if (filterTimeout.current) clearTimeout(filterTimeout.current);
    };
  }, [filter]);

  const handleRefresh = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      if (orderId !== undefined) {
        const idNum = Number(orderId);
        if (orderId && !isNaN(idNum) && Number.isInteger(idNum) && idNum > 0) {
          await shipmentService.refreshTracking(idNum);
        }
      }
      await fetchGuides();
    } catch (err) {
      setError('Error refrescando tracking');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuide = async (orderId) => {
    const idNum = Number(orderId);
    if (!orderId || isNaN(idNum) || !Number.isInteger(idNum) || idNum <= 0) {
      setError('ID de orden inválido');
      return;
    }
    setCreatingGuideId(idNum);
    setLoading(true);
    setError(null);
    try {
      const res = await shipmentService.createGuide(idNum);
      // Si el backend retornó un error en el payload, mostrarlo
      if (res?.data && res.data.error) {
        setError(res.data.error);
        alert('Error creando guía: ' + res.data.error);
      } else {
        alert('Guía creada correctamente para la orden ' + idNum);
      }
      await fetchGuides();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || String(err);
      setError('Error creando guía: ' + msg);
      alert('Error creando guía: ' + msg);
    } finally {
      setCreatingGuideId(null);
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(total / pageSize)) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
  };

  return (
    <div>
      <ShipmentGuideList
        guides={guides}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onCreateGuide={handleCreateGuide}
        creatingGuideId={creatingGuideId}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
        filter={filter}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
import CarrierManager from '../components/CarrierManager';
function Transportadoras() {
  return <CarrierManager />;
}
import DispatchManager from '../components/DispatchManager';
import ShippingStatusManager from '../components/ShippingStatusManager';
function EstadosEnvio() {
  return <ShippingStatusManager />;
}
import GuideErrorManager from '../components/GuideErrorManager';
function ErroresGuia() {
  return <GuideErrorManager />;
}

import TrackingManager from '../components/TrackingManager';
function Tracking() {
  return <TrackingManager />;
}
import RetryManager from '../components/RetryManager';
function Reintentos() {
  return <RetryManager />;
}

const submodules = [
  { key: 'guias', label: 'Guías', component: <Guias /> },
  { key: 'transportadoras', label: 'Transportadoras', component: <Transportadoras /> },
  { key: 'estados', label: 'Estados de envío', component: <EstadosEnvio /> },
  { key: 'errores', label: 'Errores de guía', component: <ErroresGuia /> },
  { key: 'tracking', label: 'Tracking', component: <Tracking /> },
  { key: 'reintentos', label: 'Reintentos', component: <Reintentos /> },
];

export default function AdminShipments() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  const [active, setActive] = useState('guias');
  const current = submodules.find(s => s.key === active);
  return (
    <div style={{ padding: 24 }}>
      <h2>Gestión de envíos</h2>
      <div className="ship-submodules">
        {submodules.map(s => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={`submodule-btn ${active === s.key ? 'active' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 24, minHeight: 200 }}>
        {current?.component}
      </div>
    </div>
  );
}
