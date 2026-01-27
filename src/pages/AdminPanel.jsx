import React, { useEffect, useMemo, useState } from 'react';
import DispatchHistory from '../components/DispatchHistory.jsx';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import '../styles/productFormMui.css';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Cog,
  Crown,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  MapPin,
  Package,
  Pencil,
  PhoneCall,
  Plus,
  Save,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Trash2,
  Unlock,
  User,
  Users,
  X,
  XCircle,
  Truck,
  BookOpen,
  Send
 ,
  CreditCard
} from 'lucide-react';
import AdminShipments from './AdminShipments';
import AdminDespacho from './AdminDespacho';
import AdminContentsRoutes from './AdminContentsRoutes';
import { ContentsDashboard, ContentsList, NewContent, EditContent } from '../admin/contents';
import { useAuthStore } from '../store/authStore';
import { productService, authService, orderService, productInterestService } from '../services/api';
import api, { getStaticUrl } from '../services/api';
import '../styles/adminPanel.css';

export default function AdminPanel() {
  // --- Paginación de pedidos ---
  // (debe ir después de declarar orders y ordersPage)
  const location = useLocation();
  const { user, isAuthenticated: _isAuthenticated } = useAuthStore();
  // Redirección si no está autenticado o no es admin
  if (!_isAuthenticated || !user?.isAdmin) {
    window.location.replace('/login');
    return null;
  }
  
  // Estados para productos
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saveAlert, setSaveAlert] = useState(null); // { type: 'success'|'error', message: string }
  const [_imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeMainImage, setRemoveMainImage] = useState(false);
  const [additionalImageFiles, setAdditionalImageFiles] = useState([null, null]);
  const [colorVariants, setColorVariants] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    // Campos Coordinadora
    coordinadoraType: '',
    weight: '',
    declaredValue: '',
    length: '',
    width: '',
    height: ''
  });

  // Estados para usuarios
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, _setCreatingUser] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    isAdmin: false
  });

  // Estados para órdenes
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderData, setEditOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingCost: '',
    paymentMethod: 'other',
    paymentReference: '',
    sourceChannel: 'web',
    subtotal: '',
    total: ''
  });
  const [savingOrderEdit, setSavingOrderEdit] = useState(false);
  // --- Paginación y constantes ---
  const ORDER_STATUS_VALUES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  const ORDERS_PAGE_SIZE = 100;
  const INTERESTS_PAGE_SIZE = 100;
  const AUDIT_PAGE_SIZE = 100;
  const USERS_PAGE_SIZE = 100;

  const ordersTotal = Array.isArray(orders) ? orders.length : 0;
  const ordersTotalPages = Math.max(1, Math.ceil(ordersTotal / ORDERS_PAGE_SIZE));
  const clampedOrdersPage = Math.max(1, Math.min(ordersPage, ordersTotalPages));

  // Determina la pestaña activa según la ruta
  const activeTab = useMemo(() => {
    const p = (location?.pathname || '');
    if (!p.startsWith('/admin/')) return 'dashboard';
    // Support both /admin/despacho and nested paths like /admin/shipments/despacho
    if (p.includes('/despacho')) return 'despacho';
    const parts = p.split('/');
    return parts[2] || 'dashboard';
  }, [location.pathname]);

  // Simple paginación y filtros seguros para evitar errores si datos son undefined
  const usersTotal = Array.isArray(users) ? users.length : 0;
  const usersPages = Math.max(1, Math.ceil(usersTotal / USERS_PAGE_SIZE));
  const clampedUsersPage = Math.max(1, Math.min(usersPage, usersPages));
  const usersStartIndex = (clampedUsersPage - 1) * USERS_PAGE_SIZE;
  const usersEndIndexExclusive = Math.min(usersStartIndex + USERS_PAGE_SIZE, usersTotal);

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    const q = (userSearch || '').toString().toLowerCase().trim();
    if (!q) return true;
    return (u.name || '').toString().toLowerCase().includes(q) ||
      (u.lastName || '').toString().toLowerCase().includes(q) ||
      (u.email || '').toString().toLowerCase().includes(q);
  });
  const pagedUsers = filteredUsers.slice(usersStartIndex, usersEndIndexExclusive);

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(o => {
    const q = (orderSearch || '').toString().toLowerCase().trim();
    if (q) {
      if ((o.id && o.id.toString().includes(q)) || (o.customerName || '').toLowerCase().includes(q) || (o.customerEmail || '').toLowerCase().includes(q)) {
        // incluye
      } else {
        return false;
      }
    }
    if (statusFilter && normalizeOrderStatus(o.status) !== statusFilter) return false;
    if (channelFilter && ((o.sourceChannel || '').toString().toLowerCase() !== channelFilter)) return false;
    return true;
  });
  const ordersStartIndex = (clampedOrdersPage - 1) * ORDERS_PAGE_SIZE;
  const ordersEndIndexExclusive = Math.min(ordersStartIndex + ORDERS_PAGE_SIZE, ordersTotal);
  const pagedOrders = filteredOrders.slice(ordersStartIndex, ordersEndIndexExclusive);

  // Funciones de carga y acciones reales (intentan usar los servicios API)
  const loadData = async () => {
    try {
      setLoading(true);
      const [prodResp, usersResp, ordersResp, interestsResp] = await Promise.all([
        productService.getAllAdmin().catch(() => ({ data: [] })),
        authService.getAllUsers().catch(() => ({ data: [] })),
        orderService.getAllAdmin().catch(() => ({ data: [] })),
        productInterestService.list({ page: 1, perPage: INTERESTS_PAGE_SIZE }).catch(() => ({ data: { data: [], total: 0 } }))
      ]);

      const prodList = prodResp?.data ?? prodResp;
      setProducts(Array.isArray(prodList) ? prodList : []);

      let usersList = usersResp?.data ?? usersResp;
      if (usersList && usersList.users) usersList = usersList.users;
      if (usersList && usersList.rows) usersList = usersList.rows;
      setUsers(Array.isArray(usersList) ? usersList : []);

      let ordersList = ordersResp?.data ?? ordersResp;
      if (ordersList && ordersList.rows) ordersList = ordersList.rows;
      setOrders(Array.isArray(ordersList) ? ordersList : []);

      // El endpoint del backend devuelve: { data: rows, page, pages, total }
      let interestsData = interestsResp?.data ?? interestsResp;
      let interestsRows = [];
      let interestsTotal = 0;
      if (interestsData) {
        // Cuando axios devuelve, interestsResp.data es el objeto con keys { data, total }
        if (Array.isArray(interestsData)) {
          interestsRows = interestsData;
          interestsTotal = interestsData.length;
        } else if (Array.isArray(interestsData.data)) {
          interestsRows = interestsData.data;
          interestsTotal = Number(interestsData.total) || interestsRows.length;
        } else if (Array.isArray(interestsData.rows)) {
          interestsRows = interestsData.rows;
          interestsTotal = Number(interestsData.total) || interestsRows.length;
        }
      }
      setInterestRows(interestsRows);
      setInterestTotal(interestsTotal);
    } catch (err) {
      console.error('loadData error', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async (_page = 1, _q = '') => {
    setAuditLoading(true);
    _setAuditError('');
    try {
      const resp = await api.get('/audit-logs', { params: { page: _page, q: _q, limit: AUDIT_PAGE_SIZE } });
      const body = resp?.data ?? resp;
      // backend responde { data, page, limit, total, pages }
      const rows = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
      const total = Number(body?.total) || (Array.isArray(rows) ? rows.length : 0);
      const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
      setAuditLogs(rows);
      setAuditTotal(total);
      setAuditPages(pages);
      _setAuditPage(Number(body?.page) || _page);
    } catch (err) {
      console.error('loadAuditLogs', err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        _setAuditError('Acceso denegado. Inicia sesión como administrador para ver el historial.');
      } else {
        _setAuditError('No se pudieron cargar los registros de historial. Verifica que el backend esté ejecutándose.');
      }
      setAuditLogs([]);
      setAuditTotal(0);
      setAuditPages(1);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadInterests = async (page = 1, q = '') => {
    setInterestLoading(true);
    setInterestError('');
    try {
      const resp = await productInterestService.list({ page, q, perPage: INTERESTS_PAGE_SIZE });
      const body = resp?.data ?? resp;
      let rows = [];
      let total = 0;
      if (Array.isArray(body)) {
        rows = body;
        total = body.length;
      } else if (body) {
        if (Array.isArray(body.data)) {
          rows = body.data;
        } else if (Array.isArray(body.rows)) {
          rows = body.rows;
        }
        total = Number(body.total) || rows.length;
      }

      setInterestRows(rows);
      setInterestTotal(total);
      setInterestPages(Math.max(1, Math.ceil(total / INTERESTS_PAGE_SIZE)));
      setInterestPage(page);
    } catch (err) {
      console.error('loadInterests', err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setInterestError('Acceso denegado. Inicia sesión como administrador para ver las solicitudes.');
      } else {
        setInterestError('No se pudieron cargar las solicitudes. Verifica que el backend esté ejecutándose.');
      }
      setInterestRows([]);
      setInterestTotal(0);
      setInterestPages(1);
      // Mock temporal para desarrollo: si la carga falla, poblar con datos de ejemplo
      try {
        const sampleInterests = [
          {
            id: 'mock-1',
            createdAt: new Date().toISOString(),
            productId: 101,
            Product: { title: 'Camiseta Demo' },
            name: 'Juan Pérez',
            whatsapp: '+57 300 0000001',
            status: 'new'
          },
          {
            id: 'mock-2',
            createdAt: new Date().toISOString(),
            productId: 102,
            Product: { title: 'Sudadera Demo' },
            name: 'María Gómez',
            whatsapp: '+57 300 0000002',
            status: 'contacted'
          }
        ];
        setInterestRows(sampleInterests);
        setInterestTotal(sampleInterests.length);
        setInterestPages(1);
        setInterestPage(1);
        setInterestMocked(true);
        // Limpiar el mensaje de error para no solapar con la UI mock
        setInterestError('');
      } catch (mErr) {
        console.error('mock interests failed', mErr);
      }
    } finally {
      setInterestLoading(false);
    }
  };

  const markInterestContacted = async (row) => {
    if (!row || !row.id) return;
    try {
      setContactingInterestId(row.id);
      setInterestLoading(true);
      try {
        await productInterestService.update(row.id, { status: 'contacted' });
      } catch (err) {
        // Si falla la petición pero estamos en modo mock, aplicar cambio localmente
        if (interestMocked) {
          console.warn('API update failed, applying mock change locally', err);
        } else {
          throw err;
        }
      }
      setInterestRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'contacted' } : r));
    } catch (err) {
      console.error('markInterestContacted error', err);
      alert('No se pudo marcar la solicitud como contactada.');
    } finally {
      setContactingInterestId(null);
      setInterestLoading(false);
    }
  };

  const handleDeleteInterest = async (row) => {
    if (!row || !row.id) return;
    if (!window.confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
    try {
      setDeletingInterestId(row.id);
      setInterestLoading(true);
      await productInterestService.delete(row.id);
      setInterestRows(prev => (Array.isArray(prev) ? prev.filter(r => r.id !== row.id) : []));
      setInterestTotal(prev => Math.max(0, (Number(prev) || 0) - 1));
    } catch (err) {
      console.error('handleDeleteInterest error', err);
      alert('No se pudo eliminar la solicitud. Revisa la consola.');
    } finally {
      setDeletingInterestId(null);
      setInterestLoading(false);
    }
  };

  

  const handleCreateUser = async (e) => {
    e?.preventDefault?.();
    try {
      _setCreatingUser(true);
      const payload = {
        name: createUserData.name,
        lastName: createUserData.lastName,
        email: createUserData.email,
        password: createUserData.password,
        phone: createUserData.phone,
        city: createUserData.city,
        isAdmin: Boolean(createUserData.isAdmin)
      };
      const resp = await authService.createUser(payload);
      const newUser = resp?.data ?? resp;
      // actualizar lista localmente prefiriendo no refetch completo
      setUsers(prev => Array.isArray(prev) ? [newUser, ...prev] : [newUser]);
      // reset form y cerrar modal
      setCreateUserData({ name: '', lastName: '', email: '', password: '', phone: '', city: '', isAdmin: false });
      setShowCreateUserModal(false);
    } catch (err) {
      console.error('createUser error', err);
      alert(err?.response?.data?.message || 'No se pudo crear el usuario.');
    } finally {
      _setCreatingUser(false);
    }
  };
  const handleNewProduct = () => { 
    // reset form data for a new product
    setFormData({ title: '', description: '', price: '', stock: '', sku: '', coordinadoraType: '', weight: '', declaredValue: '', length: '', width: '', height: '' });
    setColorVariants([]);
    setImagePreview(null);
    setAdditionalImageFiles([null, null]);
    setEditingProduct(null);
    setShowForm(true);
    setRemoveMainImage(false);
  };

  // auto-hide save alerts
  useEffect(() => {
    if (!saveAlert) return;
    const t = setTimeout(() => setSaveAlert(null), 4000);
    return () => clearTimeout(t);
  }, [saveAlert]);

  const handleSaveProduct = async (e) => {
    e?.preventDefault?.();
    try {
      // construir attributes a partir del producto existente y los campos del formulario
      const baseAttrs = (editingProduct && editingProduct.attributes) ? { ...editingProduct.attributes } : {};

      // helper para subir un archivo y obtener la ruta/url retornada por el servidor
      const uploadSingle = async (file) => {
        if (!file) return null;
        if (typeof file === 'string') return file;
        const form = new FormData();
        form.append('image', file);
        try {
          const resp = await productService.uploadImage(form, { headers: { 'Content-Type': 'multipart/form-data' } });
          const data = resp?.data ?? resp;
          return data?.url || data?.path || data;
        } catch (err) {
          console.error('uploadSingle error', err);
          return null;
        }
      };

      // subir imagen principal si el usuario seleccionó un archivo
      let uploadedMain = baseAttrs.image || null;
      // Si el usuario marcó eliminar la imagen principal en el editor,
      // forzamos uploadedMain a null para que el backend la borre/limpie.
      if (removeMainImage) uploadedMain = null;
      if (_imageFile) {
        const up = await uploadSingle(_imageFile);
        if (up) uploadedMain = up;
      }

      // subir galería (máx 2)
      const galleryFiles = Array.isArray(additionalImageFiles) ? additionalImageFiles : [];
      const galleryPaths = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const f = galleryFiles[i];
        if (!f) continue;
        const p = await uploadSingle(f);
        if (p) galleryPaths.push(p);
      }

      // subir imágenes de variantes (si hay archivos nuevos)
      const nextColorVariants = Array.isArray(colorVariants)
        ? colorVariants.map(v => ({ ...v, images: Array.isArray(v.images) ? [...v.images] : [] }))
        : (Array.isArray(baseAttrs.colorVariants) ? baseAttrs.colorVariants : []);
      for (let vi = 0; vi < nextColorVariants.length; vi++) {
        const v = nextColorVariants[vi];
        if (!v) continue;
        const imgs = Array.isArray(v.images) ? v.images : [];
        for (let ii = 0; ii < imgs.length; ii++) {
          const imgFile = imgs[ii];
          if (!imgFile) continue;
          if (typeof imgFile === 'string') continue; // ya es ruta
          const p = await uploadSingle(imgFile);
          if (p) imgs[ii] = p;
        }
        nextColorVariants[vi].images = imgs;
      }
      // Si no se proporcionó una imagen principal, intentar usar la primera imagen
      // válida de la primera variante para evitar dejar una ruta local en attributes.image.
      if (!uploadedMain) {
        const firstVariantImg = (Array.isArray(nextColorVariants) && nextColorVariants.length > 0)
          ? (Array.isArray(nextColorVariants[0].images) ? nextColorVariants[0].images.find(Boolean) : (nextColorVariants[0].image || null))
          : null;
        if (firstVariantImg && typeof firstVariantImg === 'string') {
          uploadedMain = firstVariantImg;
        }
      }
      // Construir atributos sin sobreescribir campos de "coordinadora" existentes
      const mergedCoordinadora = { ...(baseAttrs.coordinadora || {}) };
      // Solo reemplazar si el campo del formulario contiene un valor no vacío
      if (formData.coordinadoraType !== undefined && formData.coordinadoraType !== '') mergedCoordinadora.type = formData.coordinadoraType;
      if (formData.weight !== undefined && formData.weight !== '') mergedCoordinadora.weight = formData.weight;
      if (formData.declaredValue !== undefined && formData.declaredValue !== '') mergedCoordinadora.declaredValue = formData.declaredValue;
      if (formData.length !== undefined && formData.length !== '') mergedCoordinadora.length = formData.length;
      if (formData.width !== undefined && formData.width !== '') mergedCoordinadora.width = formData.width;
      if (formData.height !== undefined && formData.height !== '') mergedCoordinadora.height = formData.height;

      const nextAttrs = {
        ...baseAttrs,
        image: uploadedMain || null,
        gallery: galleryPaths.length > 0 ? galleryPaths : (Array.isArray(baseAttrs.gallery) ? baseAttrs.gallery : (Array.isArray(baseAttrs.images) ? baseAttrs.images : [])),
        colorVariants: nextColorVariants,
        // Mantener objeto "coordinadora" combinado (si había uno, lo preservamos y actualizamos solo con valores válidos)
        coordinadora: mergedCoordinadora,
        // Compatibilidad: mantener claves top-level si existen (no sobreescribir con cadena vacía)
        coordinadoraType: mergedCoordinadora.type ?? baseAttrs.coordinadoraType ?? '',
        weight: mergedCoordinadora.weight ?? baseAttrs.weight ?? '',
        declaredValue: mergedCoordinadora.declaredValue ?? baseAttrs.declaredValue ?? '',
        length: mergedCoordinadora.length ?? baseAttrs.length ?? '',
        width: mergedCoordinadora.width ?? baseAttrs.width ?? '',
        height: mergedCoordinadora.height ?? baseAttrs.height ?? ''
      };

      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        sku: formData.sku,
        attributes: nextAttrs
      };

      if (editingProduct && editingProduct.id) {
        const resp = await productService.update(editingProduct.id, payload);
        const updated = resp?.data ?? resp;
        setProducts(prev => (Array.isArray(prev) ? prev.map(p => p.id === (editingProduct.id || updated.id) ? updated : p) : [updated]));
        setSaveAlert({ type: 'success', message: 'Producto actualizado correctamente' });
      } else {
        const resp = await productService.create(payload);
        const created = resp?.data ?? resp;
        setProducts(prev => (Array.isArray(prev) ? [created, ...prev] : [created]));
        setSaveAlert({ type: 'success', message: 'Producto creado correctamente' });
      }

      // cerrar formulario y refrescar datos brevemente
      setShowForm(false);
      setEditingProduct(null);
        setRemoveMainImage(false);
      await loadData();
    } catch (err) {
      console.error('handleSaveProduct error', err);
      const msg = err?.response?.data?.message || 'No se pudo guardar el producto. Revisa la consola.';
      setSaveAlert({ type: 'error', message: msg });
    }
  };
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target || {};
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e?.target?.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setRemoveMainImage(false);
    try {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } catch (err) {
      setImagePreview('');
    }
  };

  const handleRemoveMainImage = () => {
    if (!window.confirm('¿Eliminar la portada? Esta acción quitará la imagen del producto (no la borrará del servidor).')) return;
    setImageFile(null);
    setImagePreview(null);
    setRemoveMainImage(true);
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e?.target?.files || []).slice(0, 2);
    setAdditionalImageFiles(prev => {
      const next = Array.isArray(prev) ? [...prev] : [null, null];
      for (const f of files) {
        // find first empty slot
        const emptyIdx = next.findIndex(x => x == null);
        if (emptyIdx !== -1) {
          next[emptyIdx] = f;
        } else {
          // no empty slot: replace the first one (shift behavior)
          next[0] = f;
        }
      }
      return next.slice(0, 2);
    });
    // allow selecting the same file again later
    try { e.target.value = null; } catch (err) {}
  };

  const handleAdditionalImageAt = (index, e) => {
    const file = e?.target?.files && e.target.files[0];
    setAdditionalImageFiles(prev => {
      const next = Array.isArray(prev) ? [...prev] : [null, null];
      next[index] = file || null;
      return next.slice(0, 2);
    });
    try { e.target.value = null; } catch (err) {}
  };

  const handleVariantImageChange = (variantIndex, imgIndex, file) => {
    if (file === undefined) return;

    // Optimistic: set the selected file locally for immediate preview
    setColorVariants(prev => (Array.isArray(prev) ? prev.map((v, i) => {
      if (i !== variantIndex) return v;
      const images = Array.isArray(v.images) ? [...v.images] : [];
      images[imgIndex] = file;
      return { ...v, images };
    }) : prev));

    // If the value is a File, upload it immediately and replace with the returned URL
    if (file && typeof file !== 'string') {
      (async () => {
        try {
          const form = new FormData();
          form.append('image', file);
          const resp = await productService.uploadImage(form, { headers: { 'Content-Type': 'multipart/form-data' } });
          const url = resp?.data?.url || resp?.url || resp;
          if (url) {
            setColorVariants(prev => (Array.isArray(prev) ? prev.map((v, i) => {
              if (i !== variantIndex) return v;
              const images = Array.isArray(v.images) ? [...v.images] : [];
              images[imgIndex] = url;
              return { ...v, images };
            }) : prev));

            // Si no hay imagen principal definida en el editor, usar esta como preview principal
            if (!imagePreview) {
              try { setImagePreview(url); } catch (e) { /* ignore */ }
            }
          }
        } catch (err) {
          console.error('Error subiendo imagen de variante:', err);
        }
      })();
    }
  };
  const addColorVariant = () => setColorVariants(prev => [...prev, { name: '', hex: '#ffffff', stock: 0, images: [] }]);
  const updateColorVariant = (i, key, val) => setColorVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [key]: val } : v));
  const removeColorVariant = (i) => setColorVariants(prev => prev.filter((_, idx) => idx !== i));
  const handleEditProduct = (p) => {
    try {
      if (!p) return;
      setEditingProduct(p);
      // obtener atributos primero
      const attrs = p.attributes || {};
      // DEBUG: imprimir atributos para diagnosticar problemas de preview
      console.info('handleEditProduct attrs:', attrs);
      try {
        const galleryPreview = Array.isArray(attrs.gallery) ? attrs.gallery : (Array.isArray(attrs.images) ? attrs.images : []);
        console.info('handleEditProduct gallery:', galleryPreview);
        console.info('handleEditProduct colorVariants:', Array.isArray(attrs.colorVariants) ? attrs.colorVariants : []);
      } catch (dd) {
        console.warn('handleEditProduct debug failure', dd);
      }
      setFormData({
        title: p?.title || '',
        description: p?.description || '',
        price: p?.price || '',
        stock: p?.stock || '',
        sku: p?.sku || '',
        coordinadoraType: attrs.coordinadoraType || attrs.coordinadora?.type || '',
        weight: attrs.weight || '',
        declaredValue: attrs.declaredValue || '',
        length: attrs.length || '',
        width: attrs.width || '',
        height: attrs.height || ''
      });
      // cargar preview de imagen principal y galería (defensivo)
      // imagen principal (defensivo)
      const safeGet = (img) => {
        try {
          if (typeof img === 'string') return getStaticUrl(img);
          if (img && typeof img === 'object') {
            // si el objeto tiene url/path, usarlos
            if (img.url && typeof img.url === 'string') return getStaticUrl(img.url);
            if (img.path && typeof img.path === 'string') return getStaticUrl(img.path);
          }
          return null;
        } catch (e) {
          return null;
        }
      };
      setImagePreview(safeGet(attrs.image) || null);

      const gallery = Array.isArray(attrs.gallery) ? attrs.gallery : (Array.isArray(attrs.images) ? attrs.images : []);
      const galleryMapped = Array.isArray(gallery)
        ? gallery.map(g => safeGet(g)).filter(Boolean)
        : [];
      setAdditionalImageFiles(galleryMapped.length > 0 ? galleryMapped.slice(0,2) : [null, null]);

      // cargar variantes de color si existen (defensivo: ignorar objetos vacíos)
      const variants = Array.isArray(attrs.colorVariants) ? attrs.colorVariants : [];
      setColorVariants(variants.map(v => ({
        name: v?.name || '',
        hex: v?.hex || '#ffffff',
        stock: v?.stock || 0,
        images: Array.isArray(v?.images) ? v.images.map(img => safeGet(img)).filter(Boolean) : []
      })));
      setShowForm(true);
    } catch (err) {
      console.error('handleEditProduct fallo:', err);
      alert('No fue posible abrir el editor. Revisa la consola para más detalles.');
    }
  };
  // Estados para evitar clicks dobles en acciones de producto
  const [togglingProductId, setTogglingProductId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const handleToggleProductHidden = async (product) => {
    if (!product || !product.id) return;
    const isHidden = Boolean(product.attributes?.isHidden);
    try {
      setTogglingProductId(product.id);
      // Actualizar en backend: mergear attributes y alternar isHidden
      const newAttributes = { ...(product.attributes || {}), isHidden: !isHidden };
      await productService.update(product.id, { ...product, attributes: newAttributes });
      // actualizar estado local
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, attributes: newAttributes } : p));
    } catch (err) {
      console.error('handleToggleProductHidden error', err);
      alert('No se pudo actualizar la visibilidad del producto.');
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!id) return;
    if (!window.confirm('¿Eliminar este producto? Esta acción es irreversible.')) return;
    try {
      setDeletingProductId(id);
      await productService.delete(id);
      setProducts(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== id) : []));
    } catch (err) {
      console.error('handleDeleteProduct error', err);
      alert('No se pudo eliminar el producto.');
    } finally {
      setDeletingProductId(null);
    }
  };

  // Estados para acciones de usuario (evitar clicks dobles)
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const handleToggleUserRole = async (id, isAdmin) => {
    if (!id) return;
    try {
      setTogglingUserId(id);
      await authService.updateUserRole(id, !isAdmin);
      // actualizar lista localmente
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isAdmin: !isAdmin } : u));
    } catch (err) {
      console.error('handleToggleUserRole error', err);
      alert(err?.response?.data?.message || 'No se pudo actualizar el rol del usuario.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!id) return;
    if (!window.confirm('¿Eliminar este usuario? Esta acción es irreversible.')) return;
    try {
      setDeletingUserId(id);
      await authService.deleteUser(id);
      setUsers(prev => (Array.isArray(prev) ? prev.filter(u => u.id !== id) : []));
    } catch (err) {
      console.error('handleDeleteUser error', err);
      alert(err?.response?.data?.message || 'No se pudo eliminar el usuario.');
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    setUsersPage(1);
  }, [userSearch]);

  // Cargar datos al montar el panel
  useEffect(() => {
    loadData();
    loadInterests(1, '');
    loadAuditLogs(1, '');
  }, []);

  const normalizeOrderStatus = (rawStatus) => {
    const s = (rawStatus ?? '').toString().trim().toLowerCase();

    if (!s) return 'pending';

    // Compat / typos
    if (s === 'completed' || s === 'complete') return 'delivered';
    if (s === 'canceled') return 'cancelled';
    if (s === 'pending payment' || s === 'pending_payment' || s === 'pending-payment') return 'pending';

    // Compat en español (por si hay datos legacy)
    if (s === 'pendiente') return 'pending';
    if (s === 'pagado') return 'paid';
    if (s === 'procesando') return 'processing';
    if (s === 'enviado') return 'shipped';
    if (s === 'entregado') return 'delivered';
    if (s === 'cancelado' || s === 'cancelada') return 'cancelled';

    return ORDER_STATUS_VALUES.includes(s) ? s : 'unknown';
  };

  const getOrderStatusLabel = (statusKey) => {
    switch (statusKey) {
      case 'pending':
        return 'Pendiente';
      case 'paid':
        return 'Pagado';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getOrderStatusIcon = (statusKey, props = {}) => {
    const iconProps = {
      size: 14,
      'aria-hidden': true,
      focusable: false,
      ...props
    };

    switch (statusKey) {
      case 'pending':
        return <Clock {...iconProps} />;
      case 'paid':
        return <Check {...iconProps} />;
      case 'processing':
        return <Cog {...iconProps} />;
      case 'shipped':
        return <Truck {...iconProps} />;
      case 'delivered':
        return <CheckCircle2 {...iconProps} />;
      case 'cancelled':
        return <XCircle {...iconProps} />;
      default:
        return <AlertTriangle {...iconProps} />;
    }
  };

  // Ventas externas (orden manual)
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [creatingManualOrder, setCreatingManualOrder] = useState(false);
  const [manualOrderData, setManualOrderData] = useState({
    sourceChannel: 'whatsapp',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    total: '',
    status: 'paid'
  });
  const [manualItems, setManualItems] = useState([
    { productId: '', quantity: 1, color: '' }
  ]);

  // Estados para historial (audit logs)
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, _setAuditError] = useState('');
  const [auditQ, setAuditQ] = useState('');
  const [auditPage, _setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // Estados para solicitudes (producto agotado)
  const [interestRows, setInterestRows] = useState([]);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestError, setInterestError] = useState('');
  const [interestQ, setInterestQ] = useState('');
  const [interestPage, setInterestPage] = useState(1);
  const [interestPages, setInterestPages] = useState(1);
  const [interestTotal, setInterestTotal] = useState(0);
  const [interestPendingTotal, _setInterestPendingTotal] = useState(0);
  const [interestMocked, setInterestMocked] = useState(false);
  const [deletingInterestId, setDeletingInterestId] = useState(null);
  const [contactingInterestId, setContactingInterestId] = useState(null);

  // Estados generales
  const [loading, setLoading] = useState(true);
  // Navegación 100% por ruta. (El render principal se encuentra en el `return` más abajo)
  useEffect(() => {
    if (ordersPage !== clampedOrdersPage) {
      setOrdersPage(clampedOrdersPage);
    }
  }, [ordersPage, clampedOrdersPage]);

  const openManualOrderModal = () => {
    setManualOrderData({
      sourceChannel: 'whatsapp',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      total: '',
      status: 'paid'
    });
    setManualItems([{ productId: '', quantity: 1, color: '' }]);
    setShowManualOrderModal(true);
  };

  const addManualItemRow = () => {
    setManualItems(prev => [...(Array.isArray(prev) ? prev : []), { productId: '', quantity: 1, color: '' }]);
  };

  const removeManualItemRow = (index) => {
    setManualItems(prev => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next.splice(index, 1);
      return next.length > 0 ? next : [{ productId: '', quantity: 1, color: '' }];
    });
  };

  const updateManualItem = (index, patch) => {
    setManualItems(prev => (Array.isArray(prev) ? prev : []).map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleCreateManualOrder = async (e) => {
    e.preventDefault();
    try {
      setCreatingManualOrder(true);

      // Validación: si el producto tiene variantes, color es obligatorio
      for (let i = 0; i < (Array.isArray(manualItems) ? manualItems.length : 0); i++) {
        const row = manualItems[i];
        const pid = row?.productId ? Number(row.productId) : null;
        const product = pid ? (Array.isArray(products) ? products : []).find(p => Number(p.id) === pid) : null;
        const variants = Array.isArray(product?.attributes?.colorVariants) ? product.attributes.colorVariants : [];
        if (variants.length > 0) {
          const color = (row?.color || '').trim();
          if (!color) {
            alert(`Selecciona el color para: ${product?.title || 'producto'} (fila ${i + 1})`);
            return;
          }
          const ok = variants.some(v => (v?.name || '').toString() === color);
          if (!ok) {
            alert(`El color seleccionado no existe para: ${product?.title || 'producto'} (fila ${i + 1})`);
            return;
          }
        }
      }

      const itemsPayload = (Array.isArray(manualItems) ? manualItems : [])
        .map(r => ({
          productId: r.productId ? Number(r.productId) : null,
          quantity: Number(r.quantity) || 0,
          color: (r.color || '').trim() || null
        }))
        .filter(r => r.productId && r.quantity > 0);

      const totalNumber = Number(String(manualOrderData.total || '').replace(',', '.'));
      if (!Number.isFinite(totalNumber) || totalNumber < 0) {
        alert('Total inválido');
        return;
      }
      if (itemsPayload.length === 0) {
        alert('Agrega al menos 1 producto');
        return;
      }

      await orderService.createManual({
        sourceChannel: manualOrderData.sourceChannel,
        customerName: (manualOrderData.customerName || '').trim() || null,
        customerEmail: (manualOrderData.customerEmail || '').trim() || null,
        customerPhone: (manualOrderData.customerPhone || '').trim() || null,
        total: totalNumber,
        status: manualOrderData.status,
        items: itemsPayload
      });

      setShowManualOrderModal(false);
      await loadData();
      alert('Venta registrada correctamente');
    } catch (error) {
      console.error('Error creando venta externa:', error);
      alert(error?.response?.data?.message || 'No se pudo registrar la venta');
    } finally {
      setCreatingManualOrder(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      await loadData();
      alert('Estado actualizado correctamente');
      if (showOrderModal) {
        const updated = orders.find(o => o.id === orderId);
        setSelectedOrder({ ...updated });
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado');
    }
  };

  const openEditOrderModal = (order) => {
    setEditingOrder(order);
    setEditOrderData({
      customerName: order?.customerName || '',
      customerEmail: order?.customerEmail || '',
      customerPhone: order?.customerPhone || '',
      shippingAddress: order?.shippingAddress || '',
      shippingCity: order?.shippingCity || '',
      shippingCost: order?.shippingCost != null ? String(order.shippingCost) : '',
      paymentMethod: order?.paymentMethod || 'other',
      paymentReference: order?.paymentReference || '',
      sourceChannel: (order?.sourceChannel || 'web').toString(),
      subtotal: order?.subtotal != null ? String(order.subtotal) : '',
      total: order?.total != null ? String(order.total) : ''
    });
    setShowEditOrderModal(true);
  };

  const handleSaveOrderEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder?.id) return;

    try {
      setSavingOrderEdit(true);

      const channel = (editOrderData.sourceChannel || 'web').toString().trim().toLowerCase();

      const payload = {
        customerName: (editOrderData.customerName || '').trim() || null,
        customerEmail: (editOrderData.customerEmail || '').trim() || null,
        customerPhone: (editOrderData.customerPhone || '').trim() || null,
        shippingAddress: (editOrderData.shippingAddress || '').trim() || null,
        shippingCity: (editOrderData.shippingCity || '').trim() || null,
        paymentMethod: (editOrderData.paymentMethod || 'other').toString().trim(),
        paymentReference: (editOrderData.paymentReference || '').trim() || null,
        sourceChannel: channel
      };

      if (editOrderData.shippingCost !== '') {
        const sc = Number(String(editOrderData.shippingCost).replace(',', '.'));
        if (!Number.isFinite(sc) || sc < 0) {
          alert('Costo de envío inválido');
          return;
        }
        payload.shippingCost = sc;
      }

      if (channel !== 'web') {
        if (editOrderData.subtotal !== '') {
          const st = Number(String(editOrderData.subtotal).replace(',', '.'));
          if (!Number.isFinite(st) || st < 0) {
            alert('Subtotal inválido');
            return;
          }
          payload.subtotal = st;
        }
        if (editOrderData.total !== '') {
          const tt = Number(String(editOrderData.total).replace(',', '.'));
          if (!Number.isFinite(tt) || tt < 0) {
            alert('Total inválido');
            return;
          }
          payload.total = tt;
        }
      }

      await orderService.update(editingOrder.id, payload);
      setShowEditOrderModal(false);
      setEditingOrder(null);
      await loadData();
      alert('Pedido actualizado');
    } catch (error) {
      console.error('Error editando pedido:', error);
      alert(error?.response?.data?.message || 'No se pudo editar el pedido');
    } finally {
      setSavingOrderEdit(false);
    }
  };

  const handleDeleteOrder = async (order) => {
    const orderId = order?.id;
    if (!orderId) return;
    if (!confirm(`¿Eliminar el pedido #${orderId}?\n\nEsta acción es irreversible.`)) return;

    try {
      await orderService.delete(orderId);
      await loadData();
      alert('Pedido eliminado');
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      alert(error?.response?.data?.message || 'No se pudo eliminar el pedido');
    }
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // ========== DASHBOARD (KPIs) ==========
  const dashboard = useMemo(() => {
    const safeDate = (value) => {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfNDaysAgo = (daysBack) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - daysBack);
      return d;
    };

    const isNonCancelled = (o) => o?.status !== 'cancelled';
    const nonCancelledOrders = (Array.isArray(orders) ? orders : []).filter(isNonCancelled);

    const isInRange = (value, start, end) => {
      const d = safeDate(value);
      if (!d) return false;
      return d >= start && d < end;
    };

    const weekStart = startOfNDaysAgo(6);
    const monthStart = startOfNDaysAgo(29);
    const tomorrowStart = new Date(startOfToday);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const salesToday = nonCancelledOrders.filter(o => isInRange(o.createdAt, startOfToday, tomorrowStart)).length;
    const salesWeek = nonCancelledOrders.filter(o => {
      const d = safeDate(o.createdAt);
      return d && d >= weekStart;
    }).length;
    const salesMonth = nonCancelledOrders.filter(o => {
      const d = safeDate(o.createdAt);
      return d && d >= monthStart;
    }).length;

    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const pendingStatuses = new Set(['pending', 'paid', 'processing']);
    const pendingOrders = (Array.isArray(orders) ? orders : []).filter(o => pendingStatuses.has(o.status)).length;
    const outOfStockProducts = (Array.isArray(products) ? products : []).filter(p => (Number(p.stock) || 0) <= 0).length;

    const channelDefs = [
      { key: 'web', label: 'Web' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'marketplace', label: 'Marketplace' },
      { key: 'presencial', label: 'Presencial' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'tiktok', label: 'TikTok' },
      { key: 'other', label: 'Otro' }
    ];
    const channelKeys = new Set(channelDefs.map(c => c.key));
    const channelKeyOf = (o) => {
      const raw = (o?.sourceChannel || 'web').toString().trim().toLowerCase();
      return channelKeys.has(raw) ? raw : 'other';
    };

    const byChannel = channelDefs.map(ch => {
      const list = nonCancelledOrders.filter(o => channelKeyOf(o) === ch.key);
      const revenue = list.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const pending = list.filter(o => pendingStatuses.has(o.status)).length;
      return { key: ch.key, label: ch.label, orders: list.length, revenue, pending };
    });

    const latestOrders = [...(Array.isArray(orders) ? orders : [])]
      .sort((a, b) => {
        const da = safeDate(a.createdAt)?.getTime() || 0;
        const db = safeDate(b.createdAt)?.getTime() || 0;
        return db - da;
      })
      .slice(0, 6);

    // Producto menos vendido (por título en items)
    const soldByTitle = new Map();
    for (const order of nonCancelledOrders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const title = (item.title || item.productTitle || 'Producto').toString();
        const qty = Number(item.quantity) || 0;
        if (!title || qty <= 0) continue;
        soldByTitle.set(title, (soldByTitle.get(title) || 0) + qty);
      }
    }
    let leastSold = null;
    for (const [title, qty] of soldByTitle.entries()) {
      if (!leastSold || qty < leastSold.quantity) leastSold = { title, quantity: qty };
    }

    // Visitantes vs Conversiones (proxy con usuarios nuevos por día)
    const days = 7;
    const series = Array.from({ length: days }, (_, i) => {
      const dayStart = startOfNDaysAgo(days - 1 - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const visitors = (Array.isArray(users) ? users : []).filter(u => isInRange(u.createdAt, dayStart, dayEnd)).length;
      const ordersCount = nonCancelledOrders.filter(o => isInRange(o.createdAt, dayStart, dayEnd)).length;
      const conversion = visitors > 0 ? Math.min(100, (ordersCount / visitors) * 100) : (ordersCount > 0 ? 100 : 0);
      const label = dayStart.toLocaleDateString('es-CO', { weekday: 'short' });
      return { label, visitors, conversion };
    });

    const visitorsTotal = series.reduce((sum, p) => sum + p.visitors, 0);
    const conversionAvg = series.length > 0
      ? (series.reduce((sum, p) => sum + p.conversion, 0) / series.length)
      : 0;

    return {
      salesToday,
      salesWeek,
      salesMonth,
      totalRevenue,
      pendingOrders,
      outOfStockProducts,
      latestOrders,
      leastSold,
      visitorsTotal,
      conversionAvg,
      series,
      byChannel
    };
  }, [orders, products, users]);

  return (
    <div className="admin-panel admin-layout">
      <aside className="admin-sidebar" aria-label="Navegación del panel admin">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-title">Panel Admin</div>
          <div className="admin-sidebar-subtitle">{user?.name}</div>
        </div>

        <nav className="admin-nav">
          <Link
            to="/admin/shipments"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/shipments') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><Send /></span>
            <span className="admin-nav-label">Gestión de envíos</span>
          </Link>
          <Link
            to="/admin/dashboard"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/dashboard') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><BarChart3 /></span>
            <span className="admin-nav-label">Dashboard</span>
          </Link>
          <Link
            to="/admin/products"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/products') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><Package /></span>
            <span className="admin-nav-label">Productos</span>
            <span className="admin-nav-count" aria-hidden="true">{products.length}</span>
          </Link>
          <Link
            to="/admin/users"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/users') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><Users /></span>
            <span className="admin-nav-label">Usuarios</span>
            <span className="admin-nav-count" aria-hidden="true">{users.length}</span>
          </Link>
          <Link
            to="/admin/orders"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/orders') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><ShoppingCart /></span>
            <span className="admin-nav-label">Pedidos</span>
            <span className="admin-nav-count" aria-hidden="true">{orders.length}</span>
          </Link>
          <Link
            to="/admin/audit"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/audit') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><FileText /></span>
            <span className="admin-nav-label">Historial</span>
          </Link>
          <Link
            to="/admin/interests"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/interests') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><PhoneCall /></span>
            <span className="admin-nav-label">Solicitudes</span>
            <span
              className={`admin-nav-count${interestPendingTotal > 0 ? ' admin-nav-count--alert' : ''}`}
              aria-hidden="true"
            >
              {interestPendingTotal}
            </span>
          </Link>
          <Link
            to="/admin/despacho"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/despacho') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><Truck /></span>
            <span className="admin-nav-label">Despacho</span>
          </Link>
          <Link
            to="/admin/contents"
            className={`admin-nav-btn${location.pathname.startsWith('/admin/contents') ? ' active' : ''}`}
          >
            <span className="admin-nav-icon" aria-hidden="true"><BookOpen /></span>
            <span className="admin-nav-label">Contenidos</span>
          </Link>
        </nav>
      </aside>

      <div className="admin-main">
        <div className="admin-content">
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : (
          <>
            {activeTab === 'shipments' && (
              <AdminShipments />
            )}
            {activeTab === 'despacho' && (
              <AdminDespacho />
            )}
            {activeTab === 'contents' && (
              (() => {
                const p = (location?.pathname || '').replace(/\/+$|^\s+|\s+$/g, '');
                if (p === '/admin/contents' || p === '/admin/contents/dashboard') {
                  return <ContentsDashboard />;
                }
                if (p === '/admin/contents/list') {
                  return <ContentsList />;
                }
                if (p === '/admin/contents/new') {
                  return <NewContent />;
                }
                // match /admin/contents/edit/:id
                const editMatch = p.match(/^\/admin\/contents\/edit\/(.+)$/);
                if (editMatch) {
                  const id = editMatch[1];
                  return <EditContent id={id} />;
                }
                // fallback: dashboard
                return <ContentsDashboard />;
              })()
            )}
            {activeTab === 'dashboard' && (
              <div className="admin-dashboard">
                <div className="dash-kpi-grid">
                  <div className="dash-kpi-card dash-kpi-card--primary">
                    <div className="dash-kpi-label">
                      <span className="dash-kpi-icon" aria-hidden="true"><TrendingUp /></span>
                      Ventas hoy
                    </div>
                    <div className="dash-kpi-value">{dashboard.salesToday}</div>
                  </div>

                  <div className="dash-kpi-card dash-kpi-card--success">
                    <div className="dash-kpi-label">
                      <span className="dash-kpi-icon" aria-hidden="true"><TrendingUp /></span>
                      Ventas semana
                    </div>
                    <div className="dash-kpi-value">{dashboard.salesWeek}</div>
                  </div>

                  <div className="dash-kpi-card dash-kpi-card--info">
                    <div className="dash-kpi-label">
                      <span className="dash-kpi-icon" aria-hidden="true"><TrendingUp /></span>
                      Ventas mes
                    </div>
                    <div className="dash-kpi-value">{dashboard.salesMonth}</div>
                  </div>

                  <div className="dash-kpi-card dash-kpi-card--featured">
                    <div className="dash-kpi-label">
                      <span className="dash-kpi-icon" aria-hidden="true"><DollarSign /></span>
                      Ingresos totales
                    </div>
                    <div className="dash-kpi-value">
                      ${Number(dashboard.totalRevenue).toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>

                <div className="dash-chart-card">
                  <div className="dash-card-header">
                    <div className="dash-card-title">Visitantes vs Conversiones</div>
                    <div className="dash-card-meta">
                      <span>Visitantes: <strong>{dashboard.visitorsTotal}</strong></span>
                      <span>Conversión prom.: <strong>{dashboard.conversionAvg.toFixed(1)}%</strong></span>
                    </div>
                  </div>

                  <div className="dash-chart">
                    <svg viewBox="0 0 700 220" role="img" aria-label="Gráfica de visitantes y conversión">
                      {(() => {
                        const series = dashboard.series || [];
                        const W = 700;
                        const H = 220;
                        const padL = 44;
                        const padR = 24;
                        const padT = 18;
                        const padB = 38;
                        const innerW = W - padL - padR;
                        const innerH = H - padT - padB;
                        const maxVisitors = Math.max(...series.map(s => s.visitors), 1);
                        const step = innerW / Math.max(series.length, 1);
                        const barW = Math.max(8, step * 0.55);

                        const linePoints = series.map((p, i) => {
                          const x = padL + step * i + step / 2;
                          const y = padT + innerH - (Math.max(0, Math.min(100, p.conversion)) / 100) * innerH;
                          return { x, y };
                        });

                        const lineD = linePoints
                          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
                          .join(' ');

                        return (
                          <>
                            <line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke="var(--gray-200)" />
                            <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="var(--gray-200)" />

                            {series.map((p, i) => {
                              const x = padL + step * i + (step - barW) / 2;
                              const h = (p.visitors / maxVisitors) * innerH;
                              const y = padT + innerH - h;
                              return (
                                <g key={p.label + i}>
                                  <rect
                                    x={x}
                                    y={y}
                                    width={barW}
                                    height={h}
                                    rx={6}
                                    fill="var(--primary-color)"
                                    fillOpacity={0.16}
                                    stroke="var(--primary-color)"
                                    strokeOpacity={0.35}
                                  />
                                  <text
                                    x={padL + step * i + step / 2}
                                    y={H - 14}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="var(--gray-600)"
                                  >
                                    {p.label}
                                  </text>
                                </g>
                              );
                            })}

                            <path d={lineD} fill="none" stroke="var(--secondary-color)" strokeWidth={3} />
                            {linePoints.map((pt, i) => (
                              <circle
                                key={i}
                                cx={pt.x}
                                cy={pt.y}
                                r={4}
                                fill="var(--secondary-color)"
                              />
                            ))}

                            <text x={12} y={padT + 12} fontSize="12" fill="var(--gray-600)">Visitantes</text>
                            <text x={W - 12} y={padT + 12} fontSize="12" fill="var(--gray-600)" textAnchor="end">Conversión %</text>
                          </>
                        );
                      })()}
                    </svg>

                    <div className="dash-legend" aria-hidden="true">
                      <span className="dash-legend-item">
                        <span className="dash-legend-swatch dash-legend-swatch--bar" /> Visitantes
                      </span>
                      <span className="dash-legend-item">
                        <span className="dash-legend-swatch dash-legend-swatch--line" /> Conversión %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dash-split-row">
                  <div className="dash-status-card">
                    <div className="dash-card-title">Pedidos pendientes</div>
                    <div className="dash-status-value">{dashboard.pendingOrders}</div>
                    <div className="dash-status-hint">Pendiente / Pagado / Procesando</div>
                  </div>

                  <div className={`dash-alert-card ${dashboard.outOfStockProducts > 0 ? 'is-alert' : ''}`}>
                    <div className="dash-card-title">
                      <span className="dash-kpi-icon" aria-hidden="true"><AlertTriangle /></span>
                      Productos agotados
                    </div>
                    <div className="dash-status-value">{dashboard.outOfStockProducts}</div>
                    <div className="dash-status-hint">Stock ≤ 0</div>
                  </div>

                  <div className="dash-table-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title">Últimas órdenes</div>
                    </div>
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.latestOrders.map(o => (
                            <tr key={o.id}>
                              <td>#{o.id}</td>
                              <td>{o.customerName || o.customerEmail || 'N/A'}</td>
                              <td>${Number(o.total || 0).toLocaleString('es-CO')}</td>
                              <td className={`dash-status dash-status--${o.status || 'unknown'}`}>{o.status || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="dash-table-card">
                  <div className="dash-card-header">
                    <div className="dash-card-title">Ventas por canal</div>
                  </div>
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Canal</th>
                          <th>Ventas</th>
                          <th>Ingresos</th>
                          <th>Pendientes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(dashboard.byChannel) ? dashboard.byChannel : []).map(row => (
                          <tr key={row.key}>
                            <td>{row.label}</td>
                            <td>{row.orders}</td>
                            <td>${Number(row.revenue || 0).toLocaleString('es-CO')}</td>
                            <td>{row.pending}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="dash-bottom-card">
                  <div className="dash-card-header">
                    <div className="dash-card-title">Producto menos vendido</div>
                  </div>
                  {dashboard.leastSold ? (
                    <div className="dash-least">
                      <div className="dash-least-title">{dashboard.leastSold.title}</div>
                      <div className="dash-least-meta">Unidades vendidas: <strong>{dashboard.leastSold.quantity}</strong></div>
                    </div>
                  ) : (
                    <div className="dash-empty">Sin datos de ventas para calcular.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="admin-audit">
                <div className="admin-section-header">
                  <h2>Historial de registro</h2>
                  <p>Acciones y cambios realizados en la tienda</p>
                </div>

                <div className="admin-audit-toolbar">
                  <div className="admin-search">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Buscar (acción, entidad, id, mensaje)"
                      value={auditQ}
                      onChange={e => setAuditQ(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') loadAuditLogs(1, auditQ);
                      }}
                    />
                    <button type="button" className="admin-audit-search-btn" onClick={() => loadAuditLogs(1, auditQ)}>
                      Buscar
                    </button>
                  </div>
                </div>

                {auditError && <div className="error-message">{auditError}</div>}
                {auditLoading ? (
                  <div className="loading">Cargando historial...</div>
                ) : (
                  <>
                    <div className="orders-pagination" role="navigation" aria-label="Paginación de historial">
                      <div className="orders-pagination-info">
                        {(() => {
                          const start = auditTotal > 0 ? (auditPage - 1) * AUDIT_PAGE_SIZE + 1 : 0;
                          const end = auditTotal > 0
                            ? Math.min((auditPage - 1) * AUDIT_PAGE_SIZE + (Array.isArray(auditLogs) ? auditLogs.length : 0), auditTotal)
                            : 0;
                          return `Mostrando ${start}-${end} de ${auditTotal}`;
                        })()}
                      </div>
                      <div className="orders-pagination-actions">
                        <button
                          type="button"
                          className="orders-page-btn"
                          disabled={auditLoading || auditPage <= 1}
                          onClick={() => loadAuditLogs(auditPage - 1, auditQ)}
                        >
                          Anterior
                        </button>
                        <span className="orders-pagination-page" aria-live="polite">
                          Página {auditPage} de {auditPages}
                        </span>
                        <button
                          type="button"
                          className="orders-page-btn"
                          disabled={auditLoading || auditPage >= auditPages}
                          onClick={() => loadAuditLogs(auditPage + 1, auditQ)}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>

                    {interestMocked && (
                      <div className="info-text">Mostrando datos de ejemplo (mock). Inicia sesión como admin para ver datos reales.</div>
                    )}
                    <div className="table-container">
                      <table className="admin-table admin-interests-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Usuario</th>
                          <th>Acción</th>
                          <th>Entidad</th>
                          <th>Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                              No hay registros
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map(log => {
                            const actorLabel = log.actor
                              ? `${log.actor.name || ''} ${log.actor.lastName || ''}`.trim() || (log.actor.email || `#${log.actor.id}`)
                              : (log.actorUserId ? `#${log.actorUserId}` : 'Sistema');

                            const dateLabel = log.createdAt
                              ? new Date(log.createdAt).toLocaleString('es-CO')
                              : '';

                            const entityLabel = log.entityId
                              ? `${log.entityType} #${log.entityId}`
                              : log.entityType;

                            return (
                              <tr key={log.id}>
                                <td>{dateLabel}</td>
                                <td>{actorLabel}</td>
                                <td><span className="admin-audit-action">{log.action}</span></td>
                                <td>{entityLabel}</td>
                                <td className="admin-audit-message">{log.message || '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      </table>
                    </div>

                    <div className="orders-pagination" role="navigation" aria-label="Paginación de historial">
                      <div className="orders-pagination-info">
                        {(() => {
                          const start = auditTotal > 0 ? (auditPage - 1) * AUDIT_PAGE_SIZE + 1 : 0;
                          const end = auditTotal > 0
                            ? Math.min((auditPage - 1) * AUDIT_PAGE_SIZE + (Array.isArray(auditLogs) ? auditLogs.length : 0), auditTotal)
                            : 0;
                          return `Mostrando ${start}-${end} de ${auditTotal}`;
                        })()}
                      </div>
                      <div className="orders-pagination-actions">
                        <button
                          type="button"
                          className="orders-page-btn"
                          disabled={auditLoading || auditPage <= 1}
                          onClick={() => loadAuditLogs(auditPage - 1, auditQ)}
                        >
                          Anterior
                        </button>
                        <span className="orders-pagination-page" aria-live="polite">
                          Página {auditPage} de {auditPages}
                        </span>
                        <button
                          type="button"
                          className="orders-page-btn"
                          disabled={auditLoading || auditPage >= auditPages}
                          onClick={() => loadAuditLogs(auditPage + 1, auditQ)}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="tab-content">
                <div className="content-header">
                  <h2>Gestión de Productos</h2>
                  <button 
                    className="btn-new-product"
                    onClick={handleNewProduct}
                  >
                    <span className="admin-icon" aria-hidden="true"><Plus /></span>
                    Nuevo Producto
                  </button>
                </div>

                          {saveAlert && (
                            <div className={`admin-save-alert ${saveAlert.type === 'error' ? 'is-error' : 'is-success'}`} role="status">
                              {saveAlert.message}
                            </div>
                          )}

                {showForm && (
                  <Card className="mui-section admin-product-form-horizontal" sx={{ width: '100%', maxWidth: '100%', margin: '0 0 32px 0', display: 'flex', flexDirection: 'row', alignItems: 'stretch', boxSizing: 'border-box' }}>
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                      <CardHeader title={editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'} sx={{ pb: 0 }} />
                      <CardContent sx={{ flex: 1, minWidth: 0 }}>
                        <form onSubmit={handleSaveProduct} autoComplete="off">
                        {/* Sección: Datos básicos */}
                        <div className="mui-section-title">Datos Básicos</div>
                        <Grid container spacing={2} className="mui-form-row">
                          <Grid item xs={12} sm={8}>
                            <TextField label="Título" name="title" value={formData.title} onChange={handleFormChange} required fullWidth variant="outlined" />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="SKU" name="sku" value={formData.sku} onChange={handleFormChange} fullWidth variant="outlined" />
                          </Grid>
                        </Grid>
                        <Grid container spacing={2} className="mui-form-row">
                          <Grid item xs={12}>
                            <TextField
                              label="Descripción"
                              name="description"
                              value={formData.description}
                              onChange={handleFormChange}
                              required
                              fullWidth
                              multiline
                              minRows={3}
                              maxRows={8}
                              variant="outlined"
                              sx={{
                                '& .MuiInputBase-input': { maxHeight: '240px', overflow: 'auto' },
                                '& .MuiOutlinedInput-input': { maxHeight: '240px', overflow: 'auto' }
                              }}
                            />
                          </Grid>
                        </Grid>

                        {/* Sección: Precios y stock */}
                        <div className="mui-section-title">Precio y Stock</div>
                        <Grid container spacing={2} className="mui-form-row">
                          <Grid item xs={12} sm={4}>
                            <TextField label="Precio ($ COP)" name="price" type="number" value={formData.price} onChange={handleFormChange} required fullWidth variant="outlined" inputProps={{ min: 0, step: 0.01 }} />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="Stock" name="stock" type="number" value={formData.stock} onChange={handleFormChange} required fullWidth variant="outlined" inputProps={{ min: 0, step: 1 }} />
                          </Grid>
                        </Grid>

                        {/* Sección: Variantes de color */}
                        <div className="mui-section-title" style={{ marginTop: 24 }}>Paleta de Colores (Opcional)
                          <Tooltip title="Puedes agregar variantes de color, cada una con su stock e imágenes.">
                            <span className="mui-tooltip">?</span>
                          </Tooltip>
                        </div>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={addColorVariant} sx={{ mb: 2 }}>
                          Agregar Color
                        </Button>
                        {colorVariants.length === 0 && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              No hay variantes de color. Haz clic en "Agregar Color" para crear una paleta.
                            </Typography>
                            {/* Campos de imagen principal y galería para productos sin variantes */}
                            <Grid container spacing={2} className="mui-form-row">
                                  <Grid item xs={12} sm={6}>
                                    <InputLabel shrink>Imagen principal</InputLabel>
                                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: 8 }} />
                                    {imagePreview && (
                                      <>
                                        <img src={typeof imagePreview === 'string' ? imagePreview : ''} alt="Preview" className="mui-image-preview" />
                                        <div style={{ marginTop: 8 }}>
                                          <button type="button" className="btn-delete" onClick={handleRemoveMainImage}>Eliminar portada</button>
                                        </div>
                                      </>
                                    )}
                                    {!imagePreview && editingProduct && editingProduct.attributes && editingProduct.attributes.image && (
                                      <div style={{ marginTop: 8 }}>
                                        <button type="button" className="btn-delete" onClick={handleRemoveMainImage}>Eliminar portada</button>
                                      </div>
                                    )}
                                  </Grid>
                              <Grid item xs={12} sm={6}>
                                <InputLabel shrink>Galería (máx. 2 imágenes)</InputLabel>
                                <div className="gallery-grid">
                                  <div className="gallery-slot">
                                    <input className="gallery-input" type="file" accept="image/*" onChange={e => handleAdditionalImageAt(0, e)} />
                                    <div className="gallery-preview">
                                      {additionalImageFiles[0] ? (
                                        <img src={typeof additionalImageFiles[0] === 'string' ? additionalImageFiles[0] : URL.createObjectURL(additionalImageFiles[0])} alt={`Galería 1`} className="mui-image-preview" />
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="gallery-slot">
                                    <input className="gallery-input" type="file" accept="image/*" onChange={e => handleAdditionalImageAt(1, e)} />
                                    <div className="gallery-preview">
                                      {additionalImageFiles[1] ? (
                                        <img src={typeof additionalImageFiles[1] === 'string' ? additionalImageFiles[1] : URL.createObjectURL(additionalImageFiles[1])} alt={`Galería 2`} className="mui-image-preview" />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </Grid>
                            </Grid>
                          </>
                        )}
                        {colorVariants.map((variant, index) => (
                          <Box key={index} className="mui-variant-card">
                            <div className="mui-variant-title">Color {index + 1}</div>
                            <Grid container spacing={2} className="mui-form-row" alignItems="flex-end">
                              <Grid item xs={12} sm={4}>
                                <TextField label="Nombre del color" value={variant.name} onChange={e => updateColorVariant(index, 'name', e.target.value)} fullWidth />
                              </Grid>
                              <Grid item xs={6} sm={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <InputLabel shrink sx={{ mb: 1 }}>Color</InputLabel>
                                <input
                                  type="color"
                                  value={variant.hex}
                                  onChange={e => updateColorVariant(index, 'hex', e.target.value)}
                                  style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }}
                                />
                              </Grid>
                              <Grid item xs={6} sm={2}>
                                <TextField label="#HEX" value={variant.hex} onChange={e => updateColorVariant(index, 'hex', e.target.value)} fullWidth />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField label="Stock disponible" type="number" value={variant.stock} onChange={e => updateColorVariant(index, 'stock', parseInt(e.target.value) || 0)} fullWidth inputProps={{ min: 0, step: 1 }} />
                              </Grid>
                            </Grid>
                            <Grid container spacing={2} className="mui-form-row">
                              {[0, 1, 2].map(imgIndex => (
                                <Grid item xs={12} sm={4} key={imgIndex}>
                                  <InputLabel shrink>Imagen {imgIndex + 1}</InputLabel>
                                  <input type="file" accept="image/*" onChange={e => handleVariantImageChange(index, imgIndex, e.target.files[0])} style={{ marginBottom: 8 }} />
                                  {variant.images?.[imgIndex] && (() => {
                                    const val = variant.images[imgIndex];
                                    const src = (typeof val === 'string') ? getStaticUrl(val) : URL.createObjectURL(val);
                                    return <img src={src} alt={`${variant.name} ${imgIndex + 1}`} className="mui-image-preview" />;
                                  })()}
                                </Grid>
                              ))}
                            </Grid>
                            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => removeColorVariant(index)} sx={{ mt: 1 }}>
                              Eliminar Color
                            </Button>
                          </Box>
                        ))}

                        {/* Sección: Envío (Coordinadora) */}
                        <div className="mui-section-title" style={{ marginTop: 24 }}>Datos de Envío (Coordinadora)</div>
                        <Grid container spacing={2} className="mui-form-row">
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth required>
                              <InputLabel id="coordinadora-type-label">Tipo de producto</InputLabel>
                              <Select
                                labelId="coordinadora-type-label"
                                name="coordinadoraType"
                                value={formData.coordinadoraType}
                                label="Tipo de producto"
                                onChange={handleFormChange}
                              >
                                <MenuItem value="">Seleccione tipo</MenuItem>
                                <MenuItem value="mercancia">Mercancía</MenuItem>
                                <MenuItem value="documento">Documento</MenuItem>
                                <MenuItem value="paquete">Paquete</MenuItem>
                                <MenuItem value="caja">Caja</MenuItem>
                                <MenuItem value="sobre">Sobre</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="Peso (kg)" name="weight" type="number" value={formData.weight} onChange={handleFormChange} required fullWidth inputProps={{ min: 0.01, step: 0.01 }} />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="Valor declarado ($ COP)" name="declaredValue" type="number" value={formData.declaredValue} onChange={handleFormChange} required fullWidth inputProps={{ min: 0, step: 1 }} />
                          </Grid>
                        </Grid>
                        <Grid container spacing={2} className="mui-form-row">
                          <Grid item xs={12} sm={4}>
                            <TextField label="Largo (cm)" name="length" type="number" value={formData.length} onChange={handleFormChange} required fullWidth inputProps={{ min: 1, step: 1 }} />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="Ancho (cm)" name="width" type="number" value={formData.width} onChange={handleFormChange} required fullWidth inputProps={{ min: 1, step: 1 }} />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="Alto (cm)" name="height" type="number" value={formData.height} onChange={handleFormChange} required fullWidth inputProps={{ min: 1, step: 1 }} />
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />
                        <div className="mui-actions">
                          <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>Guardar</Button>
                          <Button type="button" variant="outlined" color="secondary" startIcon={<CancelIcon />} onClick={() => {
                            setShowForm(false);
                            setEditingProduct(null);
                            setImageFile(null);
                            setImagePreview(null);
                            setAdditionalImageFiles([null, null]);
                            setColorVariants([]);
                            setFormData({
                              title: '',
                              description: '',
                              price: '',
                              stock: '',
                              sku: ''
                            });
                            setRemoveMainImage(false);
                          }}>Cancelar</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Box>
                </Card>
                )}

                <div className="products-grid">
                  {products.map(product => {
                    const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E';
                    // Determinar primera imagen disponible: image > primera variante.images > gallery/images
                    let imagePath = product.attributes?.image;
                    if (!imagePath) {
                      const variants = Array.isArray(product.attributes?.colorVariants) ? product.attributes.colorVariants : [];
                      if (variants.length > 0) {
                        const firstVariant = variants[0];
                        const vImgs = Array.isArray(firstVariant?.images) ? firstVariant.images : [];
                        imagePath = vImgs.find(Boolean) || null;
                      }
                    }
                    if (!imagePath) {
                      const galleryArr = Array.isArray(product.attributes?.gallery) ? product.attributes.gallery : (Array.isArray(product.attributes?.images) ? product.attributes.images : []);
                      imagePath = (Array.isArray(galleryArr) ? galleryArr.find(Boolean) : null) || null;
                    }
                    if (!imagePath) {
                      imagePath = product.image || null;
                    }
                    let imageUrl = placeholderSvg;
                    if (typeof imagePath === 'string') {
                      // Cadena simple: puede ser relativa o absoluta; delegar en getStaticUrl
                      imageUrl = getStaticUrl(imagePath) || placeholderSvg;
                    } else if (imagePath instanceof File || (imagePath && typeof imagePath === 'object' && imagePath.type && imagePath.size)) {
                      // Archivo local (aún no subido): usar URL.createObjectURL para preview
                      try { imageUrl = URL.createObjectURL(imagePath); } catch (err) { imageUrl = placeholderSvg; }
                    } else if (imagePath && typeof imagePath === 'object') {
                      // Objeto devuelto por backend (por ejemplo { url, path }): dejar que getStaticUrl
                      // extraiga el valor correcto
                      try {
                        imageUrl = getStaticUrl(imagePath) || placeholderSvg;
                      } catch (err) {
                        imageUrl = placeholderSvg;
                      }
                    }
                    const isHidden = Boolean(product.attributes?.isHidden);
                    if (import.meta.env.DEV) {
                      console.log(`Product ${product.id} (${product.title}): image='${product.attributes?.image}' => url='${imageUrl}'`);
                    }
                    return (
                      <div key={product.id} className="product-admin-card">
                        <div className="product-admin-image">
                          <img
                            src={imageUrl}
                            alt={product.title}
                          />
                        </div>
                        <div className="product-admin-info">
                          <div className="product-admin-title-row">
                            <h3 title={product.title}>{product.title}</h3>
                            {isHidden && (
                              <span className="product-hidden-badge">Oculto</span>
                            )}
                          </div>
                          <p className="price">${Number(product.price).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                          <p className="stock">Stock: {product.stock}</p>
                          <p className="sku">SKU: {product.sku || 'N/A'}</p>
                          <div className="admin-actions admin-actions--product">
                            <button
                              type="button"
                              className="action-icon"
                              onClick={() => handleEditProduct(product)}
                              title="Editar producto"
                              aria-label="Editar producto"
                            >
                              <Pencil aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="action-icon"
                              onClick={() => handleToggleProductHidden(product)}
                              title={isHidden ? 'Mostrar en la tienda' : 'Ocultar de la tienda'}
                              aria-label={isHidden ? 'Mostrar producto' : 'Ocultar producto'}
                              disabled={togglingProductId === product.id}
                            >
                              {isHidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                            </button>
                            <button 
                              type="button"
                              className="action-icon action-icon-delete"
                              onClick={() => handleDeleteProduct(product.id)}
                              title="Eliminar producto"
                              aria-label="Eliminar producto"
                              disabled={deletingProductId === product.id}
                            >
                              <Trash2 aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'interests' && (
              <div className="tab-content">
                <div className="content-header">
                  <h2>Solicitudes por producto agotado</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="search-input interests-search-input"
                      placeholder="Buscar por nombre o WhatsApp..."
                      value={interestQ}
                      onChange={(e) => {
                        const v = e.target.value || '';
                        setInterestQ(v);
                        if (v.toString().trim() === '') {
                          // Si se borra el input, recargar lista sin filtro
                          try {
                            loadInterests(1, '');
                          } catch (err) {
                            // noop
                          }
                        }
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); loadInterests(1, interestQ); } }}
                    />
                    <button
                      type="button"
                      className="admin-audit-search-btn"
                      onClick={() => loadInterests(1, interestQ)}
                      disabled={interestLoading}
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {interestLoading ? (
                  <div className="loading">Cargando...</div>
                ) : interestError ? (
                  <div className="error">{interestError}</div>
                ) : interestRows.length === 0 ? (
                  <p className="info-text">No hay solicitudes aún</p>
                ) : (
                  <>
                    <div className="orders-pagination" role="navigation" aria-label="Paginación de solicitudes">
                      <div className="orders-pagination-info">
                        {(() => {
                          const start = (interestPage - 1) * INTERESTS_PAGE_SIZE + 1;
                          const end = Math.min((interestPage - 1) * INTERESTS_PAGE_SIZE + (Array.isArray(interestRows) ? interestRows.length : 0), interestTotal || 0);
                          return `Mostrando ${start}-${end} de ${interestTotal || 0}`;
                        })()}
                      </div>
                      <div className="orders-pagination-actions">
                        <button
                          type="button"
                          className="orders-page-btn"
                          disabled={interestPage <= 1 || interestLoading}
                          onClick={() => loadInterests(interestPage - 1, interestQ)}
                        >
                          Anterior
                        </button>
                        <span className="orders-pagination-page" aria-live="polite">
                          Página {interestPage} de {interestPages}
                        </span>
                        <button
                          type="button"
                          className="orders-page-btn"
                          disabled={interestPage >= interestPages || interestLoading}
                          onClick={() => loadInterests(interestPage + 1, interestQ)}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>

                    <div className="table-container">
                      <table className="admin-table admin-interests-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Producto</th>
                          <th>Nombre</th>
                          <th>WhatsApp</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interestRows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.createdAt ? new Date(row.createdAt).toLocaleString('es-CO') : '-'}</td>
                            <td>{row.Product?.title ? `${row.Product.title} (#${row.productId})` : `#${row.productId}`}</td>
                            <td>{row.name}</td>
                            <td>{row.whatsapp}</td>
                            <td>{row.status || 'new'}</td>
                            <td>
                              <div className="action-buttons">
                                {row.status !== 'contacted' ? (
                                  <button
                                    type="button"
                                    className="btn-sm btn-role"
                                    onClick={() => markInterestContacted(row)}
                                    title="Marcar como contactado"
                                    disabled={interestLoading || contactingInterestId === row.id}
                                  >
                                    <Check aria-hidden="true" />
                                  </button>
                                ) : (
                                  <span className="badge badge-admin">✓ Contactado</span>
                                )}

                                <button
                                  type="button"
                                  className="action-icon action-icon-delete"
                                  onClick={() => handleDeleteInterest(row)}
                                  title="Eliminar solicitud"
                                  aria-label="Eliminar solicitud"
                                  disabled={interestLoading || deletingInterestId === row.id}
                                >
                                  <Trash2 aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>

                    <div className="orders-pagination" role="navigation" aria-label="Paginación de solicitudes">
                      <div className="orders-pagination-info">
                        {(() => {
                          const start = (interestPage - 1) * INTERESTS_PAGE_SIZE + 1;
                          const end = Math.min((interestPage - 1) * INTERESTS_PAGE_SIZE + (Array.isArray(interestRows) ? interestRows.length : 0), interestTotal || 0);
                            return `Mostrando ${start}-${end} de ${interestTotal || 0}`;
                          })()}
                          </div>
                          <div className="orders-pagination-actions">
                          <button
                            type="button"
                            className="orders-page-btn"
                            disabled={interestPage <= 1 || interestLoading}
                            onClick={() => loadInterests(interestPage - 1, interestQ)}
                          >
                            Anterior
                          </button>
                          <span className="orders-pagination-page" aria-live="polite">
                            Página {interestPage} de {interestPages}
                          </span>
                          <button
                            type="button"
                            className="orders-page-btn"
                            disabled={interestPage >= interestPages || interestLoading}
                            onClick={() => loadInterests(interestPage + 1, interestQ)}
                          >
                            Siguiente
                          </button>
                          </div>
                        </div>
                        </>
                      )}
                      </div>
                    )}

                    {activeTab === 'users' && (
                      <div className="tab-content">
                      <div className="content-header users-header">
                        <h2>Gestión de Usuarios</h2>
                        <div className="users-filters">
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Buscar por nombre, apellido o email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-new-product"
                          onClick={() => setShowCreateUserModal(true)}
                        >
                          <span className="admin-icon" aria-hidden="true"><Plus /></span>
                          Nuevo Usuario
                        </button>
                        </div>
                      </div>

                      {filteredUsers.length === 0 ? (
                        <p className="info-text">
                        {users.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios que coincidan con la búsqueda'}
                        </p>
                      ) : (
                        <>
                        <div className="orders-pagination" role="navigation" aria-label="Paginación de usuarios">
                          <div className="orders-pagination-info">
                          Mostrando {usersStartIndex + 1}-{Math.min(usersEndIndexExclusive, usersTotal)} de {usersTotal}
                          </div>
                          <div className="orders-pagination-actions">
                          <button
                            type="button"
                            className="orders-page-btn"
                            onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                            disabled={clampedUsersPage <= 1}
                          >
                            Anterior
                          </button>
                          <span className="orders-pagination-page" aria-live="polite">
                            Página {clampedUsersPage} de {usersPages}
                          </span>
                          <button
                            type="button"
                            className="orders-page-btn"
                            onClick={() => setUsersPage(p => Math.min(usersPages, p + 1))}
                            disabled={clampedUsersPage >= usersPages}
                          >
                            Siguiente
                          </button>
                          </div>
                        </div>

                        <div className="table-container">
                          <table className="admin-table admin-orders-table">
                          <thead>
                          <tr>
                            <th>ID</th>
                            <th>Nombre Completo</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Ciudad</th>
                            <th>Admin</th>
                            <th>Fecha Registro</th>
                            <th>Acciones</th>
                          </tr>
                          </thead>
                          <tbody>
                          {pagedUsers.map(u => (
                            <tr key={u.id} className={u.isAdmin ? 'admin-row' : ''}>
                            <td><strong>#{u.id}</strong></td>
                            <td>
                              <button 
                              className="user-link user-link--plain"
                              onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                              >
                              {u.name} {u.lastName}
                              </button>
                            </td>
                            <td>{u.email}</td>
                            <td>{u.phone || '-'}</td>
                            <td>{u.city || '-'}</td>
                            <td>
                              {u.isAdmin ? (
                              <span className="badge badge-admin">✓ Admin</span>
                              ) : (
                              <span className="badge badge-user">Usuario</span>
                              )}
                            </td>
                            <td>{new Date(u.createdAt).toLocaleDateString('es-CO')}</td>
                            <td>
                              <div className="action-buttons">
                              <button
                                className="btn-sm btn-role"
                                onClick={() => handleToggleUserRole(u.id, u.isAdmin)}
                                title={u.isAdmin ? 'Quitar admin' : 'Dar admin'}
                                disabled={togglingUserId === u.id}
                              >
                                {u.isAdmin ? <Crown aria-hidden="true" /> : <Unlock aria-hidden="true" />}
                              </button>
                              {u.id !== user.id && (
                                <button
                                type="button"
                                className="action-icon action-icon-delete"
                                onClick={() => handleDeleteUser(u.id)}
                                title="Eliminar usuario"
                                aria-label="Eliminar usuario"
                                disabled={deletingUserId === u.id}
                                >
                                <Trash2 aria-hidden="true" />
                                </button>
                              )}
                              </div>
                            </td>
                            </tr>
                          ))}
                          </tbody>
                          </table>
                        </div>

                        <div className="orders-pagination" role="navigation" aria-label="Paginación de usuarios">
                          <div className="orders-pagination-info">
                          Mostrando {usersStartIndex + 1}-{Math.min(usersEndIndexExclusive, usersTotal)} de {usersTotal}
                          </div>
                          <div className="orders-pagination-actions">
                          <button
                            type="button"
                            className="orders-page-btn"
                            onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                            disabled={clampedUsersPage <= 1}
                          >
                            Anterior
                          </button>
                          <span className="orders-pagination-page" aria-live="polite">
                            Página {clampedUsersPage} de {usersPages}
                          </span>
                          <button
                            type="button"
                            className="orders-page-btn"
                            onClick={() => setUsersPage(p => Math.min(usersPages, p + 1))}
                            disabled={clampedUsersPage >= usersPages}
                          >
                            Siguiente
                          </button>
                          </div>
                        </div>
                        </>
                      )}
                      </div>
                    )}

                    {activeTab === 'orders' && (
                      <div className="tab-content">
                      <div className="content-header orders-header">
                        <h2>Gestión de Pedidos</h2>
                        <div className="order-filters">
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Buscar por ID, cliente o email..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                        />
                        <select
                          className="filter-select"
                          value={channelFilter}
                          onChange={(e) => setChannelFilter(e.target.value)}
                          title="Filtrar por canal"
                        >
                          <option value="">Todos los canales</option>
                          <option value="web">Web</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="marketplace">Marketplace</option>
                          <option value="presencial">Presencial</option>
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="other">Otro</option>
                        </select>
                        <select
                          className="filter-select"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="">Todos los estados</option>
                          <option value="pending">Pendiente</option>
                          <option value="paid">Pagado</option>
                          <option value="processing">Procesando</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>

                        <button
                          type="button"
                          className="btn-new-product"
                          onClick={openManualOrderModal}
                          title="Registrar venta externa"
                        >
                          <span className="admin-icon" aria-hidden="true"><Plus /></span>
                          Venta externa
                        </button>
                        </div>
                      </div>

                      {filteredOrders.length === 0 ? (
                        <p className="info-text">
                        {orders.length === 0 ? 'No hay pedidos registrados' : 'No se encontraron pedidos que coincidan con los filtros'}
                        </p>
                      ) : (
                        <>
                        <div className="orders-pagination" role="navigation" aria-label="Paginación de pedidos">
                          <div className="orders-pagination-info">
                          Mostrando {ordersStartIndex + 1}-{Math.min(ordersEndIndexExclusive, ordersTotal)} de {ordersTotal}
                          </div>
                          <div className="orders-pagination-actions">
                          <button
                            type="button"
                            className="orders-page-btn"
                            onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                            disabled={clampedOrdersPage <= 1}
                          >
                            Anterior
                          </button>
                          <span className="orders-pagination-page" aria-live="polite">
                            Página {clampedOrdersPage} de {ordersTotalPages}
                          </span>
                          <button
                            type="button"
                            className="orders-page-btn"
                            onClick={() => setOrdersPage(p => Math.min(ordersTotalPages, p + 1))}
                            disabled={clampedOrdersPage >= ordersTotalPages}
                          >
                            Siguiente
                          </button>
                          </div>
                        </div>

                        <div className="table-container">
                          <table className="admin-table admin-orders-table">
                          <thead>
                          <tr>
                            <th>ID Pedido</th>
                            <th>Cliente</th>
                            <th>Email</th>
                            <th>Canal</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Items</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                          </tr>
                          </thead>
                          <tbody>
                          {pagedOrders.map(order => (
                            <tr key={order.id}>
                            <td>
                              <button
                              className="order-link"
                              onClick={() => openOrderModal(order)}
                              >
                              #{order.id}
                              </button>
                            </td>
                            <td>{order.customerName || 'N/A'}</td>
                            <td>{order.customerEmail || 'N/A'}</td>
                            <td style={{ textTransform: 'capitalize' }}>{(order.sourceChannel || 'web').toString().replace('_', ' ')}</td>
                            <td className="admin-price">
                              ${Number(order.total).toLocaleString('es-CO')}
                            </td>
                            <td>
                              {(() => {
                                const statusKey = normalizeOrderStatus(order.status);
                                return (
                                  <div className="status-control">
                                    <span
                                      className={`status-icon status-${statusKey}`}
                                      title={getOrderStatusLabel(statusKey)}
                                    >
                                      {getOrderStatusIcon(statusKey)}
                                    </span>

                                    <select
                                      className={`status-select status-${statusKey}`}
                                      value={statusKey}
                                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                    >
                                      {statusKey === 'unknown' && (
                                        <option value="unknown" disabled>
                                          Desconocido
                                        </option>
                                      )}
                                      <option value="pending">Pendiente</option>
                                      <option value="paid">Pagado</option>
                                      <option value="processing">Procesando</option>
                                      <option value="shipped">Enviado</option>
                                      <option value="delivered">Entregado</option>
                                      <option value="cancelled">Cancelado</option>
                                    </select>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="items-count">{order.items?.length || 0}</td>
                            <td>{new Date(order.createdAt).toLocaleDateString('es-CO')}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-sm btn-view"
                                  onClick={() => openOrderModal(order)}
                                  title="Ver detalles"
                                >
                                  <Eye aria-hidden="true" />
                                </button>
                                <button
                                  className="btn-sm btn-role"
                                  onClick={() => openEditOrderModal(order)}
                                  title="Editar pedido"
                                >
                                  <Pencil aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon action-icon-delete"
                                  onClick={() => handleDeleteOrder(order)}
                                  title="Eliminar pedido"
                                  aria-label="Eliminar pedido"
                                >
                                  <Trash2 aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>

                    <div className="orders-pagination" role="navigation" aria-label="Paginación de pedidos">
                      <div className="orders-pagination-info">
                        Mostrando {ordersStartIndex + 1}-{Math.min(ordersEndIndexExclusive, ordersTotal)} de {ordersTotal}
                      </div>
                      <div className="orders-pagination-actions">
                        <button
                          type="button"
                          className="orders-page-btn"
                          onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                          disabled={clampedOrdersPage <= 1}
                        >
                          Anterior
                        </button>
                        <span className="orders-pagination-page" aria-live="polite">
                          Página {clampedOrdersPage} de {ordersTotalPages}
                        </span>
                        <button
                          type="button"
                          className="orders-page-btn"
                          onClick={() => setOrdersPage(p => Math.min(ordersTotalPages, p + 1))}
                          disabled={clampedOrdersPage >= ordersTotalPages}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========== MODAL USUARIO ========== */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Usuario</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}><X aria-hidden="true" /></button>
            </div>

            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>ID</label>
                  <p>{selectedUser.id}</p>
                </div>
                <div className="info-item">
                  <label>Nombre Completo</label>
                  <p>{selectedUser.name} {selectedUser.lastName}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="info-item">
                  <label>Teléfono</label>
                  <p>{selectedUser.phone || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Ciudad</label>
                  <p>{selectedUser.city || '-'}</p>
                </div>
                <div className="info-item">
                  <label>Estado Admin</label>
                  <p>{selectedUser.isAdmin ? '✓ Administrador' : 'Usuario Regular'}</p>
                </div>
                <div className="info-item">
                  <label>Fecha de Registro</label>
                  <p>{new Date(selectedUser.createdAt).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  handleToggleUserRole(selectedUser.id, selectedUser.isAdmin);
                  setShowUserModal(false);
                }}
              >
                {selectedUser.isAdmin ? (
                  <>
                    <span className="admin-icon" aria-hidden="true"><Unlock /></span>
                    Quitar Admin
                  </>
                ) : (
                  <>
                    <span className="admin-icon" aria-hidden="true"><Crown /></span>
                    Hacer Admin
                  </>
                )}
              </button>
              {selectedUser.id !== user.id && (
                <button
                  className="btn-danger"
                  onClick={() => {
                    handleDeleteUser(selectedUser.id);
                    setShowUserModal(false);
                  }}
                >
                  <span className="admin-icon" aria-hidden="true"><Trash2 /></span>
                  Eliminar Usuario
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowUserModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL CREAR USUARIO ========== */}
      {showCreateUserModal && (
        <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Usuario</h2>
              <button className="modal-close" onClick={() => setShowCreateUserModal(false)}><X aria-hidden="true" /></button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={createUserData.name}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      disabled={creatingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>Apellido</label>
                    <input
                      type="text"
                      value={createUserData.lastName}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={creatingUser}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={createUserData.email}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      disabled={creatingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contraseña *</label>
                    <input
                      type="password"
                      value={createUserData.password}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      disabled={creatingUser}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={createUserData.phone}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={creatingUser}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      value={createUserData.city}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, city: e.target.value }))}
                      disabled={creatingUser}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(createUserData.isAdmin)}
                      onChange={(e) => setCreateUserData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                      disabled={creatingUser}
                      style={{ width: 'auto' }}
                    />
                    Crear como admin
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-primary" type="submit" disabled={creatingUser}>
                  <span className="admin-icon" aria-hidden="true"><Save /></span>
                  {creatingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  disabled={creatingUser}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL EDITAR ORDEN ========== */}
      {showEditOrderModal && editingOrder && (
        <div className="modal-overlay" onClick={() => !savingOrderEdit && setShowEditOrderModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar pedido #{editingOrder.id}</h2>
              <button
                className="modal-close"
                onClick={() => !savingOrderEdit && setShowEditOrderModal(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Cliente</label>
                    <input
                      type="text"
                      value={editOrderData.customerName}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, customerName: e.target.value }))}
                      disabled={savingOrderEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={editOrderData.customerPhone}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      disabled={savingOrderEdit}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editOrderData.customerEmail}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      disabled={savingOrderEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Canal</label>
                    <select
                      value={editOrderData.sourceChannel}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, sourceChannel: e.target.value }))}
                      disabled={savingOrderEdit}
                    >
                      <option value="web">Web</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="marketplace">Marketplace</option>
                      <option value="presencial">Presencial</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Método de pago</label>
                    <select
                      value={editOrderData.paymentMethod}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      disabled={savingOrderEdit}
                    >
                      <option value="wompi">Wompi</option>
                      <option value="card">Tarjeta</option>
                      <option value="pse">PSE</option>
                      <option value="nequi">Nequi</option>
                      <option value="daviplata">Daviplata</option>
                      <option value="bancolombia_transfer">Transferencia Bancolombia</option>
                      <option value="corresponsales_bancolombia">Corresponsales Bancolombia</option>
                      <option value="cash">Efectivo</option>
                      <option value="cash_delivery">Contra entrega</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Referencia</label>
                    <input
                      type="text"
                      value={editOrderData.paymentReference}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, paymentReference: e.target.value }))}
                      disabled={savingOrderEdit}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      value={editOrderData.shippingCity}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, shippingCity: e.target.value }))}
                      disabled={savingOrderEdit}
                    />
                  </div>
                  <div className="form-group">
                    <label>Costo de envío</label>
                    <input
                      type="text"
                      value={editOrderData.shippingCost}
                      onChange={(e) => setEditOrderData(prev => ({ ...prev, shippingCost: e.target.value }))}
                      disabled={savingOrderEdit}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <textarea
                    value={editOrderData.shippingAddress}
                    onChange={(e) => setEditOrderData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                    disabled={savingOrderEdit}
                    rows={3}
                  />
                </div>

                {(editOrderData.sourceChannel || 'web') !== 'web' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Subtotal</label>
                      <input
                        type="text"
                        value={editOrderData.subtotal}
                        onChange={(e) => setEditOrderData(prev => ({ ...prev, subtotal: e.target.value }))}
                        disabled={savingOrderEdit}
                      />
                    </div>
                    <div className="form-group">
                      <label>Total</label>
                      <input
                        type="text"
                        value={editOrderData.total}
                        onChange={(e) => setEditOrderData(prev => ({ ...prev, total: e.target.value }))}
                        disabled={savingOrderEdit}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-primary" type="submit" disabled={savingOrderEdit}>
                  <span className="admin-icon" aria-hidden="true"><Save /></span>
                  {savingOrderEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setShowEditOrderModal(false)}
                  disabled={savingOrderEdit}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL VENTA EXTERNA ========== */}
      {showManualOrderModal && (
        <div className="modal-overlay" onClick={() => setShowManualOrderModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar venta externa</h2>
              <button className="modal-close" onClick={() => setShowManualOrderModal(false)}><X aria-hidden="true" /></button>
            </div>

            <form onSubmit={handleCreateManualOrder}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Canal *</label>
                    <select
                      className="filter-select"
                      value={manualOrderData.sourceChannel}
                      onChange={(e) => setManualOrderData(prev => ({ ...prev, sourceChannel: e.target.value }))}
                      disabled={creatingManualOrder}
                      required
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="marketplace">Marketplace</option>
                      <option value="presencial">Presencial</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="other">Otro</option>
                      <option value="web">Web</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      className="filter-select"
                      value={manualOrderData.status}
                      onChange={(e) => setManualOrderData(prev => ({ ...prev, status: e.target.value }))}
                      disabled={creatingManualOrder}
                    >
                      <option value="paid">Pagado</option>
                      <option value="pending">Pendiente</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cliente</label>
                    <input
                      type="text"
                      value={manualOrderData.customerName}
                      onChange={(e) => setManualOrderData(prev => ({ ...prev, customerName: e.target.value }))}
                      disabled={creatingManualOrder}
                      placeholder="Nombre del cliente (opcional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={manualOrderData.customerPhone}
                      onChange={(e) => setManualOrderData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      disabled={creatingManualOrder}
                      placeholder="WhatsApp / teléfono (opcional)"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={manualOrderData.customerEmail}
                      onChange={(e) => setManualOrderData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      disabled={creatingManualOrder}
                      placeholder="Email (opcional)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Total (editable) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualOrderData.total}
                      onChange={(e) => setManualOrderData(prev => ({ ...prev, total: e.target.value }))}
                      disabled={creatingManualOrder}
                      required
                      placeholder="Ej: 120000"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.25rem' }}>
                  <label>Productos *</label>
                  <div className="table-container">
                    <table className="admin-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ width: 110 }}>Cantidad</th>
                          <th style={{ width: 200 }}>Color</th>
                          <th style={{ width: 90 }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(manualItems) ? manualItems : []).map((row, idx) => (
                          <tr key={idx}>
                            {(() => {
                              const pid = row?.productId ? Number(row.productId) : null;
                              const product = pid ? (Array.isArray(products) ? products : []).find(p => Number(p.id) === pid) : null;
                              const variants = Array.isArray(product?.attributes?.colorVariants) ? product.attributes.colorVariants : [];
                              const requiresColor = variants.length > 0;

                              return (
                                <>
                            <td>
                              <select
                                className="filter-select"
                                value={row.productId}
                                onChange={(e) => updateManualItem(idx, { productId: e.target.value, color: '' })}
                                disabled={creatingManualOrder}
                                required
                              >
                                <option value="">Selecciona un producto...</option>
                                {(Array.isArray(products) ? products : []).map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.title} (stock: {p.stock})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={row.quantity}
                                onChange={(e) => updateManualItem(idx, { quantity: e.target.value })}
                                disabled={creatingManualOrder}
                                style={{ width: '100%' }}
                              />
                            </td>
                            <td>
                              {requiresColor ? (
                                <select
                                  className="filter-select"
                                  value={row.color}
                                  onChange={(e) => updateManualItem(idx, { color: e.target.value })}
                                  disabled={creatingManualOrder || !row.productId}
                                  required
                                >
                                  <option value="">Selecciona color...</option>
                                  {variants.map((v, i) => (
                                    <option key={(v?.name || '') + i} value={(v?.name || '').toString()}>
                                      {(v?.name || 'Color').toString()} (stock: {Number(v?.stock) || 0})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ color: 'var(--gray-500)' }}>Sin variantes</span>
                              )}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  className="action-icon action-icon-delete"
                                  onClick={() => removeManualItemRow(idx)}
                                  disabled={creatingManualOrder}
                                  title="Quitar"
                                  aria-label="Quitar"
                                >
                                  <Trash2 aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                                </>
                              );
                            })()}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-sm btn-role"
                      onClick={addManualItemRow}
                      disabled={creatingManualOrder}
                      title="Agregar producto"
                    >
                      <Plus aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-primary" type="submit" disabled={creatingManualOrder}>
                  <span className="admin-icon" aria-hidden="true"><Save /></span>
                  {creatingManualOrder ? 'Guardando...' : 'Registrar venta'}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setShowManualOrderModal(false)}
                  disabled={creatingManualOrder}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL ORDEN ========== */}
      {showOrderModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowOrderModal(false)}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '0',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px 30px',
              borderRadius: '16px 16px 0 0',
              color: 'white',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                <X aria-hidden="true" />
              </button>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                <span className="admin-icon" aria-hidden="true"><Package /></span>
                Pedido #{selectedOrder.id}
              </h2>
              <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                {new Date(selectedOrder.createdAt).toLocaleDateString('es-CO', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '30px' }}>
              {/* Estado Badge */}
              <div style={{ marginBottom: '24px' }}>
                {(() => {
                  const statusKey = normalizeOrderStatus(selectedOrder.status);
                  return (
                <span style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: 
                    statusKey === 'delivered' ? '#d4edda' :
                    statusKey === 'shipped' ? '#cce5ff' :
                    statusKey === 'processing' ? '#fff3cd' :
                    statusKey === 'paid' ? '#d1ecf1' :
                    statusKey === 'pending' ? '#fff3cd' :
                    statusKey === 'cancelled' ? '#f8d7da' : '#e2e3e5',
                  color:
                    statusKey === 'delivered' ? '#155724' :
                    statusKey === 'shipped' ? '#004085' :
                    statusKey === 'processing' ? '#856404' :
                    statusKey === 'paid' ? '#0c5460' :
                    statusKey === 'pending' ? '#856404' :
                    statusKey === 'cancelled' ? '#721c24' : '#383d41'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {getOrderStatusIcon(statusKey, { size: 16 })}
                    {getOrderStatusLabel(statusKey)}
                  </span>
                </span>
                  );
                })()}
              </div>

              {/* Cliente Info */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#495057', fontWeight: '600' }}>
                  <User aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Información del Cliente
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                    <strong style={{ color: '#495057' }}>Nombre:</strong> {selectedOrder.customerName || 'No disponible'}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                    <strong style={{ color: '#495057' }}>Email:</strong> {selectedOrder.customerEmail || 'No disponible'}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                    <strong style={{ color: '#495057' }}>Teléfono:</strong> {selectedOrder.customerPhone || 'No disponible'}
                  </p>
                </div>
              </div>

              {/* Dirección */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#495057', fontWeight: '600' }}>
                  <MapPin aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Dirección de Entrega
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                    <strong style={{ color: '#495057' }}>Dirección:</strong> {selectedOrder.shippingAddress || 'No disponible'}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                    <strong style={{ color: '#495057' }}>Ciudad:</strong> {selectedOrder.shippingCity || 'No disponible'}
                  </p>
                </div>
              </div>

                {/* Medio de Pago */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#495057', fontWeight: '600' }}>
                    <CreditCard aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    Medio de Pago
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                      <strong style={{ color: '#495057' }}>Método:</strong> {(() => {
                        const pm = selectedOrder.paymentMethod;
                        if (!pm) return 'No disponible';
                        const map = {
                          wompi: 'Pago en línea (Wompi)',
                          card: 'Tarjeta',
                          cash: 'Efectivo',
                          other: 'Otro'
                        };
                        return map[pm] || pm;
                      })()}
                    </p>
                    {selectedOrder.paymentStatus && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                        <strong style={{ color: '#495057' }}>Estado del pago:</strong> {selectedOrder.paymentStatus}
                      </p>
                    )}
                    {selectedOrder.paymentReference && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                        <strong style={{ color: '#495057' }}>Referencia:</strong> {selectedOrder.paymentReference}
                      </p>
                    )}
                  </div>
                </div>

              {/* Artículos */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#495057', fontWeight: '600' }}>
                  <ShoppingBag aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Artículos ({selectedOrder.items?.length || 0})
                </h3>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {selectedOrder.items.map((item, index) => (
                      <div key={item.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: '16px',
                        alignItems: 'center',
                        padding: '16px',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                        borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #dee2e6' : 'none'
                      }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '500', color: '#212529', fontSize: '14px' }}>
                            {item.title || item.productTitle}
                          </p>
                          {item.color && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                              Color: {item.color}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: '#e9ecef',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#495057'
                          }}>
                            ×{item.quantity}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: '600', color: '#212529', fontSize: '14px' }}>
                            ${Number(item.price).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6c757d', fontSize: '14px' }}>No hay artículos en este pedido</p>
                )}
              </div>

              {/* Total */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6c757d', fontSize: '14px' }}>Subtotal:</span>
                  <span style={{ color: '#495057', fontSize: '14px', fontWeight: '600' }}>
                    ${Number(selectedOrder.subtotal || 0).toLocaleString('es-CO')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #dee2e6' }}>
                  <span style={{ color: '#6c757d', fontSize: '14px' }}>Envío:</span>
                  <span style={{ color: '#495057', fontSize: '14px', fontWeight: '600' }}>
                    ${Number(selectedOrder.shippingCost || 0).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '500' }}>
                    Total del Pedido
                  </span>
                  <span style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
                    ${Number(selectedOrder.total).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Botón Cerrar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowOrderModal(false)}
                  style={{
                    width: 'auto',
                    padding: '8px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={e => e.target.style.backgroundColor = '#6c757d'}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      
    </div>
  );
}
