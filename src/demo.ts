import { TOKENS_PER_PESO, tokensFromPesos } from './exchange';
export type Localized = { en: string; tl: string };
export const demo = {
  resident: { id: 'resident-ana', name: 'Ana Reyes', area: { en: 'Barangay Maligaya · Demo', tl: 'Barangay Maligaya · Demo' } },
  startingTokens: tokensFromPesos(120),
  pickupReward: tokensFromPesos(20),
  tokensPerPeso: TOKENS_PER_PESO,
  events: [
    { id: 'river', category: 'river' as const, name: { en: 'Riverside clean-up', tl: 'Paglilinis sa tabing-ilog' }, place: { en: 'Maligaya river walk', tl: 'Tabing-ilog ng Maligaya' }, organizer: { en: 'Barangay Maligaya', tl: 'Barangay Maligaya' }, date: '2026-11-14T07:00:00+08:00', reward: tokensFromPesos(40), icon: 'water-outline' },
    { id: 'trees', category: 'trees' as const, name: { en: 'Plant a greener barangay', tl: 'Pagtatanim sa barangay' }, place: { en: 'Community garden', tl: 'Hardin ng pamayanan' }, organizer: { en: 'Municipal environment office', tl: 'Tanggapan ng kapaligiran ng munisipyo' }, date: '2026-11-21T08:00:00+08:00', reward: tokensFromPesos(50), icon: 'leaf-outline' },
  ],
  merchants: [
    { id: 'shop', name: 'Aling Nena’s Store', type: 'shop' as const, detail: { en: 'Neighborhood essentials', tl: 'Mga pang-araw-araw na kailangan' }, qr: 'rikna:v1:merchant:shop', icon: 'storefront-outline' },
    { id: 'driver', name: 'Kuya Ben · Tricycle', type: 'driver' as const, detail: { en: 'Maligaya tricycle route', tl: 'Ruta ng traysikel sa Maligaya' }, qr: 'rikna:v1:merchant:driver', icon: 'bicycle-outline' },
  ],
  claim: {
    location: { en: 'Municipal treasury · Maligaya civic hall', tl: 'Ingatang-yaman · Munisipyo ng Maligaya' },
    schedule: { en: 'Fridays, 9:00 AM–3:00 PM', tl: 'Biyernes, 9:00 AM–3:00 PM' },
    instructions: { en: 'Bring a valid ID and your Merchant account reference. Ask the treasury to confirm eligibility and the final amount before visiting.', tl: 'Dalhin ang valid ID at sanggunian ng Merchant account. Ipakumpirma muna sa ingatang-yaman ang pagiging kuwalipikado at huling halaga bago pumunta.' },
    cashPesos: 250,
  },
  lguRegister: [
    { id: 'S-101', kind: 'pickup' as const, tokens: tokensFromPesos(20), date: '2026-11-02T08:00:00+08:00' },
    { id: 'S-102', kind: 'event' as const, tokens: tokensFromPesos(40), date: '2026-11-03T10:00:00+08:00' },
    { id: 'S-103', kind: 'payment' as const, tokens: -tokensFromPesos(25), date: '2026-11-04T09:00:00+08:00' },
    { id: 'S-104', kind: 'payment' as const, tokens: -tokensFromPesos(15), date: '2026-11-05T11:00:00+08:00' },
  ],
};
export const residentQR = `rikna:v1:resident:${demo.resident.id}`;
