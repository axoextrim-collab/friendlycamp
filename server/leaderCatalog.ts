import { publishedRecords } from './controlStore';
import { EMPTY_TRAVEL, type TravelDetails } from '../src/types/travel';
import type { LeaderProfile } from '../src/types/discovery';
export async function publicLeaders(): Promise<LeaderProfile[]> { return (await publishedRecords('leaders')).map(item => ({ id: item.id, name: item.name, bio: item.bio, qualifications: item.qualifications, image: item.image, languages: item.languages, credentials: item.credentials, updatedAt: item.updatedAt })); }
export async function resolvedTravel(record: Record<string, any>, startsAt?: string): Promise<TravelDetails> {
    const original = { ...EMPTY_TRAVEL, ...record.travel, insurance: { ...EMPTY_TRAVEL.insurance, ...record.travel?.insurance } };
    if (!original.leaderId)
        return original;
    const profile = (await publicLeaders()).find(item => item.id === original.leaderId);
    const credential = profile?.credentials.find(item => item.noExpiry || Date.parse(item.validUntil) >= (startsAt ? Date.parse(startsAt) : Date.now()));
    return { ...original, leaderName: profile?.name || '', leaderQualifications: profile?.qualifications || '', leaderIssuer: credential?.issuer || '', leaderCredential: credential?.number || '', leaderSource: credential?.source || '' };
}
