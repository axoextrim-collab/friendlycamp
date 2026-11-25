# استقرار رایگان روی سرویس فعلی Render و Supabase

مقصد همان سرویس موجود `srv-dajppljm8hqs7398q9v0` در پروژه `prj-dajpplfqj5pc73ek76j0` و مخزن `axoextrim-collab/friendlycamp` است. این کار به ایجاد سرویس تازه یا خرید دیسک نیاز ندارد. مشخصات مقصد در `deployment/render-target.json` ثبت شده‌اند.

معماری: سایت و API روی **Render Free**، تمام داده‌های ماندگار روی **Supabase PostgreSQL** و فایل‌ها در **Supabase Storage**. کاربران، پروفایل‌ها، خبرنامه، تنظیمات و سفارش‌ها در جدول خصوصی `friendlycamp.documents` نگهداری می‌شوند؛ تورها، رزروها، پرداخت‌ها، نقش‌ها، نظرها، پرونده‌های پشتیبانی، علاقه‌مندی‌ها و تاریخچه در جدول‌های همان schema هستند. رمزهای قبلی همچنان با scrypt خود برنامه بررسی می‌شوند؛ Supabase Auth جایگزین حساب‌های فعلی نشده است.

نسخه Docker محلی با `DATABASE_BACKEND=sqlite` به کار خود ادامه می‌دهد. مسیر رایگان ابری با `REQUIRE_EXTERNAL_DATABASE=true` اگر PostgreSQL تنظیم نباشد شروع نمی‌شود؛ اطلاعات کاربران روی فایل‌سیستم موقت Render نوشته نمی‌شوند.

## محدودیت‌های رایگان

رایگان‌بودن در محدوده سهمیه هر حساب است. Render Free پس از ۱۵ دقیقه بی‌درخواستی می‌خوابد و اولین درخواست بعدی می‌تواند حدود یک دقیقه منتظر بماند. Supabase Free در حال حاضر ۵۰۰ مگابایت پایگاه داده و ۱ گیگابایت فایل دارد و پروژه کم‌فعالیت می‌تواند پس از یک هفته متوقف شود. این پلن‌ها تضمین سرویس همیشه‌فعال نیستند؛ برای جلوگیری از خواب، ترافیک مصنوعی تولید نمی‌کنیم.

