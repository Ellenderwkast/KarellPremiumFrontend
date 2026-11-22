import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Barcode, Download, Eye, Pencil, Plus, Printer, Save, Trash2, X } from 'lucide-react';
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

const fitTextLines = (doc, text, maxWidth, fontSize, maxLines, bold) => {
  const value = String(text ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00AD]/g, '')
    // jsPDF's built-in Helvetica font cannot encode these Turkish glyphs reliably.
    .replace(/[ıİğĞşŞ]/g, character => ({
      ı: 'i',
      İ: 'I',
      ğ: 'g',
      Ğ: 'G',
      ş: 's',
      Ş: 'S'
    })[character])
    .replace(/\s+/g, ' ')
    .trim();
  if (!value || !Number.isFinite(maxWidth) || maxWidth <= 0 || maxLines <= 0) return [];
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const safeWidth = maxWidth - 0.4;
  if (safeWidth <= 0) return [];
  const textWidth = value => {
    const width = doc.getTextWidth(value);
    return Number.isFinite(width) ? width : Number.POSITIVE_INFINITY;
  };
  const allLines = [];
  let line = '';
  let lineEnd = 0;
  let omittedCharacters = false;
  const pushLine = () => {
    if (line) allLines.push({ text: line, end: lineEnd });
    line = '';
    lineEnd = 0;
  };
  const words = [];
  const wordMatcher = /\S+/g;
  let wordMatch = wordMatcher.exec(value);
  while (wordMatch) {
    words.push({ text: wordMatch[0], start: wordMatch.index, end: wordMatcher.lastIndex });
    wordMatch = wordMatcher.exec(value);
  }
  for (const word of words) {
    const candidate = line ? `${line} ${word.text}` : word.text;
    if (textWidth(candidate) <= safeWidth) {
      line = candidate;
      lineEnd = word.end;
      continue;
    }
    pushLine();
    let remaining = Array.from(word.text);
    let consumedCharacters = 0;
    while (remaining.length) {
      let segment = '';
      let consumed = 0;
      while (consumed < remaining.length) {
        const next = segment + remaining[consumed];
        if (textWidth(next) > safeWidth) break;
        segment = next;
        consumed += 1;
      }
      if (!consumed) {
        consumedCharacters += remaining[0].length;
        remaining.shift();
        omittedCharacters = true;
      } else if (consumed === remaining.length) {
        line = segment;
        lineEnd = word.start + consumedCharacters + segment.length;
        remaining = [];
      } else {
        consumedCharacters += segment.length;
        allLines.push({ text: segment, end: word.start + consumedCharacters });
        remaining = remaining.slice(consumed);
      }
    }
  }
  pushLine();
  const lines = allLines.slice(0, maxLines);
  const wasTruncated = allLines.length > maxLines || omittedCharacters;
  if (wasTruncated && lines.length) {
    const lastLineIndex = lines.length - 1;
    const lastLine = lines[lastLineIndex];
    let filledLine = lastLine.text;
    const remainingText = value.slice(lastLine.end);
    for (const character of Array.from(remainingText)) {
      if (textWidth(`${filledLine}${character}…`) > safeWidth) break;
      filledLine += character;
    }
    const characters = Array.from(filledLine.trimEnd());
    while (characters.length && textWidth(`${characters.join('')}…`) > safeWidth) {
      characters.pop();
    }
    const ellipsis = textWidth('…') <= safeWidth ? '…' : '';
    lines[lastLineIndex].text = `${characters.join('')}${ellipsis}`;
  }
  return lines.map(({ text }) => text);
};

const drawText = (doc, text, x, y, maxWidth, fontSize = 8, maxLines = 2, bold = false, align = 'left') => {
  const lines = fitTextLines(doc, text, maxWidth, fontSize, maxLines, bold);
  if (!lines.length) return y;
  const lineHeight = fontSize * 0.42;
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight, { align });
  });
  return y + lines.length * lineHeight;
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

