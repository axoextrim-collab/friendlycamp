import { useEffect } from 'react';

/**
 * Adds compositor-driven, continuous motion without replacing image sources.
 * Keeping the original high-resolution image avoids the low-frame-rate jumps
 * caused by globally forcing GIF files onto every image.
 */
export function useMotionImages() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)');
    const observed = new WeakSet<HTMLImageElement>();

    const enhance = (image: HTMLImageElement) => {
      if (observed.has(image) || image.dataset.motion === 'off') return;
      observed.add(image);
      image.loading = image.closest('#hero') ? 'eager' : 'lazy';
      image.decoding = 'async';
      let motionEnabled=false;try{motionEnabled=localStorage.getItem('fc-motion-enabled')==='true';}catch{/* Motion stays off when browser storage is unavailable. */}
      if (reducedMotion.matches || !motionEnabled) return;
      image.classList.add('nature-motion-image');
    };

    const scan = (root: ParentNode) => root.querySelectorAll<HTMLImageElement>('img').forEach(enhance);
    scan(document);
    const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (!(node instanceof Element)) return;
      if (node instanceof HTMLImageElement) enhance(node);
      scan(node);
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}
