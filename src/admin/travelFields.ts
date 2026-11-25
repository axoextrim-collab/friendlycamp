import type { ControlField } from './controlFields';
export const TRAVEL_FIELD:ControlField={key:'travel',label:'شرایط شرکت، لیدر و بیمه',type:'group',fields:[
 {key:'difficulty',label:'درجه سختی',type:'select',optional:true,options:[['','ثبت نشده'],['easy','آسان'],['moderate','متوسط'],['hard','دشوار'],['very_hard','بسیار دشوار']]},
 {key:'fitnessRequirements',label:'آمادگی جسمانی و میزان پیمایش',type:'textarea',optional:true},
 {key:'equipment',label:'وسایل موردنیاز؛ هر مورد در یک خط',type:'lines',optional:true},
 {key:'minAge',label:'حداقل سن (سال)',type:'number',min:0,max:120,optional:true},{key:'maxAge',label:'حداکثر سن (سال)',type:'number',min:0,max:120,optional:true},
 {key:'ageConditions',label:'شرایط سنی، همراهی والدین و استثناها',type:'textarea',optional:true},
 {key:'medicalRestrictions',label:'محدودیت‌ها و هماهنگی پزشکی پیش از سفر',type:'textarea',optional:true,hint:'شرایط خود برنامه را بنویس؛ اطلاعات پزشکی اشخاص در صفحه عمومی درج نشود.'},
 {key:'leaderId',label:'پروفایل لیدر منتشرشده',type:'select',optional:true,options:[['','ثبت مشخصات به صورت دستی']],hint:'در صورت انتخاب، نام و مدرک از پروفایل و اعتبار آن در روز حرکت دریافت می‌شود.'},{key:'leaderName',label:'نام لیدر',optional:true},{key:'leaderQualifications',label:'صلاحیت و تجربه مرتبط لیدر',type:'textarea',optional:true},
 {key:'leaderIssuer',label:'مرجع صادرکننده مدرک لیدر',optional:true},{key:'leaderCredential',label:'شماره مدرک قابل انتشار لیدر',optional:true},{key:'leaderSource',label:'لینک استعلام مدرک لیدر',optional:true},
 {key:'insurance',label:'بیمه همین سفر',type:'group',fields:[{key:'provider',label:'بیمه‌گر',optional:true},{key:'policyNumber',label:'شماره بیمه‌نامه',optional:true},{key:'coverage',label:'محدوده پوشش و سقف تعهدات',type:'textarea',optional:true},{key:'exclusions',label:'استثناها و موارد خارج از پوشش',type:'textarea',optional:true},{key:'validFrom',label:'آغاز اعتبار بیمه',type:'datetime',optional:true},{key:'validUntil',label:'پایان اعتبار بیمه',type:'datetime',optional:true},{key:'source',label:'نشانی مدرک یا استعلام بیمه',optional:true}]},
 {key:'faqs',label:'پرسش‌های متداول اختصاصی تور',type:'repeat',fields:[{key:'question',label:'پرسش'},{key:'answer',label:'پاسخ',type:'textarea'}]},
]};