const drawSymbols = (doc, symbols, x, y, width, scale = 1) => {
  const active = Object.entries(symbols || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
    .filter(key => SYMBOL_LABELS[key]);
  if (!active.length) return;

  const gap = 3 * scale;
  if (width < active.length * 8 * scale + gap * (active.length - 1)) return;
  const cellWidth = Math.min(16 * scale, (width - gap * (active.length - 1)) / active.length);
  active.forEach((key, index) => {
    const cellX = x + index * (cellWidth + gap);
    const centerX = cellX + cellWidth / 2;
    doc.setDrawColor(25);
    doc.setTextColor(15);
    doc.setLineWidth(0.45 * scale);

    if (key === 'weee') {
      doc.line(centerX - 3 * scale, y - 6 * scale, centerX + 3 * scale, y - 6 * scale);
      doc.line(centerX - 2 * scale, y - 7 * scale, centerX + 2 * scale, y - 7 * scale);
      doc.line(centerX - 2.5 * scale, y - 5.3 * scale, centerX - 1.5 * scale, y + 0.2 * scale);
      doc.line(centerX + 2.5 * scale, y - 5.3 * scale, centerX + 1.5 * scale, y + 0.2 * scale);
      doc.line(centerX - 1.5 * scale, y + 0.2 * scale, centerX + 1.5 * scale, y + 0.2 * scale);
      doc.line(centerX - 4 * scale, y - 7.5 * scale, centerX + 4 * scale, y + 1 * scale);
      doc.line(centerX + 4 * scale, y - 7.5 * scale, centerX - 4 * scale, y + 1 * scale);
      return;
    }

    if (key === 'recycling') {
      const points = [
        [centerX - 4 * scale, y - 1 * scale, centerX - 1 * scale, y - 7 * scale],
        [centerX - 1 * scale, y - 7 * scale, centerX + 4 * scale, y - 5 * scale],
        [centerX + 4 * scale, y - 5 * scale, centerX + 3 * scale, y + 1 * scale],
        [centerX + 3 * scale, y + 1 * scale, centerX - 4 * scale, y - 1 * scale]
      ];
      points.forEach(([x1, y1, x2, y2]) => doc.line(x1, y1, x2, y2));
      doc.line(centerX - 1 * scale, y - 7 * scale, centerX + 1 * scale, y - 7 * scale);
      doc.line(centerX + 4 * scale, y - 5 * scale, centerX + 4 * scale, y - 3 * scale);
      doc.line(centerX - 4 * scale, y - 1 * scale, centerX - 2 * scale, y - 2 * scale);
      return;
    }

    const label = SYMBOL_LABELS[key];
    doc.setFont('helvetica', 'bold');
    const fontSize = key === 'ukca' ? 8 : key === 'ce' ? 12 : 9;
    doc.setFontSize(Math.max(4, fontSize * scale));
    doc.text(label, centerX, y - scale, { align: 'center' });
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
  doc.saveGraphicsState();
  doc.rect(x + 0.6, y + 0.6, width - 1.2, height - 1.2);
  doc.clip();
  doc.discardPath();

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
      drawText(doc, model, x + margin, headingY, title ? contentWidth * 0.34 : contentWidth, 7, 1, true);
    }
    if (title) {
      const titleWidth = model ? contentWidth * 0.62 : contentWidth;
      drawText(doc, title, x + width - margin, headingY, titleWidth, 7, 1, true, 'right');
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
    drawText(doc, item.code, x + margin, y + height - margin, contentWidth, 7, 1, true);
    if (fields.origin && enabled('showOrigin')) {
      drawText(doc, `Made in ${fields.origin}`, x + width - margin, y + height - margin, contentWidth, 6, 1, false, 'right');
    }
    doc.restoreGraphicsState();
    return;
  }

  if (isCombined) {
    const leftX = x + margin;
    const symbolScale = Math.min(1, height / 75);
    const activeSymbols = Object.values(settings.symbols || {}).some(Boolean);
    const codeY = y + height - margin - 1;
    const maxBarcodeHeight = Math.max(0, codeY - y - margin - 4);
    const barcodeHeight = barcodeEnabled
      ? Math.min(Math.max(7, height * 0.12), maxBarcodeHeight)
      : 0;
    const hasBarcode = barcodeEnabled && barcodeHeight > 2;
    const symbolRegionHeight = activeSymbols ? 8.5 * symbolScale : 0;
    const symbolsBarcodeGap = activeSymbols && hasBarcode ? 2.5 : 0;
    const barcodeStackHeight = (hasBarcode ? barcodeHeight : 0) + symbolRegionHeight + symbolsBarcodeGap;
    const maxQrSize = Math.min(width * 0.36, height * 0.28, contentWidth * 0.42);
    const qrSize = qrData ? Math.min(maxQrSize, Math.max(18, barcodeStackHeight)) : 0;
    const hasQr = qrSize > 0;
    const footerHeight = Math.max(barcodeStackHeight, hasQr ? qrSize : 0);
    const footerY = codeY - footerHeight - (hasBarcode ? 2 : 0);
    const stackY = footerY + (footerHeight - barcodeStackHeight) / 2;
    const barcodeY = stackY + symbolRegionHeight + symbolsBarcodeGap;
    const qrX = x + width - margin - qrSize;
    const qrY = footerY + (footerHeight - qrSize) / 2;
    const symbolsY = activeSymbols ? stackY + (7.5 * symbolScale) : codeY;
    const textBottomY = footerHeight > 0 ? footerY - 1 : codeY - 1;
    let cursorY = y + margin + 3;
    const drawContent = (text, fontSize, maxLines, bold = false) => {
      const availableLines = Math.floor((textBottomY - cursorY) / (fontSize * 0.42));
      const lineLimit = Math.min(maxLines, availableLines);
      if (lineLimit < 1) return false;
      const nextY = drawText(doc, text, leftX, cursorY, contentWidth, fontSize, lineLimit, bold);
      if (nextY <= cursorY) return false;
      cursorY = nextY + 0.35;
      return true;
    };
    const title = enabled('showTitle') ? fields.title : '';
    const model = enabled('showModel') ? fields.model : '';
    if (title) drawContent(title, 9, 2, true);
    if (model && (!title || model.trim().toLowerCase() !== title.trim().toLowerCase())) {
      drawContent(title ? `Modelo: ${model}` : model, title ? 7 : 9, 2, !title);
    }
    if (enabled('showColor') && fields.color) {
      drawContent(`Color: ${fields.color}`, 7, 2);
    }
    if (enabled('showOrigin') && fields.origin) {
      drawContent(`Origen: ${fields.origin}`, 6, 2);
    }
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
      if (!enabled(setting) || !fields[key]) continue;
      if (!drawContent(`${label}: ${fields[key]}`, 6, 2)) break;
    }
    if (hasQr) doc.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
    const footerContentWidth = Math.max(0, contentWidth - (hasQr ? qrSize + 2 : 0));
    if (activeSymbols) drawSymbols(doc, settings.symbols, leftX, symbolsY, footerContentWidth, symbolScale);
    if (hasBarcode) {
      drawBarcode(doc, barcodeDataUrl, leftX, barcodeY, footerContentWidth, barcodeHeight);
      drawText(doc, item.code, leftX, codeY, footerContentWidth, 6, 1, true);
    }
    doc.restoreGraphicsState();
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
    drawText(doc, item.code, x + margin, y + height - margin, contentWidth, 7, 1, true);
  }
  doc.restoreGraphicsState();
};

const createLabelPages = (queue, page) => {
  const margin = 5;
  const gap = 2;
  const rightEdge = page.width - margin;
  const bottomEdge = page.height - margin;
  const labels = queue.flatMap(entry => {
    const width = Number(entry.template.widthCm) * 10;
    const height = Number(entry.template.heightCm) * 10;
    const quantity = Math.max(1, Math.floor(Number(entry.quantity) || 1));
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error(`La plantilla "${entry.template.name}" tiene dimensiones no válidas.`);
    }
    if (width > rightEdge - margin || height > bottomEdge - margin) {
      throw new Error(`La etiqueta de ${Number(entry.template.widthCm)}×${Number(entry.template.heightCm)} cm no cabe en una hoja ${page.label}.`);
    }
    return Array.from({ length: quantity }, () => ({ entry, width, height }));
  }).sort((a, b) => b.height - a.height || b.width - a.width);

  const pages = [[]];
  let pageIndex = 0;
  let cursorX = margin;
  let cursorY = margin;
  let rowHeight = 0;

  labels.forEach(label => {
    if (cursorX + label.width > rightEdge && rowHeight > 0) {
      cursorX = margin;
      cursorY += rowHeight + gap;
      rowHeight = 0;
    }
    if (cursorY + label.height > bottomEdge) {
      pageIndex += 1;
      pages.push([]);
      cursorX = margin;
      cursorY = margin;
      rowHeight = 0;
    }
    pages[pageIndex].push({
      ...label,
      x: cursorX,
      y: cursorY
    });
    cursorX += label.width + gap;
    rowHeight = Math.max(rowHeight, label.height);
  });

  return pages;
};

