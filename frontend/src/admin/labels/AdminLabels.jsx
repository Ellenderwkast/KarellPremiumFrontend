import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Barcode, Download, Plus, Printer, Save, Search, Trash2 } from 'lucide-react';
import { productLabelService } from '../../services/api';
import './adminLabels.css';

const FIELD_LABELS = {
  model: 'Modelo',
  title: 'Nombre del producto',
  color: 'Color / variante',
  brand: 'Marca',
  origin: 'País de origen',
  manufacturer: 'Fabricante',
  address: 'Dirección',
  email: 'Correo del fabricante',
  battery: 'Batería',
  batchNumber: 'Lote',
  fccId: 'FCC ID',
  euRepresentative: 'Representante en la Unión Europea',
  ukRepresentative: 'Representante en Reino Unido',
  otherRepresentative: 'Otro representante/importador',
  regulatoryText: 'Texto de cumplimiento / certificación',
  charging: 'Información eléctrica o de carga',
  recycling: 'Información de reciclaje',
  warning: 'Advertencia'
};

const MULTILINE_FIELDS = new Set([
  'address',
  'euRepresentative',
  'ukRepresentative',
  'otherRepresentative',
  'regulatoryText',
  'charging',
  'recycling',
  'warning'
]);

const TEMPLATE_SETTINGS = [
  ['showModel', 'Modelo'],
  ['showTitle', 'Nombre del producto'],
  ['showColor', 'Color / variante'],
  ['showBrand', 'Marca'],
  ['showOrigin', 'País de origen'],
  ['showManufacturer', 'Fabricante'],
  ['showAddress', 'Dirección'],
  ['showEmail', 'Correo del fabricante'],
  ['showBattery', 'Batería'],
  ['showBatchNumber', 'Lote'],
  ['showFccId', 'FCC ID'],
  ['showEuRepresentative', 'Representante en la Unión Europea'],
  ['showUkRepresentative', 'Representante en Reino Unido'],
  ['showOtherRepresentative', 'Otro representante/importador'],
  ['showRegulatoryText', 'Texto de cumplimiento'],
  ['showCharging', 'Información de carga'],
  ['showRecycling', 'Información de reciclaje'],
  ['showWarning', 'Advertencia'],
  ['showBarcode', 'Código de barras'],
  ['showQr', 'QR a la página del producto']
];

const SYMBOL_LABELS = {
  ce: 'CE',
  fcc: 'FCC',
  ukca: 'UKCA',
  weee: 'WEEE',
  recycling: 'Reciclaje'
};

const PAGE_SIZES = {
  letter: { label: 'Carta', width: 215.9, height: 279.4 },
  a4: { label: 'A4', width: 210, height: 297 }
};

const cloneTemplate = template => ({
  ...template,
  settings: {
    ...(template.settings || {}),
    symbols: { ...(template.settings?.symbols || {}) }
  }
});

const buildProductUrl = item => {
  const productId = item.product.slug || item.product.id;
  const url = new URL(`/products/${encodeURIComponent(productId)}`, window.location.origin);
  if (item.variantName) url.searchParams.set('color', item.variantName);
  return url.toString();
};

const drawText = (doc, text, x, y, maxWidth, fontSize = 8, maxLines = 2, bold = false) => {
  const value = String(text || '').trim();
  if (!value) return y;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(value, maxWidth).slice(0, maxLines);
  doc.text(lines, x, y);
  return y + lines.length * (fontSize * 0.42);
};

const createBarcodeDataUrl = code => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, code, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    height: 80,
    width: 2,
    lineColor: '#111111'
  });
  return canvas.toDataURL('image/png');
};

const drawBarcode = (doc, barcodeDataUrl, x, y, width, height) => {
  doc.addImage(barcodeDataUrl, 'PNG', x, y, width, height);
};

