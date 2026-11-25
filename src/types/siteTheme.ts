export const THEME_COLOR_KEYS=['primary','accent','background','surface','text','muted','border'] as const;
export type ThemeColorKey=typeof THEME_COLOR_KEYS[number];
export type ThemeColors=Record<ThemeColorKey,string>;
export interface SiteTheme {mode:'light'|'dark'|'system';palette:string;light:ThemeColors;dark:ThemeColors}
export interface ThemeRecord {theme:SiteTheme;revision:string|null;updatedAt:string|null}
export const THEME_COLOR_LABELS:Record<ThemeColorKey,string>={primary:'رنگ اصلی برند',accent:'رنگ تأکیدی',background:'پس‌زمینه صفحه',surface:'زمینه کارت و فرم',text:'متن اصلی',muted:'متن توضیحات',border:'خطوط و حاشیه‌ها'};
export const SITE_PALETTES:Array<{id:string;name:string;description:string;light:ThemeColors;dark:ThemeColors}>=[
 {id:'forest',name:'جنگل هیرکانی',description:'سبز جنگلی و لیمویی آرام',light:{primary:'#245D45',accent:'#DCEBB3',background:'#F6F8F3',surface:'#FFFFFF',text:'#213D30',muted:'#5B705F',border:'#DCE5D5'},dark:{primary:'#7DBD99',accent:'#DCEBB3',background:'#101D17',surface:'#192A21',text:'#E8F0E5',muted:'#B1C5B4',border:'#3C5544'}},
 {id:'ocean',name:'ساحل مکران',description:'آبی عمیق و ماسه روشن',light:{primary:'#12627A',accent:'#F5D69B',background:'#F3F8FA',surface:'#FFFFFF',text:'#193F4D',muted:'#526C78',border:'#D7E5EC'},dark:{primary:'#79C4D9',accent:'#F5D69B',background:'#0E1B24',surface:'#182B36',text:'#E2F0F7',muted:'#A6C2D0',border:'#375463'}},
 {id:'desert',name:'کویر لوت',description:'سفالی گرم و شن کویری',light:{primary:'#8C4B32',accent:'#EBCB8B',background:'#FAF6F0',surface:'#FFFFFF',text:'#493328',muted:'#7B6455',border:'#EADDD0'},dark:{primary:'#D69A78',accent:'#EBCB8B',background:'#211914',surface:'#30241D',text:'#F2E8DB',muted:'#CBB49E',border:'#624C3C'}},
 {id:'lavender',name:'غروب زاگرس',description:'بنفش کوهستانی و یاسی',light:{primary:'#69508A',accent:'#DFD0F0',background:'#F8F6FB',surface:'#FFFFFF',text:'#392C4A',muted:'#71617F',border:'#E5DDEE'},dark:{primary:'#BCA0E0',accent:'#DFD0F0',background:'#1B1624',surface:'#292133',text:'#EFE6F7',muted:'#C3B2D2',border:'#544163'}},
 {id:'pomegranate',name:'انار و باغ ایرانی',description:'زرشکی و طلایی ملایم',light:{primary:'#943D52',accent:'#F0D39B',background:'#FBF6F5',surface:'#FFFFFF',text:'#4C2D35',muted:'#7E6068',border:'#EAD9DE'},dark:{primary:'#DE94A7',accent:'#F0D39B',background:'#24161C',surface:'#33222B',text:'#F6E7ED',muted:'#D4B0BE',border:'#634451'}},
 {id:'minimal',name:'مینیمال سنگی',description:'خاکستری متعادل و سبز زیتونی',light:{primary:'#485B48',accent:'#D8DDBA',background:'#F7F7F5',surface:'#FFFFFF',text:'#30372F',muted:'#656E61',border:'#DEE1D9'},dark:{primary:'#A6B69A',accent:'#D8DDBA',background:'#191C18',surface:'#252A22',text:'#EDF0E8',muted:'#BEC7B5',border:'#4B5543'}},
];
export const DEFAULT_SITE_THEME:SiteTheme={mode:'light',palette:'forest',light:{...SITE_PALETTES[0].light},dark:{...SITE_PALETTES[0].dark}};
