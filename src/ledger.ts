import { demo } from './demo';
import { canUseRole, type Profile, type Role } from './access';
import { tokenMinorFromPesoMinor } from './exchange';
export type { Role } from './access';
export type Trash = 'recyclable' | 'biodegradable' | 'residual';
export type AttendanceStatus = 'checkedIn' | 'checkedOut' | 'approved';
export type ErrorCode = 'accessDenied' | 'unknownPickup' | 'alreadyVerified' | 'unknownQR' | 'invalidAmount' | 'insufficient' | 'unknownIntent' | 'alreadyCheckedIn' | 'needCheckIn' | 'needCheckOut' | 'alreadyCheckedOut' | 'alreadyApproved' | 'unknownEvent';
export type Pickup = { id: string; code: string; residentId: string; trash: Trash; verified: boolean; createdAt: string };
export type Transaction = { id: string; kind: 'pickup' | 'event' | 'payment'; residentId: string; residentName: string; tokenMinor: number; at: string; sourceId: string; merchantId?: string; pesoMinor?: number };
export type Intent = { id: string; merchantId: string; residentId: string; pesoMinor: number; tokenMinor: number; transactionId?: string };
export type Resident = { id: string; name: string };
export type State = { signedIn: boolean; profile: Profile | null; resident: Resident; residents: Record<string, Resident>; balances: Record<string, number>; lastAttendanceResidentId: string; role: Role | null; merchantId: string; balanceMinor: number; pickups: Pickup[]; attendance: Record<string, AttendanceStatus>; transactions: Transaction[]; intents: Intent[] };
export type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorCode };
const fail = (error: ErrorCode): Result<never> => ({ ok: false, error });
export const parsePesoMinor = (raw: string) => {
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  const n = Math.round(Number(raw.trim()) * 100);
  return Number.isSafeInteger(n) && n > 0 && n <= 100000000 ? n : null;
};
// Scanner-independent payload adapters: a camera can call the same functions later.
export const resolveMerchantScan = (qr: string) => demo.merchants.find(m => m.qr === qr.trim());
export const qrForResident = (id: string) => `rikna:v1:resident:${id}`;
export const resolveResidentScan = (qr: string, residents: Resident[] = [demo.resident]) => residents.find(r => qrForResident(r.id) === qr.trim());
export function createDemoStore(clock: () => string = () => new Date().toISOString()) {
  let sequence = 0;
  let state: State = { signedIn: false, profile: null, resident: demo.resident, residents: { [demo.resident.id]: demo.resident }, balances: { [demo.resident.id]: demo.startingTokens * 100 }, lastAttendanceResidentId: demo.resident.id, role: null, merchantId: 'shop', balanceMinor: demo.startingTokens * 100, pickups: [], attendance: {}, transactions: [], intents: [] };
  const listeners = new Set<() => void>();
  const id = (prefix: string) => `${prefix}-${String(++sequence).padStart(6, '0')}`;
  const update = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach(l => l()); };
  const attendanceKey = (eventId: string, residentId = state.resident.id) => `${residentId}:${eventId}`;
  const allowed = (role: Role) => state.signedIn && state.role === role && canUseRole(state.profile, role, role === 'merchant' ? state.merchantId : undefined);
  const balanceUpdate = (residentId: string, delta: number) => {
    const balances = { ...state.balances, [residentId]: (state.balances[residentId] ?? 0) + delta };
    return { balances, balanceMinor: balances[state.resident.id] };
  };
  return {
    getSnapshot: () => state,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
    startSession(profile: Profile, role: Role): boolean {
      if (!canUseRole(profile, role)) return false;
      const resident = { id: profile.id, name: profile.name };
      const balances = { ...state.balances, [profile.id]: state.balances[profile.id] ?? demo.startingTokens * 100 };
      const merchantId = profile.grants.find(g => g.role === 'merchant')?.merchantIds?.[0] ?? 'shop';
      update({ signedIn: true, profile, role, resident, balances, balanceMinor: balances[profile.id], residents: { ...state.residents, [profile.id]: resident }, merchantId });
      return true;
    },
    endSession: () => update({ signedIn: false, profile: null, role: null }),
    switchRole(role: Role, merchantId = state.merchantId): boolean {
      if (!state.signedIn || !canUseRole(state.profile, role, role === 'merchant' ? merchantId : undefined)) return false;
      update({ role, merchantId }); return true;
    },
    generatePickup(trash: Trash): Result<Pickup> {
      if (!allowed('resident')) return fail('accessDenied');
      const pickup = { id: id('pickup'), code: `RK-${String(sequence).padStart(6, '0')}`, residentId: state.resident.id, trash, verified: false, createdAt: clock() };
      update({ pickups: [pickup, ...state.pickups] });
      return { ok: true, value: pickup };
    },
    verifyPickup(code: string): Result<Transaction> {
      if (!allowed('official')) return fail('accessDenied');
      const pickup = state.pickups.find(p => p.code === code.trim().toUpperCase());
      if (!pickup) return fail('unknownPickup');
      if (pickup.verified) return fail('alreadyVerified');
      const tx: Transaction = { id: id('earn'), kind: 'pickup', sourceId: pickup.id, residentId: pickup.residentId, residentName: state.residents[pickup.residentId].name, tokenMinor: demo.pickupReward * 100, at: clock() };
      update({ ...balanceUpdate(pickup.residentId, tx.tokenMinor), pickups: state.pickups.map(p => p.id === pickup.id ? { ...p, verified: true } : p), transactions: [tx, ...state.transactions] });
      return { ok: true, value: tx };
    },
    scanAttendance(eventId: string, qr: string, action: 'checkIn' | 'checkOut'): Result<AttendanceStatus> {
      if (!allowed('official')) return fail('accessDenied');
      if (!demo.events.some(e => e.id === eventId)) return fail('unknownEvent');
      const resident = resolveResidentScan(qr, Object.values(state.residents));
      if (!resident) return fail('unknownQR');
      const key = attendanceKey(eventId, resident.id), current = state.attendance[key];
      if (current === 'approved') return fail('alreadyApproved');
      if (action === 'checkIn' && current) return fail('alreadyCheckedIn');
      if (action === 'checkOut' && !current) return fail('needCheckIn');
      if (action === 'checkOut' && current === 'checkedOut') return fail('alreadyCheckedOut');
      const next = action === 'checkIn' ? 'checkedIn' : 'checkedOut';
      update({ attendance: { ...state.attendance, [key]: next }, lastAttendanceResidentId: resident.id });
      return { ok: true, value: next };
    },
    approveAttendance(eventId: string, residentId = state.lastAttendanceResidentId): Result<Transaction> {
      if (!allowed('official')) return fail('accessDenied');
      const event = demo.events.find(e => e.id === eventId);
      if (!event) return fail('unknownEvent');
      const key = attendanceKey(eventId, residentId), current = state.attendance[key];
      if (current === 'approved') return fail('alreadyApproved');
      if (current !== 'checkedOut') return fail('needCheckOut');
      const tx: Transaction = { id: id('earn'), kind: 'event', sourceId: eventId, residentId, residentName: state.residents[residentId].name, tokenMinor: event.reward * 100, at: clock() };
      update({ ...balanceUpdate(residentId, tx.tokenMinor), attendance: { ...state.attendance, [key]: 'approved' }, transactions: [tx, ...state.transactions] });
      return { ok: true, value: tx };
    },
    beginPayment(qr: string, raw: string): Result<Intent> {
      if (!allowed('resident')) return fail('accessDenied');
      const merchant = resolveMerchantScan(qr);
      if (!merchant) return fail('unknownQR');
      const pesoMinor = parsePesoMinor(raw);
      if (pesoMinor === null) return fail('invalidAmount');
      const tokenMinor = tokenMinorFromPesoMinor(pesoMinor);
      if (!Number.isSafeInteger(tokenMinor) || tokenMinor <= 0) return fail('invalidAmount');
      if (tokenMinor > state.balanceMinor) return fail('insufficient');
      const intent: Intent = { id: id('pay'), residentId: state.resident.id, merchantId: merchant.id, pesoMinor, tokenMinor };
      update({ intents: [...state.intents, intent] });
      return { ok: true, value: intent };
    },
    confirmPayment(intentId: string): Result<Transaction> {
      if (!allowed('resident')) return fail('accessDenied');
      const intent = state.intents.find(i => i.id === intentId);
      if (!intent) return fail('unknownIntent');
      if (intent.residentId !== state.resident.id) return fail('accessDenied');
      // Return the original receipt before rechecking funds: retry is idempotent.
      if (intent.transactionId) return { ok: true, value: state.transactions.find(t => t.id === intent.transactionId)! };
      if (intent.tokenMinor > state.balanceMinor) return fail('insufficient');
      const tx: Transaction = { id: id('tx'), kind: 'payment', residentId: intent.residentId, residentName: state.resident.name, sourceId: intent.id, merchantId: intent.merchantId, tokenMinor: intent.tokenMinor, pesoMinor: intent.pesoMinor, at: clock() };
      // Both wallets derive from this single transaction. No second Merchant write.
      update({ ...balanceUpdate(intent.residentId, -tx.tokenMinor), transactions: [tx, ...state.transactions], intents: state.intents.map(i => i.id === intent.id ? { ...i, transactionId: tx.id } : i) });
      return { ok: true, value: tx };
    },
    attendanceKey,
  };
}
export const store = createDemoStore();
export const merchantPayments = (state: State, merchantId: string) => state.transactions.filter(t => t.kind === 'payment' && t.merchantId === merchantId);