const drawSymbols = (doc, symbols, x, y, width) => {
  const active = Object.entries(symbols || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
    .filter(key => SYMBOL_LABELS[key]);
  if (!active.length) return;

  const gap = 3;
  const cellWidth = Math.min(16, (width - gap * (active.length - 1)) / active.length);
  active.forEach((key, index) => {
    const cellX = x + index * (cellWidth + gap);
    const centerX = cellX + cellWidth / 2;
    doc.setDrawColor(25);
    doc.setTextColor(15);
    doc.setLineWidth(0.45);

    if (key === 'weee') {
      doc.line(centerX - 3, y - 6, centerX + 3, y - 6);
      doc.line(centerX - 2, y - 7, centerX + 2, y - 7);
      doc.line(centerX - 2.5, y - 5.3, centerX - 1.5, y + 0.2);
      doc.line(centerX + 2.5, y - 5.3, centerX + 1.5, y + 0.2);
      doc.line(centerX - 1.5, y + 0.2, centerX + 1.5, y + 0.2);
      doc.line(centerX - 4, y - 7.5, centerX + 4, y + 1);
      doc.line(centerX + 4, y - 7.5, centerX - 4, y + 1);
      return;
    }

    if (key === 'recycling') {
      const points = [
        [centerX - 4, y - 1, centerX - 1, y - 7],
        [centerX - 1, y - 7, centerX + 4, y - 5],
        [centerX + 4, y - 5, centerX + 3, y + 1],
        [centerX + 3, y + 1, centerX - 4, y - 1]
      ];
      points.forEach(([x1, y1, x2, y2]) => doc.line(x1, y1, x2, y2));
      doc.line(centerX - 1, y - 7, centerX + 1, y - 7);
      doc.line(centerX + 4, y - 5, centerX + 4, y - 3);
      doc.line(centerX - 4, y - 1, centerX - 2, y - 2);
      return;
    }

    const label = SYMBOL_LABELS[key];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(key === 'ukca' ? 8 : key === 'ce' ? 12 : 9);
    doc.text(label, centerX, y - 1, { align: 'center' });
  });
};

const drawLabel = (doc, entry, assets, x, y, width, height) => {
  const { item, template } = entry;
  const fields = item.fields || {};
  const settings = template.settings || {};
  const margin = Math.max(2, Math.min(4, width * 0.045));
  const contentWidth = width - margin * 2;
  const enabled = key => settings[key] !== false;

  doc.setDrawColor(70);
  doc.setLineWidth(0.25);
  doc.roundedRect(x + 0.4, y + 0.4, width - 0.8, height - 0.8, 1, 1);
  doc.setTextColor(20);

  const barcodeEnabled = enabled('showBarcode');
  const isCompact = template.kind === 'barcode';
  const isCombined = template.kind === 'barcode_qr';
  const { barcodeDataUrl, qrData } = assets;

  if (isCompact) {
    const headingY = y + margin + 2;
    const model = enabled('showModel') ? fields.model : '';
    const title = enabled('showTitle') ? fields.title : '';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (model) {
      const modelLine = doc.splitTextToSize(model, title ? contentWidth * 0.34 : contentWidth).slice(0, 1);
      doc.text(modelLine, x + margin, headingY);
    }
    if (title) {
      const titleWidth = model ? contentWidth * 0.62 : contentWidth;
      const titleLine = doc.splitTextToSize(title, titleWidth).slice(0, 1);
      doc.text(titleLine, x + width - margin, headingY, { align: 'right' });
    }
    if (fields.color && enabled('showColor')) {
      drawText(doc, fields.color, x + margin, headingY + 3.5, contentWidth, 6, 1);
    }
    if (barcodeEnabled) {
      const qrSize = qrData ? Math.min(height * 0.52, width * 0.24) : 0;
      const codeWidth = contentWidth - (qrData ? qrSize + margin : 0);
      const codeHeight = Math.max(7, height * 0.3);
      drawBarcode(doc, barcodeDataUrl, x + margin, y + height * 0.43, codeWidth, codeHeight);
      if (qrData) doc.addImage(qrData, 'PNG', x + width - qrSize - margin, y + height * 0.38, qrSize, qrSize);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(item.code, x + margin, y + height - margin);
    if (fields.origin && enabled('showOrigin')) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`Made in ${fields.origin}`, x + width - margin, y + height - margin, { align: 'right' });
    }
    return;
  }

  if (isCombined) {
    const qrSize = Math.min(height * 0.24, width * 0.25);
    const leftWidth = width - qrSize - margin * 3;
    const leftX = x + margin;
    const qrX = x + width - margin - qrSize;
    let cursorY = y + margin + 3;
    const heading = enabled('showModel') && fields.model
      ? fields.model
      : (enabled('showTitle') ? fields.title : '');
    cursorY = drawText(doc, heading, leftX, cursorY, leftWidth, 9, 2, true) + 1;
    if (enabled('showColor') && fields.color) {
      cursorY = drawText(doc, `Color: ${fields.color}`, leftX, cursorY, leftWidth, 7, 2) + 1;
    }
    if (enabled('showOrigin') && fields.origin) {
      cursorY = drawText(doc, `Origen: ${fields.origin}`, leftX, cursorY, leftWidth, 6, 2) + 1;
    }
    if (barcodeEnabled) {
      const barcodeY = y + height * 0.57;
      const barcodeHeight = Math.max(7, height * 0.22);
      drawBarcode(doc, barcodeDataUrl, leftX, barcodeY, leftWidth, barcodeHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(item.code, leftX, y + height - margin);
    }
    if (settings.symbols) drawSymbols(doc, settings.symbols, leftX, y + height * 0.49, leftWidth);
    if (qrData) doc.addImage(qrData, 'PNG', qrX, y + (height - qrSize) / 2, qrSize, qrSize);
    const additionalFields = [
      ['brand', 'Marca', 'showBrand'],
      ['manufacturer', 'Fabricante', 'showManufacturer'],
      ['address', 'Dirección', 'showAddress'],
      ['email', 'Correo', 'showEmail'],
      ['batchNumber', 'Lote', 'showBatchNumber'],
      ['battery', 'Batería', 'showBattery'],
      ['fccId', 'FCC ID', 'showFccId'],
      ['euRepresentative', 'Rep. UE', 'showEuRepresentative'],
      ['ukRepresentative', 'Rep. RU', 'showUkRepresentative'],
      ['otherRepresentative', 'Importador', 'showOtherRepresentative'],
      ['regulatoryText', 'Cumplimiento', 'showRegulatoryText'],
      ['charging', 'Carga', 'showCharging'],
      ['recycling', 'Reciclaje', 'showRecycling'],
      ['warning', 'Advertencia', 'showWarning']
    ];
    for (const [key, label, setting] of additionalFields) {
      if (!enabled(setting) || !fields[key] || cursorY >= y + height * 0.53) continue;
      cursorY = drawText(doc, `${label}: ${fields[key]}`, leftX, cursorY, leftWidth, 6, 1) + 1;
    }
    return;
  }

  let cursorY = y + margin + 4;
  const heading = enabled('showTitle') && fields.title
    ? fields.title
    : (enabled('showModel') ? fields.model : '');
  cursorY = drawText(doc, heading, x + margin, cursorY, contentWidth, 11, 2, true) + 2;
  const dataRows = [
    ['model', 'Modelo', 'showModel'],
    ['color', 'Color', 'showColor'],
    ['brand', 'Marca', 'showBrand'],
    ['batchNumber', 'Lote', 'showBatchNumber'],
    ['battery', 'Batería', 'showBattery'],
    ['manufacturer', 'Fabricante', 'showManufacturer'],
    ['address', 'Dirección', 'showAddress'],
    ['email', 'Correo', 'showEmail'],
    ['fccId', 'FCC ID', 'showFccId'],
    ['euRepresentative', 'Representante UE', 'showEuRepresentative'],
    ['ukRepresentative', 'Representante RU', 'showUkRepresentative'],
    ['otherRepresentative', 'Importador', 'showOtherRepresentative'],
    ['regulatoryText', 'Cumplimiento', 'showRegulatoryText'],
    ['charging', 'Carga', 'showCharging'],
    ['recycling', 'Reciclaje', 'showRecycling'],
    ['origin', 'Origen', 'showOrigin'],
    ['warning', 'Advertencia', 'showWarning']
  ];
  for (const [key, label, setting] of dataRows) {
    if (!enabled(setting) || !fields[key] || cursorY >= y + height * 0.67) continue;
    cursorY = drawText(doc, `${label}: ${fields[key]}`, x + margin, cursorY, contentWidth, 7, 2) + 1;
  }

  if (settings.symbols) drawSymbols(doc, settings.symbols, x + margin, y + height * 0.73, contentWidth);

  if (qrData) {
    const qrSize = Math.min(24, height * 0.24, width * 0.25);
    doc.addImage(qrData, 'PNG', x + width - qrSize - margin, y + height - qrSize - margin, qrSize, qrSize);
  }
  if (barcodeEnabled) {
    const qrSize = qrData ? Math.min(24, height * 0.24, width * 0.25) : 0;
    const barcodeWidth = contentWidth - (qrData ? qrSize + margin : 0);
    const barcodeY = y + height * 0.77;
    drawBarcode(doc, barcodeDataUrl, x + margin, barcodeY, barcodeWidth, Math.max(8, height * 0.13));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(item.code, x + margin, y + height - margin);
  }
};

function AdminLabels() {
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [fields, setFields] = useState({});
  const [templateDraft, setTemplateDraft] = useState(null);
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pageSize, setPageSize] = useState('letter');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [catalogResponse, templateResponse] = await Promise.all([
          productLabelService.getCatalog(),
          productLabelService.getTemplates()
        ]);
        if (!Array.isArray(catalogResponse.data?.items) || !Array.isArray(templateResponse.data)) {
          throw new Error('El servidor devolvió datos de etiquetas con formato inválido');
        }
        if (active) {
          setItems(catalogResponse.data.items);
          setTemplates(templateResponse.data);
          setSelectedItemId(String(catalogResponse.data.items[0]?.id || ''));
          setSelectedTemplateId(String(templateResponse.data[0]?.id || ''));
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.response?.data?.message || loadError.message || 'No se pudieron cargar las etiquetas');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const selectedItem = items.find(item => String(item.id) === selectedItemId) || null;
  const selectedTemplate = templates.find(template => String(template.id) === selectedTemplateId) || null;

  useEffect(() => {
    setFields(selectedItem?.fields || {});
  }, [selectedItemId, items]);

  useEffect(() => {
    if (selectedTemplateId === 'new') return;
    setTemplateDraft(selectedTemplate ? cloneTemplate(selectedTemplate) : null);
  }, [selectedTemplateId, templates]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter(item => [
      item.product.title,
      item.product.sku,
      item.variantName,
      item.code
    ].some(value => String(value || '').toLowerCase().includes(normalizedQuery)));
  }, [items, query]);

  const selectedTemplateSize = selectedTemplate
    ? `${Number(selectedTemplate.widthCm)}×${Number(selectedTemplate.heightCm)}`
    : '';

  const saveLabelFields = async () => {
    if (!selectedItem) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await productLabelService.updateCodeFields(selectedItem.id, fields);
      setItems(previous => previous.map(item => (
        item.id === selectedItem.id ? { ...item, fields: response.data.fields } : item
      )));
      setNotice('Datos de la etiqueta guardados.');
      return true;
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'No se pudo guardar la etiqueta');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addToQueue = async () => {
    if (!selectedItem || !selectedTemplate) return;
    const safeQuantity = Math.max(1, Math.min(500, Number(quantity) || 1));
    const saved = await saveLabelFields();
    if (!saved) return;
    const currentItem = { ...selectedItem, fields: { ...fields } };
    setQueue(previous => [...previous, {
      key: `${Date.now()}-${Math.random()}`,
      item: currentItem,
      template: cloneTemplate(selectedTemplate),
      quantity: safeQuantity
    }]);
    setNotice(`${safeQuantity} ${safeQuantity === 1 ? 'etiqueta añadida' : 'etiquetas añadidas'} al lote.`);
  };

  const saveTemplate = async () => {
    if (!templateDraft) return;
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      name: templateDraft.name,
      kind: templateDraft.kind,
      widthCm: Number(templateDraft.widthCm),
      heightCm: Number(templateDraft.heightCm),
      settings: templateDraft.settings
    };
    try {
      const response = templateDraft.id
        ? await productLabelService.updateTemplate(templateDraft.id, payload)
        : await productLabelService.createTemplate(payload);
      const savedTemplate = response.data;
      setTemplates(previous => {
        const exists = previous.some(template => template.id === savedTemplate.id);
        return exists
          ? previous.map(template => template.id === savedTemplate.id ? savedTemplate : template)
          : [...previous, savedTemplate];
      });
      setSelectedTemplateId(String(savedTemplate.id));
      setNotice('Plantilla guardada correctamente.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'No se pudo guardar la plantilla');
    } finally {
      setBusy(false);
    }
  };

  const createTemplate = () => {
    setSelectedTemplateId('new');
    setTemplateDraft({
      name: 'Nueva plantilla',
      kind: 'barcode_qr',
      widthCm: 10,
      heightCm: 15,
      settings: {
        showModel: true,
        showTitle: true,
        showColor: true,
        showBrand: true,
        showOrigin: true,
        showManufacturer: false,
        showAddress: false,
        showEmail: false,
        showBattery: false,
        showBatchNumber: false,
        showFccId: false,
        showEuRepresentative: false,
        showUkRepresentative: false,
        showOtherRepresentative: false,
        showRegulatoryText: false,
        showCharging: false,
        showRecycling: false,
        showWarning: false,
        showBarcode: true,
        showQr: true,
        symbols: { ce: false, fcc: false, ukca: false, weee: false, recycling: false }
      }
    });
  };

  const removeTemplate = async () => {
    if (!templateDraft?.id || templateDraft.templateKey) return;
    setBusy(true);
    setError('');
    try {
      await productLabelService.deleteTemplate(templateDraft.id);
      const remainingTemplates = templates.filter(template => template.id !== templateDraft.id);
      setTemplates(remainingTemplates);
      setSelectedTemplateId(String(remainingTemplates[0]?.id || ''));
      setNotice('Plantilla eliminada.');
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'No se pudo eliminar la plantilla');
    } finally {
      setBusy(false);
    }
  };

  const generatePdf = async () => {
    if (!queue.length) {
      setError('Agrega por lo menos una etiqueta al lote antes de generar la plancha.');
      return;
    }
    const page = PAGE_SIZES[pageSize];
    const margin = 5;
    const gap = 2;
    const groupedQueue = new Map();
    for (const entry of queue) {
      const dimensions = `${Number(entry.template.widthCm).toFixed(2)}x${Number(entry.template.heightCm).toFixed(2)}`;
      if (!groupedQueue.has(dimensions)) groupedQueue.set(dimensions, []);
      groupedQueue.get(dimensions).push(entry);
    }
    const layouts = [];
    for (const entries of groupedQueue.values()) {
      const width = Number(entries[0].template.widthCm) * 10;
      const height = Number(entries[0].template.heightCm) * 10;
      const columns = Math.floor((page.width - margin * 2 + gap) / (width + gap));
      const rows = Math.floor((page.height - margin * 2 + gap) / (height + gap));
      if (columns < 1 || rows < 1) {
        setError(`La etiqueta de ${Number(entries[0].template.widthCm)}×${Number(entries[0].template.heightCm)} cm no cabe en una hoja ${page.label}.`);
        return;
      }
      layouts.push({ entries, width, height, columns, rows });
    }

    setBusy(true);
    setError('');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize });
      const assetsByLabel = new Map();
      for (const entry of queue) {
        const key = `${entry.template.id}:${entry.item.id}`;
        if (assetsByLabel.has(key)) continue;
        const [barcodeDataUrl, qrData] = await Promise.all([
          entry.template.settings?.showBarcode === false
            ? Promise.resolve(null)
            : Promise.resolve(createBarcodeDataUrl(entry.item.code)),
          entry.template.settings?.showQr === false
            ? Promise.resolve(null)
            : QRCode.toDataURL(buildProductUrl(entry.item), {
              errorCorrectionLevel: 'M',
              margin: 1,
              width: 220
            })
        ]);
        assetsByLabel.set(key, { barcodeDataUrl, qrData });
      }
      let totalLabels = 0;
      layouts.forEach((layout, layoutIndex) => {
        if (layoutIndex > 0) doc.addPage(pageSize, 'portrait');
        const labels = layout.entries.flatMap(entry => Array.from({ length: entry.quantity }, () => entry));
        const perPage = layout.columns * layout.rows;
        totalLabels += labels.length;
        labels.forEach((entry, index) => {
          if (index > 0 && index % perPage === 0) doc.addPage(pageSize, 'portrait');
          const cellIndex = index % perPage;
          const column = cellIndex % layout.columns;
          const row = Math.floor(cellIndex / layout.columns);
          const x = margin + column * (layout.width + gap);
          const y = margin + row * (layout.height + gap);
          const assetKey = `${entry.template.id}:${entry.item.id}`;
          drawLabel(doc, entry, assetsByLabel.get(assetKey), x, y, layout.width, layout.height);
        });
      });
      doc.save(`etiquetas-${new Date().toISOString().slice(0, 10)}.pdf`);
      setNotice(`PDF generado con ${totalLabels} etiquetas organizadas por tamaño en hojas ${page.label}.`);
    } catch (pdfError) {
      setError(pdfError.message || 'No se pudo generar el PDF de etiquetas');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="admin-labels-loading">Cargando catálogo de etiquetas...</div>;

  return (
    <section className="admin-labels">
      <header className="admin-labels-header">
        <div>
          <span className="admin-labels-eyebrow">Inventario e impresión</span>
          <h1>Etiquetas de productos</h1>
          <p>Asigna códigos internos únicos por variante y prepara planchas listas para imprimir.</p>
        </div>
        <div className="admin-labels-header-icon"><Barcode size={25} aria-hidden="true" /></div>
      </header>

      {error && <div className="admin-labels-alert admin-labels-alert--error" role="alert">{error}</div>}
      {notice && <div className="admin-labels-alert admin-labels-alert--success" role="status">{notice}</div>}

      <div className="admin-labels-layout">
        <div className="admin-labels-main">
          <section className="admin-labels-panel">
            <div className="admin-labels-panel-heading">
              <div>
                <h2>Datos de la etiqueta</h2>
                <p>Los códigos Code 128 se generan una sola vez y se mantienen vinculados al producto o variante.</p>
              </div>
            </div>

            <label className="admin-labels-field">
              <span>Producto o variante</span>
              <span className="admin-labels-search">
                <Search size={16} aria-hidden="true" />
                <input
                  value={query}
                  onChange={event => {
                    setQuery(event.target.value);
                    setSelectedItemId('');
                  }}
                  placeholder="Buscar producto, color o código"
                />
              </span>
              <select value={selectedItemId} onChange={event => setSelectedItemId(event.target.value)}>
                {!selectedItemId && (
                  <option value="" disabled>
                    {filteredItems.length === 0 ? 'No hay coincidencias' : 'Selecciona un producto'}
                  </option>
                )}
                {filteredItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.product.title}{item.variantName ? ` · ${item.variantName}` : ''} · ${item.code}
                  </option>
                ))}
              </select>
            </label>

            {selectedItem ? (
              <>
                <div className="admin-label-code">
                  <span>Código interno único</span>
                  <strong>{selectedItem.code}</strong>
                  <small>Code 128 · asignado una vez a este producto/variante</small>
                </div>

                <div className="admin-label-fields">
                  {Object.entries(FIELD_LABELS).map(([key, label]) => (
                    <label className={`admin-labels-field${MULTILINE_FIELDS.has(key) ? ' admin-labels-field--wide' : ''}`} key={key}>
                      <span>{label}</span>
                      {MULTILINE_FIELDS.has(key) ? (
                        <textarea
                          rows={2}
                          maxLength={2000}
                          value={fields[key] || ''}
                          onChange={event => setFields(previous => ({ ...previous, [key]: event.target.value }))}
                        />
                      ) : (
                        <input
                          maxLength={500}
                          value={fields[key] || ''}
                          onChange={event => setFields(previous => ({ ...previous, [key]: event.target.value }))}
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="admin-labels-actions">
                  <button type="button" className="admin-labels-secondary" onClick={saveLabelFields} disabled={busy}>
                    <Save size={16} aria-hidden="true" /> Guardar datos
                  </button>
                </div>
              </>
            ) : (
              <p className="admin-labels-empty">No hay productos que coincidan con la búsqueda.</p>
            )}
          </section>

          <section className="admin-labels-panel">
            <div className="admin-labels-panel-heading">
              <div>
                <h2>Plantillas editables</h2>
                <p>Configura el contenido, los símbolos y el tamaño físico en centímetros.</p>
              </div>
              <button type="button" className="admin-labels-secondary" onClick={createTemplate}>
                <Plus size={16} aria-hidden="true" /> Nueva
              </button>
            </div>

            <label className="admin-labels-field">
              <span>Plantilla</span>
              <select
                value={selectedTemplateId}
                onChange={event => setSelectedTemplateId(event.target.value)}
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
                {selectedTemplateId === 'new' && <option value="new">Nueva plantilla sin guardar</option>}
              </select>
            </label>

            {templateDraft && (
              <>
                <div className="admin-label-template-grid">
                  <label className="admin-labels-field admin-labels-field--wide">
                    <span>Nombre de plantilla</span>
                    <input
                      value={templateDraft.name}
                      maxLength={100}
                      onChange={event => setTemplateDraft(previous => ({ ...previous, name: event.target.value }))}
                    />
                  </label>
                  <label className="admin-labels-field">
                    <span>Diseño</span>
                    <select
                      value={templateDraft.kind}
                      onChange={event => setTemplateDraft(previous => ({ ...previous, kind: event.target.value }))}
                    >
                      <option value="barcode">Código de barras compacto</option>
                      <option value="package">Etiqueta de empaque</option>
                      <option value="barcode_qr">Código de barras + QR</option>
                    </select>
                  </label>
                  <label className="admin-labels-field">
                    <span>Ancho (cm)</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.1"
                      value={templateDraft.widthCm}
                      onChange={event => setTemplateDraft(previous => ({ ...previous, widthCm: event.target.value }))}
                    />
                  </label>
                  <label className="admin-labels-field">
                    <span>Alto (cm)</span>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      step="0.1"
                      value={templateDraft.heightCm}
                      onChange={event => setTemplateDraft(previous => ({ ...previous, heightCm: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="admin-label-settings">
                  <strong>Contenido visible</strong>
                  <div className="admin-label-checks">
                    {TEMPLATE_SETTINGS.map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={Boolean(templateDraft.settings?.[key])}
                          onChange={event => setTemplateDraft(previous => ({
                            ...previous,
                            settings: { ...previous.settings, [key]: event.target.checked }
                          }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {templateDraft.kind !== 'barcode' && (
                  <div className="admin-label-settings">
                    <strong>Símbolos opcionales</strong>
                    <p>Activa solo los símbolos que correspondan a tu producto.</p>
                    <div className="admin-label-checks">
                      {Object.entries(SYMBOL_LABELS).map(([key, label]) => (
                        <label key={key}>
                          <input
                            type="checkbox"
                            checked={Boolean(templateDraft.settings?.symbols?.[key])}
                            onChange={event => setTemplateDraft(previous => ({
                              ...previous,
                              settings: {
                                ...previous.settings,
                                symbols: { ...previous.settings.symbols, [key]: event.target.checked }
                              }
                            }))}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="admin-labels-actions">
                  <button type="button" className="admin-labels-secondary" onClick={saveTemplate} disabled={busy}>
                    <Save size={16} aria-hidden="true" /> Guardar plantilla
                  </button>
                  {templateDraft.id && !templateDraft.templateKey && (
                    <button type="button" className="admin-labels-danger" onClick={removeTemplate} disabled={busy}>
                      <Trash2 size={16} aria-hidden="true" /> Eliminar
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="admin-labels-panel admin-labels-batch">
          <div className="admin-labels-panel-heading">
            <div>
              <h2>Plancha de impresión</h2>
              <p>Combina productos y tamaños; el PDF separa cada dimensión en sus propias páginas.</p>
            </div>
            <Printer size={21} aria-hidden="true" />
          </div>

          <label className="admin-labels-field">
            <span>Hoja</span>
            <select value={pageSize} onChange={event => setPageSize(event.target.value)}>
              {Object.entries(PAGE_SIZES).map(([key, page]) => (
                <option key={key} value={key}>{page.label}</option>
              ))}
            </select>
          </label>
          <label className="admin-labels-field">
            <span>Cantidad</span>
            <input type="number" min="1" max="500" value={quantity} onChange={event => setQuantity(event.target.value)} />
          </label>
          <p className="admin-labels-size-note">
            {selectedTemplate
              ? `Tamaño seleccionado: ${selectedTemplateSize} cm. El PDF agrupa cada tamaño en sus propias páginas.`
              : 'Selecciona una plantilla para conocer sus dimensiones.'}
          </p>
          <button type="button" className="admin-labels-primary" onClick={addToQueue} disabled={busy || !selectedItem || !selectedTemplate}>
            <Plus size={17} aria-hidden="true" /> Agregar al lote
          </button>

          <div className="admin-label-queue-heading">
            <strong>Etiquetas en el lote</strong>
            <span>{queue.reduce((total, entry) => total + entry.quantity, 0)}</span>
          </div>
          {queue.length > 0 ? (
            <ul className="admin-label-queue">
              {queue.map(entry => (
                <li key={entry.key}>
                  <div>
                    <strong>{entry.item.product.title}</strong>
                    <small>{entry.item.variantName ? `${entry.item.variantName} · ` : ''}{entry.template.name} · {entry.quantity} copias</small>
                  </div>
                  <button
                    type="button"
                    aria-label={`Quitar ${entry.item.product.title} del lote`}
                    onClick={() => setQueue(previous => previous.filter(candidate => candidate.key !== entry.key))}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-labels-empty">Todavía no agregas etiquetas.</p>
          )}

          <div className="admin-labels-actions admin-labels-batch-actions">
            <button type="button" className="admin-labels-secondary" onClick={() => setQueue([])} disabled={!queue.length || busy}>
              Vaciar lote
            </button>
            <button type="button" className="admin-labels-primary" onClick={generatePdf} disabled={!queue.length || busy}>
              <Download size={17} aria-hidden="true" /> Descargar PDF
            </button>
          </div>
          <small className="admin-labels-print-note">El PDF se genera en tamaño real. En el diálogo de impresión, usa escala 100 % y desactiva “Ajustar a página”.</small>
        </aside>
      </div>
    </section>
  );
}

export default AdminLabels;
