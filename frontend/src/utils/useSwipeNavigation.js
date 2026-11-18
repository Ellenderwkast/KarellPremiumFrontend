import { useEffect, useRef } from 'react';

const SWIPE_THRESHOLD = 40;
const SWIPE_DIRECTION_RATIO = 1.2;

export function useSwipeNavigation({ enabled, onPrevious, onNext }) {
  const pointerStart = useRef(null);
  const suppressClick = useRef(false);
  const suppressClickTimer = useRef(null);

  useEffect(() => () => {
    window.clearTimeout(suppressClickTimer.current);
  }, []);

  const onPointerDown = event => {
    window.clearTimeout(suppressClickTimer.current);
    suppressClick.current = false;

    if (!enabled || (event.pointerType === 'mouse' && event.button !== 0)) {
      pointerStart.current = null;
      return;
    }

    if (event.target.closest('button, [role="button"]')) {
      pointerStart.current = null;
      return;
    }

    pointerStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
  };

  const onPointerUp = event => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD ||
      Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_DIRECTION_RATIO
    ) return;

    suppressClick.current = true;
    suppressClickTimer.current = window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);

    if (deltaX < 0) onNext();
    else onPrevious();
  };

  const onPointerCancel = () => {
    pointerStart.current = null;
  };

  const onClickCapture = event => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
    window.clearTimeout(suppressClickTimer.current);
  };

  return { onPointerDown, onPointerUp, onPointerCancel, onClickCapture };
}