منابع: [Render Free](https://render.com/docs/free)، [Supabase Pricing](https://supabase.com/pricing)، [توقف پروژه رایگان Supabase](https://supabase.com/docs/guides/platform/free-project-pausing).

## بررسی سرویس قبلی پیش از تغییر

1. به همان سرویس مشخص‌شده وارد شوید و پلن، runtime، region، branch، فرمان build/start، دامنه، دیسک احتمالی و نام متغیرهای محیطی را بررسی کنید. مقدار secretها را در خروجی عمومی نمایش ندهید.
2. runtime و region موجود را حفظ کنید. `render.yaml` یک مرجع تنظیمات رایگان است؛ پیش از اعمال به سرویس موجود، نام و runtime آن باید با اطلاعات واقعی داشبورد تطبیق داده شوند. تنظیم کورکورانه Blueprint می‌تواند پیش‌فرض‌های سرویس را تغییر دهد.
3. اگر سرویس قبلی داده‌ای دارد، پیش از deploy یا حذف هر دیسک از آن backup سازگار بگیرید. داده قبلی را با داده لوکال بدون بررسی ادغام نکنید؛ یکی باید منبع انتقال مورد توافق باشد. ابزار انتقال مقصد غیرخالی را بازنویسی نمی‌کند.
4. کلید `SESSION_SECRET` فعلی را حفظ کنید؛ تغییر آن می‌تواند نشست‌ها و لینک‌های خصوصی رزروهای قبلی را نامعتبر کند.

## اتصال پایگاه داده Supabase

در پروژه Supabase خود از بخش Connect، رشته اتصال **Session pooler روی پورت ۵۴۳۲** را برای سرور ماندگار انتخاب کنید. این مسیر IPv4 را پشتیبانی می‌کند. مقدار را فقط در محیط امن سرور قرار دهید:

```dotenv
DATABASE_BACKEND=postgres
DATABASE_URL=postgresql://USER:PASSWORD@SESSION_POOLER_HOST:5432/postgres
REQUIRE_EXTERNAL_DATABASE=true
REQUIRE_PERSISTENT_DISK=false
```

این نمونه secret واقعی نیست. اگر پسورد نویسه ویژه دارد، از رشته آماده داشبورد استفاده کنید یا بخش پسورد را URL-encode کنید. برای اتصال ابری TLS با بررسی گواهی فعال است؛ در صورت نیاز، گواهی CA پروژه در `DATABASE_SSL_CA` قرار می‌گیرد. پارامترهای URL نمی‌توانند بررسی گواهی را خاموش کنند. اتصال plaintext فقط برای PostgreSQL آزمایشی روی loopback محلی پذیرفته می‌شود.

سرور schema خصوصی `friendlycamp` و جدول‌های لازم را قبل از استفاده ایجاد می‌کند؛ schema در Data API عمومی منتشر نمی‌شود و دسترسی PUBLIC آن حذف می‌شود. حساب دیتابیس فقط سمت سرور استفاده می‌شود. تراکنش‌ها از یک اتصال و قفل مشترک پایگاه داده استفاده می‌کنند تا رزرو، کد تخفیف، سفارش و تغییر حساب میان پردازش‌ها اتمیک بماند. این طراحی برای مقیاس فعلی و پلن رایگان، هم‌زمانی تغییرات را محدود می‌کند.

منبع: [اتصال PostgreSQL و Session pooler](https://supabase.com/docs/guides/database/connecting-to-postgres).

## انتقال داده‌های فعلی به پایگاه خالی

قبل از اولین اجرای نسخه جدید، و پیش از ایجاد حساب تازه در مقصد، تمام نویسنده‌های منبع انتقال را متوقف کنید. برای منبع Docker لوکال:

```powershell
docker compose stop app
node scripts/export-render-data.mjs --offline
docker compose start app
```

خروجی زیر `.deployment/data-*` یک backup سازگار SQLite و چهار فایل JSON فعال را با checksum نگه می‌دارد. خروجی خصوصی است و حاوی هش رمزها، اطلاعات حساب و رزرو است؛ آن را در Git یا bucket عمومی قرار ندهید. نسخه اصلی حذف نمی‌شود.

پس از تنظیم امن `DATABASE_URL` و `DATABASE_BACKEND=postgres` در محیط اجرای ابزار، ابتدا پیش‌نمایش:

```powershell
node --import tsx scripts/migrate-postgres.ts .deployment/data-XXXXXX
```

سپس انتقال واقعی:

```powershell
node --import tsx scripts/migrate-postgres.ts .deployment/data-XXXXXX --execute
```

ابزار checksum و سلامت SQLite را بررسی می‌کند، تمام داده‌ها را در یک تراکنش منتقل می‌کند و شناسه‌ها، هش رمزها، قیمت‌ها، تاریخچه، مالکیت حساب و رسیدها را حفظ می‌کند. مقصد دارای داده یا schema ناسازگار رد می‌شود. شماره‌گذارهای تاریخچه پس از انتقال تنظیم می‌شوند. تکرار همان بسته با علامت `already_imported` تمام می‌شود و داده جدید مقصد را بازنویسی نمی‌کند. تغییر فایل یا مانیفست باعث توقف می‌شود.

اگر استقرار قبلی روی Render منبع اصلی داده است، ابتدا از همان نسخه backup بگیرید؛ راهبرد انتقال باید با runtime و امکانات دسترسی واقعی همان سرویس تطبیق داده شود. هیچ پایگاه موجودی خودکار پاک یا ادغام نمی‌شود.

## فضای فایل Supabase

migration `supabase/migrations/202611250001_private_upload_bucket.sql` فقط bucket اختصاصی `friendlycamp-uploads` را به صورت خصوصی ایجاد می‌کند؛ bucket عمومی هم‌نام را تغییر نمی‌دهد و policy دسترسی ناشناس اضافه نمی‌کند.

```dotenv
UPLOAD_STORAGE=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=SERVER_SECRET
SUPABASE_STORAGE_BUCKET=friendlycamp-uploads
```

کلید قدیمی `SUPABASE_SERVICE_ROLE_KEY` هم به جای secret جدید پشتیبانی می‌شود. هیچ کلید سروری نباید `VITE_*` باشد یا در مرورگر، Git یا گفتگو قرار بگیرد. کلید publishable/anon برای این عملیات کافی نیست.

انتقال فایل‌های قبلی بدون تغییر لینک‌ها:

```powershell
node --import tsx scripts/migrate-supabase-uploads.ts
node --import tsx scripts/migrate-supabase-uploads.ts --execute
```

اسکریپت نام فایل و checksum را حفظ می‌کند و فایل متفاوت هم‌نام را بازنویسی نمی‌کند. فایل‌های اصلی باقی می‌مانند. سرور همچنان `/uploads/<random-name>` را ارائه می‌کند؛ bucket خصوصی است، اما هرکس لینک فایل در سایت را داشته باشد می‌تواند آن را دریافت کند. این مسیر برای مدارک هویتی یا پزشکی محرمانه نیست. فایل‌های صوتی Range و فایل‌های حداکثر ۱۲ مگابایت پشتیبانی می‌شوند.

## انتشار روی همان سرویس

- اطلاعات کلیدی شامل `NODE_ENV=production`، متغیرهای پایگاه و Storage، `SESSION_SECRET` قبلی، `REQUIRE_EXTERNAL_DATABASE=true` و `REQUIRE_PERSISTENT_DISK=false` را روی همان سرویس تنظیم کنید. `BOOKING_PAYMENT_MODE=disabled` باقی می‌ماند تا تنظیمات واقعی پرداخت جداگانه تکمیل شوند.
- اگر runtime فعلی Docker است، Dockerfile موجود ساخته می‌شود؛ آخرین stage با PostgreSQL بدون mount دیسک کار می‌کند و Node را با کاربر غیرریشه اجرا می‌کند.
- اگر runtime فعلی Node است، `.node-version` نسخه سازگار را تعیین می‌کند؛ build برابر `npm ci && npm run build` و start برابر `npm start` است. برای این مسیر نیازی به تعویض سرویس یا runtime نیست.
- health check را `/api/ready` قرار دهید. این مسیر DB و فضای فایل خصوصی را بررسی می‌کند و در خطا ۵۰۳ می‌دهد. آدرس عمومی از `RENDER_EXTERNAL_URL` دریافت می‌شود؛ برای دامنه شخصی `PUBLIC_SITE_URL` را تنظیم کنید.
- کد باید در branch متصل به همین سرویس منتشر شود. نسخه به‌روز کد را بدون داده‌ها و secretها با `node scripts/prepare-deploy-source.mjs` می‌توان بسته‌بندی کرد. ابزار فایل‌های runtime را حتی اگر از قبل tracked باشند کنار می‌گذارد.
- پیش از فعال‌کردن deploy، انتقال داده را تمام و تنظیمات سرویس زنده را بازبینی کنید. سرویس جدید ایجاد نکنید، دیسک موجود را قبل از backup حذف نکنید و secret فعلی را بدون بررسی تغییر ندهید.

پس از انتشار، ورود با حساب قبلی، رزرو و رسید، دریافت فایل قبلی، آپلود جدید و حفظ اطلاعات بعد از restart بررسی شوند. آماده‌بودن کد یا موفقیت آزمون محلی به معنی انتشار واقعی نیست؛ URL و health check سرویس مقصد باید تأیید شوند.
