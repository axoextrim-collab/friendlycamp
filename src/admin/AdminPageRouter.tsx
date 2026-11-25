import React from 'react';
import {ArrowDownToLine,ArrowUpLeft,CalendarDays,FileSpreadsheet,ShieldCheck} from 'lucide-react';
import type {AuthUser} from '../api/auth';
import type {DashboardSummary} from '../types/adminDashboard';
import {CONTROL_RESOURCES,type ControlResource} from '../types/control';
import {ADMIN_PAGES,adminNavigate,type AdminTab} from './adminNavigation';
import {Overview,Reports,FinancePanel,CustomersPanel,SystemPanel,RoleOverview,AttentionList,DataState,Empty,FinanceMetrics,PeriodPicker,useAdminData,date,fa} from './DashboardViews';
import {ResourcePanel,DesignPanel,AuditPanel,StaffPanel,MessagePanel} from './ManagementPanels';
import {RecordScreen} from './ResourceWorkspace';
import {SettingsWorkspace} from './SettingsWorkspace';
import {ThemeStudio} from './ThemeStudio';
import {BookingManagement} from './BookingManagement';
import {StoreManagement} from '../components/shop/StoreManagement';
import {SupportManager} from '../components/SupportCase';
import {NewsletterSubscribers} from './NewsletterSubscribers';

