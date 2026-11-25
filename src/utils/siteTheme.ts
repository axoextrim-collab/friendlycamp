import {DEFAULT_SITE_THEME,THEME_COLOR_KEYS,type SiteTheme,type ThemeColors} from '../types/siteTheme';
export const validThemeHex=(color:unknown):color is string=>typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color);
function rgb(hex:string){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function luminance(color:string){return rgb(color).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);}
export function contrastRatio(a:string,b:string){const l1=luminance(a),l2=luminance(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}
export function mixColor(a:string,b:string,ratio:number){const one=rgb(a),two=rgb(b);return '#'+one.map((n,i)=>Math.round(n*(1-ratio)+two[i]*ratio).toString(16).padStart(2,'0')).join('').toUpperCase();}
export function readableText(background:string){return contrastRatio('#FFFFFF',background)>=contrastRatio('#14201A',background)?'#FFFFFF':'#14201A';}
function readableColor(color:string,background:string){if(contrastRatio(color,background)>=4.5)return color;const target=readableText(background);for(let i=1;i<=20;i++){const candidate=mixColor(color,target,i/20);if(contrastRatio(candidate,background)>=4.5)return candidate;}return target;}
export function themeContrastIssues(theme:SiteTheme){
 const issues:Array<{mode:'light'|'dark';key:'text'|'muted';background:'surface'|'background';ratio:number}>=[];
 for(const mode of ['light','dark'] as const)for(const key of ['text','muted'] as const)for(const background of ['surface','background'] as const){const ratio=contrastRatio(theme[mode][key],theme[mode][background]);if(ratio<4.5)issues.push({mode,key,background,ratio});}
 return issues;
}
export function validSiteTheme(value:unknown):value is SiteTheme{if(!value||typeof value!=='object')return false;const t=value as SiteTheme;return ['light','dark','system'].includes(t.mode)&&typeof t.palette==='string'&&/^[a-z-]{1,40}$/.test(t.palette)&&['light','dark'].every(mode=>THEME_COLOR_KEYS.every(key=>validThemeHex(t[mode as 'light'|'dark']?.[key])));}
export function normalizeSiteTheme(value:unknown):SiteTheme{return validSiteTheme(value)?structuredClone(value):structuredClone(DEFAULT_SITE_THEME);}
export function themeVariables(colors:ThemeColors):Record<string,string>{
 const deep=readableColor(colors.primary,'#FFFFFF'),deeper=mixColor(deep,'#071B17',.45),onPrimary='#FFFFFF',onAccent=readableText(colors.accent);
 return {'--site-primary':colors.primary,'--site-primary-strong':deep,'--site-primary-deep':deeper,'--site-primary-soft':mixColor(colors.surface,colors.primary,.1),'--site-primary-ink':readableColor(colors.primary,colors.surface),'--site-accent':colors.accent,'--site-accent-ink':readableColor(colors.accent,colors.surface),'--site-on-accent':onAccent,'--site-on-primary':onPrimary,'--site-on-dark-muted':mixColor('#FFFFFF',deeper,.23),'--site-background':colors.background,'--site-surface':colors.surface,'--site-surface-soft':mixColor(colors.surface,colors.background,.65),'--site-text':colors.text,'--site-muted':colors.muted,'--site-border':colors.border};
}
const declaration=(colors:ThemeColors,scheme:string)=>Object.entries(themeVariables(colors)).map(([key,value])=>`${key}:${value}`).join(';')+`;color-scheme:${scheme}`;
export function siteThemeCss(theme:SiteTheme){return `html[data-fc-site-theme]{${declaration(theme.light,'light')}}html[data-fc-site-theme][data-fc-theme-mode="dark"]{${declaration(theme.dark,'dark')}}@media(prefers-color-scheme:dark){html[data-fc-site-theme][data-fc-theme-mode="system"]{${declaration(theme.dark,'dark')}}}`;}
