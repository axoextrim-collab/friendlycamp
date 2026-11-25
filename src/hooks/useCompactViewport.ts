import { useSyncExternalStore } from 'react';

const query = '(max-width: 767px)';
const snapshot = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
export const useCompactViewport = () => useSyncExternalStore(subscribe, snapshot, () => false);
