import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStaticUrl } from '../services/api';

export const useCartStore = create(
  persist(
    set => ({
      items: [],
      // addItem accepts product plus options { quantity, color }
      addItem: (product, options = {}) =>
        set(state => {
          const quantity = options.quantity && options.quantity > 0 ? options.quantity : 1;
          // If no color provided but product has colorVariants, default to the first variant
          const rawColorVariants = Array.isArray(product.attributes?.colorVariants)
            ? product.attributes.colorVariants
            : [];
          const defaultVariant = rawColorVariants.length > 0 ? rawColorVariants[0] : null;
          const color = options.color || (defaultVariant ? defaultVariant.name : null);
          const colorHex = options.colorHex || (defaultVariant ? defaultVariant.hex : null);

          // Determinar la imagen correcta según el color seleccionado
          let itemImage = product.image || product.attributes?.image || null;
          // Helper: extraer string de imagen si viene como objeto y convertir a URL estática
          const extractImageString = (v) => {
            if (!v) return null;
            if (typeof v === 'string') return v.trim() || null;
            if (typeof v === 'object') {
              if (typeof v.url === 'string' && v.url.trim()) return v.url.trim();
              if (typeof v.path === 'string' && v.path.trim()) return v.path.trim();
              if (typeof v.image === 'string' && v.image.trim()) return v.image.trim();
              const vals = Object.values(v).filter(x => typeof x === 'string' && x.trim());
              if (vals.length === 1) return vals[0].trim();
            }
            return null;
          };
          if (itemImage) {
            const s = extractImageString(itemImage);
            if (s) itemImage = getStaticUrl(s);
            else if (typeof itemImage === 'string') itemImage = getStaticUrl(itemImage);
            else itemImage = null;
          }
          if (color && product.attributes?.colorVariants) {
            const colorVariant = product.attributes.colorVariants.find(v => v.name === color);
            if (colorVariant) {
              const img =
                (Array.isArray(colorVariant.images) && colorVariant.images.find(Boolean)) ||
                colorVariant.image ||
                null;
              if (img) {
                const s = extractImageString(img);
                itemImage = s ? getStaticUrl(s) : null;
              }
            }
          }

          // Use composite key: product.id + '::' + color to distinguish variants
          const key = `${product.id}::${color}`;
          const existingItem = state.items.find(item => item.key === key);
          let available = Number(product.stock ?? 0);
          if (color && Array.isArray(product.attributes?.colorVariants)) {
            const v = product.attributes.colorVariants.find(cv => (cv?.name || '').toString() === String(color));
            if (v) available = Number(v.stock ?? 0);
          }
          if (existingItem) {
            const newQty = Math.min(existingItem.quantity + quantity, available);
            return {
              items: state.items.map(item => (item.key === key ? { ...item, quantity: newQty } : item))
            };
          }
          const newItem = {
            key,
            id: product.id,
            title: product.title || product.name || '',
            price: Number(product.price) || 0,
            image: itemImage,
            color,
            colorHex,
            quantity: Math.min(quantity, available),
            // Dimensiones y peso reales
            alto: product.attributes?.alto || product.attributes?.height || null,
            ancho: product.attributes?.ancho || product.attributes?.width || null,
            largo: product.attributes?.largo || product.attributes?.length || null,
            peso: product.attributes?.peso || product.attributes?.weight || null,
            attributes: product.attributes || {}
          };
          return { items: [...state.items, newItem] };
        }),
      removeItem: key =>
        set(state => ({
          items: state.items.filter(item => item.key !== key)
        })),
      updateQuantity: (key, quantity) =>
        set(state => {
          const newQty = Math.max(1, Number(quantity) || 1);
          return {
            items: state.items
              .map(item => (item.key === key ? { ...item, quantity: newQty } : item))
              .filter(item => item.quantity > 0)
          };
        }),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const state = useCartStore.getState();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState && typeof persistedState === 'object' ? persistedState : { items: [] };
        const items = Array.isArray(state.items) ? state.items : [];

        const migratedItems = items.map((it) => {
          const rawPrice = Number(it?.price || 0);
          // Compatibilidad histórica: precios guardados como "80" en vez de "80000".
          const price = Number.isFinite(rawPrice) && rawPrice > 0 && rawPrice < 1000 ? rawPrice * 1000 : rawPrice;

          let image = it?.image;
          // Si la imagen es un objeto persisted, intentar extraer cadena
          if (image && typeof image === 'object') {
            const vals = Object.values(image).filter(x => typeof x === 'string' && x.trim());
            if (vals.length > 0) image = vals[0].trim();
            else image = null;
          }
          if (typeof image === 'string') {
            // Reemplazar png por webp cuando corresponda
            if (image.startsWith('/images/') && /\.png$/i.test(image)) {
              image = image.replace(/\.png$/i, '.webp');
            }
            // Normalizar rutas relativas a URL estática
            image = getStaticUrl(image);
          }

          return { ...it, price, image };
        });

        return { ...state, items: migratedItems };
      }
    }
  )
);