type Props={tab:AdminTab;view:string;intent:string;user:AuthUser;data:DashboardSummary|null;loading:boolean;error:string;refresh:()=>void;days:number;setDays:(n:number)=>void;key?:React.Key};
export function AdminPageRouter(props:Props){
 const {tab,view,intent,user,data,loading,error,refresh,days,setDays}=props;
 const page=ADMIN_PAGES[tab].find(p=>p.id===view);
 if(tab==='settings')return <SettingsWorkspace section={view}/>;
 if((CONTROL_RESOURCES as readonly string[]).includes(tab)){
   const resource=tab as ControlResource;
   if(view==='new'||view==='edit'||resource==='policies'&&view!=='list'||resource==='contact')return <RecordScreen resource={resource} user={user} view={view} intent={intent}/>;
   if(resource==='destinations'&&view==='weather'||resource==='leaders'&&view==='credentials')return <CredentialDirectory resource={resource} view={view}/>;
   return <ResourcePanel resource={resource} user={user} initialFilter={page?.filter||'all'}/>;
 }
 if(tab==='overview'&&view==='tasks')return <section className="ad-card"><h2>میز کار و پیگیری‌های مجموعه</h2><p className="ad-muted">هر مورد به بخش مسئول رسیدگی متصل است.</p><DataState loading={!data&&loading} error={error} retry={refresh}/>{data&&<AttentionList data={data}/>}</section>;
 if(tab==='overview')return <Overview data={data} user={user} loading={loading} error={error} refresh={refresh} days={days} setDays={setDays}/>;
 if(tab==='reports'&&view==='activity')return <Reports data={data} loading={loading} error={error} refresh={refresh} days={days} setDays={setDays}/>;
 if(tab==='reports'||tab==='finance'&&view==='export')return <FinancialExport data={data} loading={loading} error={error} refresh={refresh} days={days} setDays={setDays}/>;
 if(tab==='finance')return <FinancePanel intent={intent} initialState={page?.filter||'all'}/>;
 if(tab==='customers')return <CustomersPanel intent={intent} initialRole={new URLSearchParams(intent).has('q')?'all':page?.filter}/>;
 if(tab==='staff')return view==='permissions'?<RoleOverview/>:<StaffPanel current={user} pageView={view}/>;
 if(tab==='messages')return <MessagePanel initialStatus={page?.filter||'all'}/>;
 if(tab==='support')return <div className="ad-operation-panel"><SupportManager initialStatus={page?.filter||'all'}/></div>;
 if(tab==='reservations')return view==='refunds'&&user.role==='admin'?<FinancePanel intent={intent} initialState="refund_pending"/>:<div className="ad-operation-panel"><BookingManagement pageView={view}/></div>;
 if(tab==='store')return <div className="fs-app cp-store ad-store"><StoreManagement catalog={[]} onCatalogChanged={()=>undefined} pageView={view}/></div>;
 if(tab==='design')return view==='colors'?<ThemeStudio/>:<DesignPanel view={view}/>;
 if(tab==='newsletter'&&view==='export')return <section className="ad-card aw-export"><FileSpreadsheet size={38}/><h2>خروجی اعضای فعال خبرنامه</h2><p>فایل شامل ایمیل، زمان عضویت و اطلاعات رضایت اعضای فعال است.</p><a href="/api/admin/newsletter/export.csv" className="cp-primary" download><ArrowDownToLine size={18}/>دریافت فایل CSV</a></section>;
 if(tab==='newsletter')return <NewsletterSubscribers/>;
 if(tab==='system')return <><SystemPanel/>{view==='connections'&&<section className="ad-card aw-connection-links"><h2>تنظیم اتصال سرویس‌ها</h2><button type="button" className="cp-secondary" onClick={()=>adminNavigate('settings/payment')}>تنظیم درگاه پرداخت<ArrowUpLeft size={18}/></button><button type="button" className="cp-secondary" onClick={()=>adminNavigate('settings/sms')}>تنظیم سرویس پیامک<ArrowUpLeft size={18}/></button><p className="ad-muted">پایگاه داده و فضای فایل از تنظیمات محیط استقرار دریافت می‌شوند.</p></section>}</>;
 return <AuditPanel view={view}/>;
}
function FinancialExport({data,loading,error,refresh,days,setDays}:Pick<Props,'data'|'loading'|'error'|'refresh'|'days'|'setDays'>){return <div className="ad-dashboard"><section className="ad-card aw-report-header"><span className="aw-title-icon"><FileSpreadsheet size={26}/></span><div><h2>گزارش مالی مجموعه</h2><p className="ad-muted">بازه را انتخاب و جریان وجوه واقعی را بررسی کنید.</p></div><PeriodPicker days={days} onChange={setDays}/></section><DataState loading={!data&&loading} error={error} retry={refresh}/>{data&&<><FinanceMetrics totals={data.finance}/><section className="ad-card"><div className="ad-section-title"><h2>دریافت دفتر تراکنش‌ها</h2><a className="cp-primary" download href={`/api/manage/finance?days=${days}&format=csv`}><ArrowDownToLine size={18}/>خروجی CSV</a></div><p className="ad-muted">پرداخت آزمایشی در دریافتی واقعی منظور نمی‌شود. پرونده‌های بازِ نیازمند رسیدگی در دفتر تراکنش‌ها قابل مشاهده‌اند.</p><div className="cp-table-wrap"><table><thead><tr><th>روز</th><th>رزرو ایجادشده</th><th>دریافتی (تومان)</th><th>استرداد (تومان)</th></tr></thead><tbody>{data.daily.filter(d=>d.bookings||d.received||d.returned).map(d=><tr key={d.date}><td>{date(d.date+'T12:00:00+03:30')}</td><td>{fa(d.bookings)}</td><td>{fa(d.received)}</td><td>{fa(d.returned)}</td></tr>)}</tbody></table></div>{!data.daily.some(d=>d.bookings||d.received||d.returned)&&<Empty title="گردشی در این بازه ثبت نشده" description="پس از ثبت فعالیت، جدول روزانه و فایل تراکنش‌ها به‌روزرسانی می‌شوند."/>}</section></>}</div>;}
function CredentialDirectory({resource,view}:{resource:'destinations'|'leaders';view:string}){
 const {data,error,loading,refresh}=useAdminData<{records:any[]}>('/api/manage/records/'+resource);
 return <section className="ad-card"><div className="ad-section-title"><h2>{view==='weather'?'گزارش مستند مقصدها':'مدارک ثبت‌شده لیدرها'}</h2><button type="button" className="cp-secondary" onClick={refresh}>تازه‌سازی</button></div><DataState loading={loading} error={error} retry={refresh}/>{data&&<div className="cp-table-wrap"><table><thead><tr><th>{resource==='leaders'?'لیدر':'مقصد'}</th><th>{resource==='leaders'?'صلاحیت و مدارک':'وضعیت هوا'}</th><th>{resource==='leaders'?'مرجع و اعتبار':'زمان و منبع گزارش'}</th><th>پرونده</th></tr></thead><tbody>{data.records.map(r=><tr key={r.id}><td><strong>{r.name||r.title}</strong><small>{r.city||r.bio}</small></td><td>{resource==='leaders'?<>{r.qualifications||'صلاحیت ثبت نشده'}<small>{fa((r.credentials||[]).length)} مدرک ثبت‌شده</small></>:<>{r.weatherEnabled&&r.temperature!==null?`${fa(Number(r.temperature))} درجه`:'گزارش فعال نیست'}<small>{r.condition||'شرایط ثبت نشده'}</small></>}</td><td>{resource==='leaders'?(r.credentials||[]).map((c:any,i:number)=><div key={i}>{c.issuer||'مرجع ثبت نشده'}<small>{c.noExpiry?'بدون تاریخ انقضای ثبت‌شده':c.validUntil?date(c.validUntil):'اعتبار ثبت نشده'}</small></div>):<>{r.observedAt?date(r.observedAt,true):'زمان مشاهده ثبت نشده'}<small>{r.weatherSource||'منبع ثبت نشده'}</small></>}</td><td><button type="button" className="cp-secondary" onClick={()=>adminNavigate(`${resource}/edit?id=${encodeURIComponent(r.id)}`)}>تکمیل پرونده</button></td></tr>)}</tbody></table>{!data.records.length&&<Empty title="پرونده‌ای ثبت نشده است" description="ابتدا از زیرمنوی ایجاد، اطلاعات اولیه را ثبت کنید."/>}</div>}</section>;
}
