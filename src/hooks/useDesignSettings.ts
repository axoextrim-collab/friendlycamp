import {useEffect,useSyncExternalStore} from 'react';
import type {DesignSettings} from '../admin/adminApi';
import {boundedFetch} from '../api/request';
import {normalizeSiteTheme,siteThemeCss} from '../utils/siteTheme';

let cached:DesignSettings|null=null,pending:Promise<DesignSettings>|null=null;
const listeners=new Set<()=>void>();let channel:BroadcastChannel|null=null,timer:ReturnType<typeof setInterval>|null=null;
const emit=()=>listeners.forEach(listener=>listener());
export function refreshDesignSettings(force=false){
 if(cached&&!force)return Promise.resolve(cached);
 if(!pending)pending=boundedFetch('/api/site/design-settings',{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('SETTINGS_UNAVAILABLE');const body=await response.json();if(!body.settings?.typography||!body.settings?.image)throw Error('INVALID_DESIGN_SETTINGS');cached=body.settings as DesignSettings;emit();return cached;}).finally(()=>{pending=null;});
 return pending;
}
const refreshVisible=()=>{if(document.visibilityState==='visible')void refreshDesignSettings(true).catch(()=>undefined);};
const eventSettings=(event:Event)=>{cached=(event as CustomEvent<DesignSettings>).detail;emit();};
function subscribe(listener:()=>void){listeners.add(listener);if(listeners.size===1){void refreshDesignSettings().catch(()=>undefined);window.addEventListener('focus',refreshVisible);document.addEventListener('visibilitychange',refreshVisible);window.addEventListener('fc-design-settings',eventSettings);timer=setInterval(refreshVisible,45000);if('BroadcastChannel'in window){channel=new BroadcastChannel('fc-site-design');channel.onmessage=refreshVisible;}}return()=>{listeners.delete(listener);if(!listeners.size){if(timer)clearInterval(timer);timer=null;channel?.close();channel=null;window.removeEventListener('focus',refreshVisible);document.removeEventListener('visibilitychange',refreshVisible);window.removeEventListener('fc-design-settings',eventSettings);}};}
export function announceThemePublication(){channel?.postMessage('refresh');if(!channel&&'BroadcastChannel'in window){const broadcast=new BroadcastChannel('fc-site-design');broadcast.postMessage('refresh');broadcast.close();}return refreshDesignSettings(true);}
export function useDesignSettings(){return useSyncExternalStore(subscribe,()=>cached,()=>null);}
export function useApplyDesignSettings(pathname=window.location.pathname){
 const settings=useDesignSettings();
 useEffect(()=>{if(!settings)return;const root=document.documentElement;
  root.style.setProperty('--fc-heading-font',`'${settings.typography.headingFont}', sans-serif`);root.style.setProperty('--fc-body-font',`'${settings.typography.bodyFont}', sans-serif`);root.style.setProperty('--fc-base-size',`${settings.typography.baseSize}px`);root.style.setProperty('--fc-heading-weight',String(settings.typography.headingWeight));root.style.setProperty('--fc-body-weight',String(settings.typography.bodyWeight));root.style.setProperty('--fc-line-height',String(settings.typography.lineHeight));root.style.setProperty('--fc-letter-spacing',`${settings.typography.letterSpacing}px`);root.style.setProperty('--fc-image-filter',`brightness(${settings.image.brightness}%) contrast(${settings.image.contrast}%) saturate(${settings.image.saturation}%)`);root.style.setProperty('--fc-image-radius',`${settings.image.borderRadius}px`);
  const enabled=pathname!=='/admin'&&!pathname.startsWith('/shop/manage')&&!window.location.hostname.toLowerCase().startsWith('admin.');
  if(!enabled){delete root.dataset.fcSiteTheme;delete root.dataset.fcThemeMode;return;}
  const appearance=normalizeSiteTheme(settings.appearance);let style=document.getElementById('fc-site-theme') as HTMLStyleElement|null;if(!style){style=document.createElement('style');style.id='fc-site-theme';document.head.appendChild(style);}style.textContent=siteThemeCss(appearance);root.dataset.fcSiteTheme='true';root.dataset.fcThemeMode=appearance.mode;
  return()=>{delete root.dataset.fcSiteTheme;delete root.dataset.fcThemeMode;};
 },[settings,pathname]);
 return settings;
}
