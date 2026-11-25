import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type FocusEvent, type DragEvent } from 'react';

export function useDestinationCarousel(itemCount: number, expanded: boolean, filter: string) {
  const track = useRef<HTMLDivElement>(null);
  const cycleWidth = useRef(0);
  const interactionUntil = useRef(0);
  const focused = useRef(false);
  const drag = useRef<{ pointerId: number; startX: number; startScroll: number; moved: boolean } | null>(null);
  const suppressClickUntil = useRef(0);
  const manualFrame = useRef(0);
  const [looping, setLooping] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pointerHeld, setPointerHeld] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)').matches);

  const normalize = () => {
    const element = track.current;
    const cycle = cycleWidth.current;
    if (!element || !looping || expanded || focused.current || !cycle) return;
    const previous = element.scrollLeft;
    let next = previous;
    if (previous >= -0.5) next = previous - cycle;
    else if (previous < -cycle - 1) next = previous + cycle;
    if (next !== previous) {
      element.scrollLeft = next;
      if (drag.current) drag.current.startScroll += element.scrollLeft - previous;
    }
  };

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      cancelAnimationFrame(manualFrame.current);
      const card = element.querySelector<HTMLElement>('.iran-destination-card');
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
      const cycle = card ? (card.getBoundingClientRect().width + gap) * itemCount : 0;
      const canLoop = !expanded && cycle - gap > element.clientWidth + 2;
      cycleWidth.current = cycle;
      setLooping(canLoop);
      element.scrollLeft = canLoop && looping ? -cycle : 0;
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    const intersection = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), { threshold: 0.05 });
    intersection.observe(element);
    return () => { resize.disconnect(); intersection.disconnect(); cancelAnimationFrame(manualFrame.current); };
  }, [itemCount, expanded, filter, looping]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element || !looping || expanded) return;
    const wheel = (event: WheelEvent) => {
      interactionUntil.current = performance.now() + 2500;
      cancelAnimationFrame(manualFrame.current);
      if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 20 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? element.clientWidth : 1;
      element.scrollLeft += (event.deltaX || event.deltaY) * unit;
      normalize();
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [looping, expanded]);

  useEffect(() => {
    if (!looping || expanded || !visible || paused || reducedMotion || hovered || hasFocus || pointerHeld) return;
    let frame = 0;
    let previous = 0;
    let position = track.current?.scrollLeft || 0;
    const tick = (now: number) => {
      const element = track.current;
      if (!element) return;
      const elapsed = previous ? Math.min(now - previous, 50) : 0;
      previous = now;
      const modalOpen = document.querySelector('dialog[open], [aria-modal="true"]');
      if (document.hidden || now < interactionUntil.current || modalOpen) {
        position = element.scrollLeft;
      } else {
        // Increasing a negative RTL scroll offset moves the cards physically right to left.
        position += elapsed * 0.032;
        if (position >= -0.5) position -= cycleWidth.current;
        element.scrollLeft = position;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [looping, expanded, visible, paused, reducedMotion, hovered, hasFocus, pointerHeld]);

  const scroll = (direction: 'next' | 'previous') => {
    const element = track.current;
    if (!element || !looping || expanded) return;
    interactionUntil.current = performance.now() + 2500;
    normalize();
    const distance = cycleWidth.current / itemCount;
    const start = element.scrollLeft;
    const offset = (direction === 'next' ? 1 : -1) * distance;
    const started = performance.now();
    cancelAnimationFrame(manualFrame.current);
    const animate = (now: number) => {
      const progress = reducedMotion ? 1 : Math.min((now - started) / 480, 1);
      let position = start + offset * (1 - (1 - progress) ** 3);
      const cycle = cycleWidth.current;
      while (position >= 0) position -= cycle;
      while (position < -cycle) position += cycle;
      element.scrollLeft = position;
      if (progress < 1) manualFrame.current = requestAnimationFrame(animate);
    };
    manualFrame.current = requestAnimationFrame(animate);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (expanded || (event.pointerType === 'mouse' && event.button !== 0)) return;
    interactionUntil.current = performance.now() + 2500;
    cancelAnimationFrame(manualFrame.current);
    setPointerHeld(true);
    if (event.pointerType !== 'mouse' || !looping) return;
    event.preventDefault();
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startScroll: event.currentTarget.scrollLeft, moved: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const distance = event.clientX - active.startX;
    if (!active.moved && Math.abs(distance) < 6) return;
    if (!active.moved) { active.moved = true; event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }
    event.preventDefault();
    event.currentTarget.scrollLeft = active.startScroll - distance;
    normalize();
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    interactionUntil.current = performance.now() + 2500;
    const active = drag.current;
    if (active?.moved) suppressClickUntil.current = performance.now() + 150;
    drag.current = null;
    setDragging(false);
    setPointerHeld(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); }
  };

  return {
    track, looping, dragging, paused, reducedMotion, scroll,
    togglePaused: () => setPaused(value => !value),
    trackProps: {
      onScroll: normalize,
      onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onLostPointerCapture: onPointerUp,
      onPointerLeave: () => { setHovered(false); if (drag.current && !drag.current.moved) { drag.current = null; setPointerHeld(false); } },
      onPointerEnter: (event: PointerEvent<HTMLDivElement>) => { if (event.pointerType === 'mouse') setHovered(true); },
      onFocusCapture: () => { focused.current = true; setHasFocus(true); },
      onBlurCapture: (event: FocusEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { focused.current = false; setHasFocus(false); } },
      onClickCapture,
      onDragStart: (event: DragEvent<HTMLDivElement>) => event.preventDefault(),
    },
  };
}