function AdminLabels() {
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [editingItemIds, setEditingItemIds] = useState([]);
  const [editingItemId, setEditingItemId] = useState('');
  const [fieldsDraft, setFieldsDraft] = useState({});
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
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

  const selectedItems = items.filter(item => selectedItemIds.includes(String(item.id)));
  const selectedTemplates = templates.filter(template => selectedTemplateIds.includes(String(template.id)));
  const editingItem = items.find(item => String(item.id) === editingItemId) || null;
  const editingItemIndex = editingItemIds.indexOf(editingItemId);
  const isEditingDirty = editingItem && Object.keys(FIELD_LABELS).some(key => (
    String(fieldsDraft[key] || '') !== String(editingItem.fields?.[key] || '')
  ));
  const closeItemEditor = useCallback(() => {
    if (busy) return;
    if (isEditingDirty && !window.confirm('Hay cambios sin guardar. ¿Deseas descartarlos?')) return;
    setItemModalOpen(false);
    setEditingItemIds([]);
    setEditingItemId('');
  }, [busy, isEditingDirty]);

  const closeTemplateEditor = useCallback(() => {
    if (busy) return;
    setTemplateDraft(null);
    setTemplateModalOpen(false);
  }, [busy]);

  useEffect(() => {
    if (!templateModalOpen && !itemModalOpen && !previewModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !busy) {
        if (itemModalOpen) closeItemEditor();
        else if (templateModalOpen) closeTemplateEditor();
        else {
          setPreviewModalOpen(false);
          setPreviewUrl('');
        }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [templateModalOpen, itemModalOpen, previewModalOpen, busy, closeItemEditor, closeTemplateEditor]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openItemEditor = (itemId, itemIds = [itemId]) => {
    const item = items.find(candidate => String(candidate.id) === String(itemId));
    if (!item) return;
    const editableIds = itemIds.map(String).filter(id => items.some(candidate => String(candidate.id) === id));
    setEditingItemIds(editableIds.length ? editableIds : [String(item.id)]);
    setEditingItemId(String(item.id));
    setFieldsDraft({ ...(item.fields || {}) });
    setError('');
    setNotice('');
    setItemModalOpen(true);
  };

  const moveEditingItem = direction => {
    if (isEditingDirty && !window.confirm('Hay cambios sin guardar. ¿Deseas descartarlos antes de cambiar de producto?')) return;
    const nextIndex = editingItemIndex + direction;
    const nextId = editingItemIds[nextIndex];
    const nextItem = items.find(item => String(item.id) === nextId);
    if (!nextItem) return;
    setEditingItemId(nextId);
    setFieldsDraft({ ...(nextItem.fields || {}) });
  };

  const saveLabelFields = async () => {
    if (!editingItem) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await productLabelService.updateCodeFields(editingItem.id, fieldsDraft);
      setItems(previous => previous.map(item => (
        item.id === editingItem.id ? { ...item, fields: response.data.fields } : item
      )));
      setFieldsDraft(response.data.fields);
      setNotice('Datos de la etiqueta guardados.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'No se pudo guardar la etiqueta');
    } finally {
      setBusy(false);
    }
  };

  const addToQueue = () => {
    if (!selectedItems.length || !selectedTemplates.length) return;
    const safeQuantity = Math.max(1, Math.min(500, Number(quantity) || 1));
    const additions = selectedItems.flatMap(item => selectedTemplates.map(template => ({
      key: `${Date.now()}-${item.id}-${template.id}-${Math.random()}`,
      item: { ...item, fields: { ...(item.fields || {}) } },
      template: cloneTemplate(template),
      quantity: safeQuantity
    })));
    setQueue(previous => [...previous, ...additions]);
    const count = additions.length * safeQuantity;
    setError('');
    setNotice(`${count} ${count === 1 ? 'etiqueta añadida' : 'etiquetas añadidas'} al lote.`);
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
      setSelectedTemplateIds(previous => (
        previous.includes(String(savedTemplate.id)) ? previous : [...previous, String(savedTemplate.id)]
      ));
      setTemplateDraft(cloneTemplate(savedTemplate));
      setTemplateModalOpen(false);
      setNotice('Plantilla guardada correctamente.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'No se pudo guardar la plantilla');
    } finally {
      setBusy(false);
    }
  };

  const createTemplate = () => {
    setError('');
    setNotice('');
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
    setTemplateModalOpen(true);
  };

  const editTemplate = template => {
    if (!template) return;
    setError('');
    setNotice('');
    setTemplateDraft(cloneTemplate(template));
    setTemplateModalOpen(true);
  };

  const removeTemplate = async () => {
    if (!templateDraft?.id || templateDraft.templateKey) return;
    if (!window.confirm(`¿Eliminar la plantilla "${templateDraft.name}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    setError('');
    try {
      await productLabelService.deleteTemplate(templateDraft.id);
      const remainingTemplates = templates.filter(template => template.id !== templateDraft.id);
      setTemplates(remainingTemplates);
      setSelectedTemplateIds(previous => previous.filter(id => id !== String(templateDraft.id)));
      setTemplateDraft(null);
      setTemplateModalOpen(false);
      setNotice('Plantilla eliminada.');
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'No se pudo eliminar la plantilla');
    } finally {
      setBusy(false);
    }
  };

  const buildPdf = async () => {
    if (!queue.length) {
      throw new Error('Agrega por lo menos una etiqueta al lote antes de generar la plancha.');
    }
    const page = PAGE_SIZES[pageSize];
    const pages = createLabelPages(queue, page);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize });
    const assetsByLabel = new Map();
    for (const placement of pages.flat()) {
      const { entry } = placement;
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
    pages.forEach((placements, pageIndex) => {
      if (pageIndex > 0) doc.addPage(pageSize, 'portrait');
      placements.forEach(({ entry, x, y, width, height }) => {
        const key = `${entry.template.id}:${entry.item.id}`;
        drawLabel(doc, entry, assetsByLabel.get(key), x, y, width, height);
      });
    });
    return { doc, totalLabels: pages.reduce((total, currentPage) => total + currentPage.length, 0), pageCount: pages.length };
  };

  const generatePdf = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { doc, totalLabels, pageCount } = await buildPdf();
      doc.save(`etiquetas-${new Date().toISOString().slice(0, 10)}.pdf`);
      setNotice(`PDF generado con ${totalLabels} etiquetas en ${pageCount} ${pageCount === 1 ? 'página' : 'páginas'} tamaño ${PAGE_SIZES[pageSize].label}.`);
    } catch (pdfError) {
      setError(pdfError.message || 'No se pudo generar el PDF de etiquetas');
    } finally {
      setBusy(false);
    }
  };

  const previewPdf = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { doc } = await buildPdf();
      const url = URL.createObjectURL(doc.output('blob'));
      setPreviewUrl(url);
      setPreviewModalOpen(true);
    } catch (pdfError) {
      setError(pdfError.message || 'No se pudo preparar la vista previa');
    } finally {
      setBusy(false);
    }
  };

  const closePreview = () => {
    setPreviewModalOpen(false);
    setPreviewUrl('');
  };

  if (loading) return <div className="admin-labels-loading">Cargando catálogo de etiquetas...</div>;

  return (
    <>
    <section className="admin-labels">
      <header className="admin-labels-header">
        <div>
          <h1>Etiquetas de productos</h1>
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
            <div className="admin-label-selection-toolbar">
              <span>{selectedItems.length} seleccionados</span>
              <button
                type="button"
                className="admin-labels-secondary"
                onClick={() => setSelectedItemIds(selectedItems.length === items.length ? [] : items.map(item => String(item.id)))}
                disabled={!items.length}
              >
                {selectedItems.length === items.length ? 'Quitar selección' : 'Seleccionar todos'}
              </button>
              <button
                type="button"
                className="admin-labels-secondary"
                onClick={() => openItemEditor(selectedItemIds[0], selectedItemIds)}
                disabled={!selectedItems.length || busy}
              >
                <Pencil size={15} aria-hidden="true" /> Editar seleccionados
              </button>
            </div>
            {items.length ? (
              <div className="admin-label-choice-grid" role="group" aria-label="Productos y variantes">
                {items.map(item => {
                  const itemId = String(item.id);
                  const isSelected = selectedItemIds.includes(itemId);
                  return (
                    <article className={`admin-label-choice-card${isSelected ? ' is-selected' : ''}`} key={item.id}>
                      <label className="admin-label-choice-check">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={event => setSelectedItemIds(previous => (
                            event.target.checked
                              ? (previous.includes(itemId) ? previous : [...previous, itemId])
                              : previous.filter(id => id !== itemId)
                          ))}
                        />
                        <span className="admin-labels-sr-only">Seleccionar {item.product.title}{item.variantName ? `, ${item.variantName}` : ''}</span>
                      </label>
                      <div className="admin-label-choice-copy">
                        <strong>{item.product.title}</strong>
                        <small>{item.variantName || item.product.sku || 'Producto'}</small>
                        <code>{item.code}</code>
                      </div>
                      <button
                        type="button"
                        className="admin-label-choice-edit"
                        onClick={() => openItemEditor(itemId, isSelected ? selectedItemIds : [itemId])}
                        disabled={busy}
                        aria-label={`Editar datos de ${item.product.title}${item.variantName ? `, ${item.variantName}` : ''}`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="admin-labels-empty">No hay productos o variantes disponibles.</p>
            )}
          </section>

          <section className="admin-labels-panel">
            <div className="admin-labels-panel-heading">
              <div>
                <h2>Plantillas editables</h2>
                <p>Configura el contenido, los símbolos y el tamaño físico en centímetros.</p>
              </div>
              <button type="button" className="admin-labels-secondary" onClick={createTemplate} disabled={busy}>
                <Plus size={16} aria-hidden="true" /> Nueva
              </button>
            </div>
            <div className="admin-label-selection-toolbar">
              <span>{selectedTemplates.length} seleccionadas</span>
              <button
                type="button"
                className="admin-labels-secondary"
                onClick={() => setSelectedTemplateIds(selectedTemplates.length === templates.length ? [] : templates.map(template => String(template.id)))}
                disabled={!templates.length}
              >
                {selectedTemplates.length === templates.length ? 'Quitar selección' : 'Seleccionar todas'}
              </button>
            </div>
            {templates.length ? (
              <div className="admin-label-template-cards" role="group" aria-label="Plantillas disponibles">
                {templates.map(template => {
                  const templateId = String(template.id);
                  const isSelected = selectedTemplateIds.includes(templateId);
                  return (
                    <article className={`admin-label-template-card${isSelected ? ' is-selected' : ''}`} key={template.id}>
                      <label className="admin-label-choice-check">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={event => setSelectedTemplateIds(previous => (
                            event.target.checked
                              ? (previous.includes(templateId) ? previous : [...previous, templateId])
                              : previous.filter(id => id !== templateId)
                          ))}
                        />
                        <span className="admin-labels-sr-only">Seleccionar plantilla {template.name}</span>
                      </label>
                      <div className="admin-label-choice-copy">
                        <strong>{template.name}</strong>
                        <small>{Number(template.widthCm)} × {Number(template.heightCm)} cm · {template.kind === 'barcode' ? 'Código de barras' : template.kind === 'package' ? 'Empaque' : 'Código + QR'}</small>
                      </div>
                      <button
                        type="button"
                        className="admin-label-choice-edit"
                        onClick={() => editTemplate(template)}
                        disabled={busy}
                        aria-label={`Editar plantilla ${template.name}`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="admin-labels-empty">No hay plantillas guardadas.</p>
            )}
          </section>
        </div>

        <aside className="admin-labels-panel admin-labels-batch">
          <div className="admin-labels-panel-heading">
            <div>
              <h2>Plancha de impresión</h2>
            </div>
            <Printer size={21} aria-hidden="true" />
          </div>

          <div className="admin-labels-print-fields">
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
          </div>
          <p className="admin-labels-size-note">
            {selectedItems.length && selectedTemplates.length
              ? `${selectedItems.length} productos/variantes × ${selectedTemplates.length} plantillas seleccionadas.`
              : 'Marca uno o más productos/variantes y plantillas para agregarlos al lote.'}
          </p>
          <button type="button" className="admin-labels-primary admin-labels-add-to-batch" onClick={addToQueue} disabled={busy || !selectedItems.length || !selectedTemplates.length}>
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
            <button
              type="button"
              className="admin-labels-secondary admin-labels-batch-clear"
              onClick={() => setQueue([])}
              disabled={!queue.length || busy}
            >
              Vaciar lote
            </button>
            <div className="admin-labels-download-actions">
              <button type="button" className="admin-labels-primary admin-labels-download-button" onClick={generatePdf} disabled={!queue.length || busy}>
                <Download size={16} aria-hidden="true" /> Descargar PDF
              </button>
              <button
                type="button"
                className="admin-labels-secondary admin-labels-preview-button"
                onClick={previewPdf}
                disabled={!queue.length || busy}
                aria-label="Previsualizar documento PDF"
                title="Previsualizar documento PDF"
              >
                <Eye size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <small className="admin-labels-print-note">El PDF se genera en tamaño real. En el diálogo de impresión, usa escala 100 % y desactiva “Ajustar a página”.</small>
        </aside>
      </div>
    </section>
    {templateModalOpen && templateDraft && createPortal(
      <div
        className="admin-label-template-backdrop"
        onMouseDown={event => {
          if (event.target === event.currentTarget) closeTemplateEditor();
        }}
      >
        <section
          className="admin-label-template-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-label-template-title"
        >
          <header className="admin-label-template-modal-header">
            <div>
              <span className="admin-label-template-modal-eyebrow">Plantillas de producto</span>
              <h2 id="admin-label-template-title">{templateDraft.id ? 'Editar plantilla' : 'Nueva plantilla'}</h2>
              <p>Personaliza el contenido y las dimensiones físicas de impresión.</p>
            </div>
            <button
              type="button"
              className="admin-label-template-close"
              onClick={closeTemplateEditor}
              disabled={busy}
              aria-label="Cerrar editor de plantilla"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="admin-label-template-modal-body">
            {error && <div className="admin-labels-alert admin-labels-alert--error" role="alert">{error}</div>}
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
                    <span>{label}</span>
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
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="admin-label-template-modal-footer">
            {templateDraft.id && !templateDraft.templateKey ? (
              <button type="button" className="admin-labels-danger" onClick={removeTemplate} disabled={busy}>
                <Trash2 size={16} aria-hidden="true" /> Eliminar plantilla
              </button>
            ) : <span />}
            <div className="admin-label-template-modal-actions">
              <button type="button" className="admin-labels-secondary" onClick={closeTemplateEditor} disabled={busy}>
                Cancelar
              </button>
              <button type="button" className="admin-labels-primary" onClick={saveTemplate} disabled={busy}>
                <Save size={16} aria-hidden="true" /> Guardar plantilla
              </button>
            </div>
          </footer>
        </section>
      </div>,
      document.body
    )}
    {itemModalOpen && editingItem && createPortal(
      <div
        className="admin-label-template-backdrop"
        onMouseDown={event => {
          if (event.target === event.currentTarget) closeItemEditor();
        }}
      >
        <section
          className="admin-label-template-modal admin-label-item-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-label-item-title"
        >
          <header className="admin-label-template-modal-header">
            <div className="admin-label-item-heading">
              <span className="admin-label-template-modal-eyebrow">Datos por producto o variante</span>
              <h2 id="admin-label-item-title">Editar datos de etiqueta</h2>
              <p>{editingItem.product.title}{editingItem.variantName ? ` · ${editingItem.variantName}` : ''}</p>
            </div>
            <div className="admin-label-item-navigation">
              {editingItemIds.length > 1 && (
                <span>{editingItemIndex + 1} de {editingItemIds.length} seleccionados</span>
              )}
              {editingItemIds.length > 1 && (
                <>
                  <button
                    type="button"
                    className="admin-label-template-close"
                    onClick={() => moveEditingItem(-1)}
                    disabled={busy || editingItemIndex <= 0}
                    aria-label="Editar producto anterior"
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <button
                    type="button"
                    className="admin-label-template-close"
                    onClick={() => moveEditingItem(1)}
                    disabled={busy || editingItemIndex >= editingItemIds.length - 1}
                    aria-label="Editar producto siguiente"
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                </>
              )}
              <button
                type="button"
                className="admin-label-template-close"
                onClick={closeItemEditor}
                disabled={busy}
                aria-label="Cerrar editor de etiqueta"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </header>
          <div className="admin-label-template-modal-body admin-label-item-modal-body">
            {error && <div className="admin-labels-alert admin-labels-alert--error" role="alert">{error}</div>}
            <div className="admin-label-code">
              <span>Código interno único · Code 128</span>
              <strong>{editingItem.code}</strong>
            </div>
            <div className="admin-label-fields">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <label className={`admin-labels-field${MULTILINE_FIELDS.has(key) ? ' admin-labels-field--wide' : ''}`} key={key}>
                  <span>{label}</span>
                  {MULTILINE_FIELDS.has(key) ? (
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={fieldsDraft[key] || ''}
                      onChange={event => setFieldsDraft(previous => ({ ...previous, [key]: event.target.value }))}
                    />
                  ) : (
                    <input
                      maxLength={500}
                      value={fieldsDraft[key] || ''}
                      onChange={event => setFieldsDraft(previous => ({ ...previous, [key]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
          <footer className="admin-label-template-modal-footer">
            <span />
            <div className="admin-label-template-modal-actions">
              <button type="button" className="admin-labels-secondary" onClick={closeItemEditor} disabled={busy}>
                Cerrar
              </button>
              <button type="button" className="admin-labels-primary" onClick={saveLabelFields} disabled={busy}>
                <Save size={16} aria-hidden="true" /> Guardar datos
              </button>
            </div>
          </footer>
        </section>
      </div>,
      document.body
    )}
    {previewModalOpen && previewUrl && createPortal(
      <div
        className="admin-label-template-backdrop"
        onMouseDown={event => {
          if (event.target === event.currentTarget) closePreview();
        }}
      >
        <section
          className="admin-label-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-label-preview-title"
        >
          <header className="admin-label-template-modal-header">
            <div>
              <span className="admin-label-template-modal-eyebrow">Plancha de impresión</span>
              <h2 id="admin-label-preview-title">Vista previa del documento</h2>
              <p>{queue.reduce((total, entry) => total + entry.quantity, 0)} etiquetas · Hoja {PAGE_SIZES[pageSize].label}</p>
            </div>
            <button type="button" className="admin-label-template-close" onClick={closePreview} aria-label="Cerrar vista previa">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <iframe
            className="admin-label-preview-frame"
            src={`${previewUrl}#zoom=page-fit`}
            title="Vista previa del PDF de etiquetas"
          />
        </section>
      </div>,
      document.body
    )}
    </>
  );
}

export default AdminLabels;
