import React, { useSyncExternalStore } from 'react';

const LOCATION_EVENT = 'fc-location-change';
const subscribe = (listener: () => void) => { window.addEventListener('popstate', listener); window.addEventListener('hashchange', listener); window.addEventListener(LOCATION_EVENT, listener); return () => { window.removeEventListener('popstate', listener); window.removeEventListener('hashchange', listener); window.removeEventListener(LOCATION_EVENT, listener); }; };
const snapshot = () => window.location.pathname + window.location.search + window.location.hash;
export function useSiteLocation() { const location = useSyncExternalStore(subscribe, snapshot, () => '/'); const url = new URL(location, window.location.origin); return { pathname: url.pathname, search: url.search, hash: url.hash, href: location }; }
export function navigateTo(href: string, options: { replace?: boolean; scroll?: boolean } = {}) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) { window.location.assign(url.href); return; }
  const next = url.pathname + url.search + url.hash;
  if (next !== snapshot()) window.history[options.replace ? 'replaceState' : 'pushState']({ page: url.pathname }, '', next);
  window.dispatchEvent(new Event(LOCATION_EVENT));
  if (options.scroll !== false) {
    if (url.hash) requestAnimationFrame(() => { try { document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' }); } catch { /* Ignore malformed fragments. */ } });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
export function SiteLink({ href, onClick, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; key?: React.Key }) {
  return <a href={href} {...props} onClick={event => { onClick?.(event); if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || props.target === '_blank' || props.download !== undefined) return; const url = new URL(href, window.location.origin); if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return; event.preventDefault(); navigateTo(href); }}>{children}</a>;
}
