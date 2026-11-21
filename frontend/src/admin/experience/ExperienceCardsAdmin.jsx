import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import OptimizedImage from '../../components/OptimizedImage';
import { experienceCardService, getStaticUrl, productService } from '../../services/api';
import './experienceCardsAdmin.css';

const EMPTY_CARD = {
  title: '',
  description: '',
  imageUrl: '',
  imageAlt: '',
  imagePosition: 'center',
  isActive: true,
  position: 0
};

const getExperienceImageUrl = imageUrl => {
  if (!imageUrl) return '';
  if (/^\/?descubre\//i.test(imageUrl)) return `/${imageUrl.replace(/^\/+/, '')}`;
  return getStaticUrl(imageUrl);
};

function ExperienceCardsAdmin() {
  const [cards, setCards] = useState([]);
  const [draft, setDraft] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await experienceCardService.getAllAdmin();
      if (!Array.isArray(response.data)) {
        throw new Error('El servidor devolvió una lista de tarjetas con formato inválido');
      }
      setCards(response.data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || loadError.message || 'No se pudieron cargar las tarjetas');
    } finally {
      setLoading(false);
    }
  }, []);

  const closeEditor = useCallback(() => {
    if (busy || uploading) return;
    setDraft(null);
    setModalOpen(false);
  }, [busy, uploading]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !busy && !uploading) closeEditor();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen, busy, uploading, closeEditor]);

  const openNew = () => {
    setError('');
    setNotice('');
    setDraft({ ...EMPTY_CARD, position: cards.length });
    setModalOpen(true);
  };

  const openEdit = card => {
    setError('');
    setNotice('');
    setDraft({ ...card });
    setModalOpen(true);
  };

  const saveCard = async event => {
    event.preventDefault();
    if (!draft || busy || uploading) return;
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim(),
      imageAlt: draft.imageAlt.trim(),
      imagePosition: draft.imagePosition,
      isActive: Boolean(draft.isActive),
      position: draft.id ? Number(draft.position) : undefined
    };

    try {
      const response = draft.id
        ? await experienceCardService.update(draft.id, payload)
        : await experienceCardService.create(payload);
      const savedCard = response.data;
      setCards(previous => {
        const exists = previous.some(card => card.id === savedCard.id);
        const next = exists
          ? previous.map(card => card.id === savedCard.id ? savedCard : card)
          : [...previous, savedCard];
        return next.sort((left, right) => left.position - right.position || left.id - right.id);
      });
      setNotice(draft.id ? 'Tarjeta actualizada correctamente.' : 'Tarjeta creada correctamente.');
      setDraft(null);
      setModalOpen(false);
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'No se pudo guardar la tarjeta');
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !draft) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await productService.uploadImage(formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = response.data?.url;
      if (!imageUrl) throw new Error('El servidor no devolvió la dirección de la imagen');
      setDraft(previous => ({
        ...previous,
        imageUrl,
        imageAlt: previous.imageAlt || file.name.replace(/\.[^.]+$/, '')
      }));
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || uploadError.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const deleteCard = async card => {
    if (!window.confirm(`¿Eliminar la tarjeta "${card.title}" de Vive la experiencia?`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await experienceCardService.delete(card.id);
      setCards(previous => previous.filter(item => item.id !== card.id));
      setNotice('Tarjeta eliminada.');
      if (draft?.id === card.id) {
        setDraft(null);
        setModalOpen(false);
      }
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'No se pudo eliminar la tarjeta');
    } finally {
      setBusy(false);
    }
  };

  const moveCard = async (cardId, direction) => {
    const currentIndex = cards.findIndex(card => card.id === cardId);
    const targetIndex = currentIndex + direction;
    if (busy || currentIndex < 0 || targetIndex < 0 || targetIndex >= cards.length) return;

    const previousCards = cards;
    const reordered = [...cards];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const positioned = reordered.map((card, position) => ({ ...card, position }));
    setCards(positioned);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await experienceCardService.reorder(positioned.map(card => card.id));
      if (!Array.isArray(response.data)) throw new Error('El servidor no confirmó el orden de las tarjetas');
      setCards(response.data);
      setNotice('Orden actualizado.');
    } catch (reorderError) {
      setCards(previousCards);
      setError(reorderError.response?.data?.message || reorderError.message || 'No se pudo guardar el nuevo orden');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="experience-admin">
      <header className="experience-admin-header">
        <div>
          <span className="experience-admin-kicker">Contenido de la página de inicio</span>
          <h1>Vive la experiencia</h1>
          <p>Administra las tarjetas, sus imágenes y el orden en que aparecen en la página.</p>
        </div>
        <button type="button" className="experience-admin-primary" onClick={openNew}>
          <Plus size={17} aria-hidden="true" /> Nueva tarjeta
        </button>
      </header>

      {error && <div className="experience-admin-alert experience-admin-alert--error" role="alert">{error}</div>}
      {notice && <div className="experience-admin-alert experience-admin-alert--success" role="status">{notice}</div>}

      <div className="experience-admin-list-heading">
        <div>
          <h2>Tarjetas de la sección</h2>
          <p>{cards.length} {cards.length === 1 ? 'tarjeta' : 'tarjetas'} · Usa las flechas para cambiar su posición</p>
        </div>
      </div>

      {loading ? (
        <div className="experience-admin-empty">Cargando tarjetas...</div>
      ) : cards.length ? (
        <ol className="experience-admin-list">
          {cards.map((card, index) => (
            <li className={`experience-admin-card${card.isActive ? '' : ' is-inactive'}`} key={card.id}>
              <span className="experience-admin-position" aria-label={`Posición ${index + 1}`}>{index + 1}</span>
              <div className="experience-admin-thumbnail">
                <img src={getExperienceImageUrl(card.imageUrl)} alt="" loading="lazy" />
              </div>
              <div className="experience-admin-card-copy">
                <div className="experience-admin-card-title">
                  <h3>{card.title}</h3>
                  <span className={`experience-admin-status${card.isActive ? ' is-active' : ''}`}>
                    {card.isActive ? 'Visible' : 'Oculta'}
                  </span>
                </div>
                <p>{card.description}</p>
              </div>
              <div className="experience-admin-card-actions">
                <div className="experience-admin-order-actions" aria-label={`Cambiar posición de ${card.title}`}>
                  <button
                    type="button"
                    aria-label={`Mover ${card.title} hacia arriba`}
                    onClick={() => moveCard(card.id, -1)}
                    disabled={busy || index === 0}
                  >
                    <ArrowUp size={17} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Mover ${card.title} hacia abajo`}
                    onClick={() => moveCard(card.id, 1)}
                    disabled={busy || index === cards.length - 1}
                  >
                    <ArrowDown size={17} aria-hidden="true" />
                  </button>
                </div>
                <button type="button" className="experience-admin-icon-button" onClick={() => openEdit(card)} aria-label={`Editar ${card.title}`}>
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button type="button" className="experience-admin-icon-button is-danger" onClick={() => deleteCard(card)} disabled={busy} aria-label={`Eliminar ${card.title}`}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="experience-admin-empty">
          Aún no hay tarjetas. Crea una para mostrar contenido en la página de inicio.
        </div>
      )}

      {modalOpen && draft && createPortal(
        <div
          className="experience-admin-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <section className="experience-admin-modal" role="dialog" aria-modal="true" aria-labelledby="experience-admin-modal-title">
            <header className="experience-admin-modal-header">
              <div>
                <span className="experience-admin-kicker">Vive la experiencia</span>
                <h2 id="experience-admin-modal-title">{draft.id ? 'Editar tarjeta' : 'Nueva tarjeta'}</h2>
                <p>La vista previa te ayuda a ajustar imagen y contenido antes de guardar.</p>
              </div>
              <button type="button" className="experience-admin-close" onClick={closeEditor} disabled={busy || uploading} aria-label="Cerrar formulario">
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form className="experience-admin-form" onSubmit={saveCard}>
              <div className="experience-admin-form-body">
                {error && <div className="experience-admin-alert experience-admin-alert--error" role="alert">{error}</div>}
                <label className="experience-admin-field">
                  <span>Título</span>
                  <input value={draft.title} maxLength={160} required onChange={event => setDraft(previous => ({ ...previous, title: event.target.value }))} />
                </label>
                <label className="experience-admin-field">
                  <span>Descripción</span>
                  <textarea rows={3} maxLength={500} required value={draft.description} onChange={event => setDraft(previous => ({ ...previous, description: event.target.value }))} />
                </label>
                <div className="experience-admin-image-fields">
                  <label className="experience-admin-field">
                    <span>Dirección de la imagen</span>
                    <input
                      type="text"
                      value={draft.imageUrl.startsWith('descubre/') ? `/${draft.imageUrl}` : draft.imageUrl}
                      placeholder="https://... o /uploads/..."
                      onChange={event => setDraft(previous => ({ ...previous, imageUrl: event.target.value.trim() }))}
                    />
                    <small>También puedes subir una imagen desde tu dispositivo.</small>
                  </label>
                  <label className="experience-admin-upload">
                    <Upload size={17} aria-hidden="true" />
                    {uploading ? 'Subiendo imagen...' : 'Subir imagen'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploading || busy} />
                  </label>
                </div>
                <div className="experience-admin-image-fields">
                  <label className="experience-admin-field">
                    <span>Texto alternativo</span>
                    <input maxLength={255} value={draft.imageAlt} onChange={event => setDraft(previous => ({ ...previous, imageAlt: event.target.value }))} />
                  </label>
                  <label className="experience-admin-field">
                    <span>Encuadre de la imagen</span>
                    <select value={draft.imagePosition} onChange={event => setDraft(previous => ({ ...previous, imagePosition: event.target.value }))}>
                      <option value="center">Centro</option>
                      <option value="50% 12%">Superior</option>
                      <option value="50% 25%">Centro superior</option>
                      <option value="50% 40%">Centro (40 %)</option>
                      <option value="50% 50%">Centro (50 %)</option>
                      <option value="50% 60%">Centro inferior</option>
                      <option value="50% 75%">Inferior</option>
                    </select>
                  </label>
                </div>
                {draft.imageUrl && (
                  <div className="experience-admin-preview">
                    <span>Vista previa</span>
                    <OptimizedImage
                      src={getExperienceImageUrl(draft.imageUrl)}
                      alt={draft.imageAlt || draft.title || 'Vista previa de la tarjeta'}
                      objectFit="cover"
                      objectPosition={draft.imagePosition}
                      forceObjectFit
                    />
                  </div>
                )}
                <label className="experience-admin-toggle">
                  <input type="checkbox" checked={Boolean(draft.isActive)} onChange={event => setDraft(previous => ({ ...previous, isActive: event.target.checked }))} />
                  <span>
                    <strong>Mostrar en la página de inicio</strong>
                    <small>Las tarjetas ocultas se conservan en el panel para reactivarlas después.</small>
                  </span>
                </label>
              </div>

              <footer className="experience-admin-modal-footer">
                {draft.id ? (
                  <button type="button" className="experience-admin-danger" onClick={() => deleteCard(draft)} disabled={busy || uploading}>
                    <Trash2 size={16} aria-hidden="true" /> Eliminar
                  </button>
                ) : <span />}
                <div>
                  <button type="button" className="experience-admin-secondary" onClick={closeEditor} disabled={busy || uploading}>Cancelar</button>
                  <button type="submit" className="experience-admin-primary" disabled={busy || uploading || !draft.imageUrl.trim()}>
                    <Save size={16} aria-hidden="true" /> {busy ? 'Guardando...' : 'Guardar tarjeta'}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>,
        document.body
      )}
    </section>
  );
}

export default ExperienceCardsAdmin;
