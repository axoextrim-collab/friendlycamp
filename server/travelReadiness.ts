import { resolvedTravel } from './leaderCatalog';
import { controlRecords, publishedRecords } from './controlStore';
import { EMPTY_TRAVEL, POLICY_KEYS, POLICY_TITLES, type TravelSnapshot } from '../src/types/travel';
import type { DepartureConfig } from '../src/types/booking';
import { BookingError, bookingCapabilities } from './bookingProviders';
export async function publishedPolicies() { return (await publishedRecords('policies')).filter(item => item.effectiveAt && Date.parse(item.effectiveAt) <= Date.now()); }
export async function travelSnapshot(config: DepartureConfig): Promise<TravelSnapshot | undefined> {
    const tour = (await publishedRecords('tours')).find(item => item.id === config.tourId);
    if (!tour)
        return undefined;
    const details = await resolvedTravel(tour, config.startsAt);
    const policies = await publishedPolicies();
    const legal = policies.find(item => item.kind === 'legal');
    const contact = (await controlRecords('contact'))[0];
    return { ...details, leaderName: details.leaderName || (!details.leaderId ? String(tour.leader || '') : ''), tourRevision: tour.revision || String(tour.updatedAt || ''), returnAt: config.returnAt || '', returnPoint: config.returnPoint || '', cancellationDetails: config.cancellationDetails || '', policies: policies.map(item => ({ kind: item.kind, title: item.title, revision: item.revision || '', effectiveAt: item.effectiveAt, body: item.body })), seller: { name: legal?.organizationName || '', registrationNumber: legal?.registrationNumber || '', address: contact?.address || '', phone: contact?.phone || '', email: contact?.email || '' } };
}
export async function saleReadiness(config: DepartureConfig, snapshot?:TravelSnapshot) {
    snapshot ??= await travelSnapshot(config);
    const missing: string[] = [];
    const policies = await publishedPolicies();
    for (const key of POLICY_KEYS.filter(key => !['faq', 'support'].includes(key)))
        if (!policies.some(item => item.kind === key && item.approvedForSale))
            missing.push(POLICY_TITLES[key]);
    const legal = policies.find(item => item.kind === 'legal');
    if (!legal?.organizationName)
        missing.push('نام حقوقی برگزارکننده');
    const contact = (await controlRecords('contact'))[0];
    if (!contact?.address || !contact.phone)
        missing.push('نشانی کامل و تماس برگزارکننده');
    if (!(await publishedRecords('licenses')).some(item => !item.expiresAt || Date.parse(item.expiresAt) >= Date.parse(config.startsAt)))
        missing.push('مدرک و استعلام مجوز فعالیت');
    if (!snapshot)
        missing.push('جزئیات کامل تور');
    else {
        for (const [value, label] of [[snapshot.difficulty, 'درجه سختی'], [snapshot.fitnessRequirements, 'آمادگی جسمانی'], [snapshot.equipment.length, 'وسایل موردنیاز'], [snapshot.ageConditions, 'شرایط سنی'], [snapshot.medicalRestrictions, 'محدودیت‌های پزشکی'], [snapshot.leaderName, 'نام لیدر'], [snapshot.leaderQualifications, 'صلاحیت لیدر'], [snapshot.leaderIssuer && snapshot.leaderCredential && snapshot.leaderSource, 'مدرک صلاحیت لیدر'], [snapshot.faqs.length, 'پرسش‌های اختصاصی تور']] as const)
            if (!value)
                missing.push(label);
        const insurance = snapshot.insurance;
        if (!insurance.provider || !insurance.policyNumber || !insurance.coverage || !insurance.exclusions || !insurance.source || !insurance.validFrom || !insurance.validUntil)
            missing.push('مدارک و محدوده بیمه');
        else if (Date.parse(insurance.validFrom) > Date.parse(config.startsAt) || Date.parse(insurance.validUntil) < Date.parse(config.returnAt || config.startsAt))
            missing.push('اعتبار بیمه در زمان سفر');
    }
    if (!config.returnAt || Date.parse(config.returnAt) <= Date.parse(config.startsAt) || !config.returnPoint)
        missing.push('زمان و نقطه بازگشت');
    if (config.origins.some(origin => !origin.meetingPoint || !origin.departureTime))
        missing.push('نقطه و ساعت حرکت هر مبدأ');
    if (!config.cancellationDetails)
        missing.push('شرح شرایط لغو و استرداد نوبت');
    const tour = (await publishedRecords('tours')).find(item => item.id === config.tourId);
    if (!tour?.included || !tour.excluded)
        missing.push('خدمات شامل و غیرشامل');
    if (!tour?.itinerary?.length)
        missing.push('برنامه روزبه‌روز');
    return { ready: missing.length === 0, missing };
}
export async function requireSaleReady(config: DepartureConfig) {
    if (bookingCapabilities().paymentMode !== 'http')
        return;
    const result = await saleReadiness(config);
    if (!result.ready)
        throw new BookingError('SALE_INFORMATION_INCOMPLETE', 'فروش واقعی این سفر تا تکمیل اطلاعات و شرایط مصوب فعال نمی‌شود: ' + result.missing.join('، '), 409);
}
