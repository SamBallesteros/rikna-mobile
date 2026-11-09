import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { canUseRole, type Profile, type Role } from './access';
import { demo } from './demo';
export type IdentityKind = 'email' | 'phone' | 'philsys';
export type AuthError = 'requiredField' | 'invalidEmail' | 'invalidPhone' | 'invalidPhilSys' | 'invalidIdentifier' | 'passwordRules' | 'passwordMismatch' | 'invalidName' | 'loginFailed' | 'signupFailed' | 'storageError';
export type Signup = { name: string; kind: IdentityKind; identifier: string; password: string; confirm: string };
export type SignupErrors = Partial<Record<keyof Signup, AuthError>>;
export type AuthResult<T> = { ok: true; value: T } | { ok: false; error: AuthError };
export interface AccountStorage { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> }
type Account = Profile & { salt: string; iterations: number; passwordHash: string; identities: string[] };
export const sampleAccount = { identifier: 'demo@rikna.example', phone: '+639171234567', philsys: '1234-5678-1234-5678', password: 'RiknaDemo!2026' };
export const demoProfile: Profile = { id: demo.resident.id, name: demo.resident.name, grants: [{ role: 'resident' }, { role: 'official' }, { role: 'merchant', merchantIds: ['shop', 'driver'] }] };
// PCN / National ID Card Number only: never request the confidential 12-digit PSN.
export function normalizeIdentity(kind: IdentityKind, raw: string): string | null {
  const value = raw.trim();
  if (kind === 'email') return value.length <= 254 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value) ? `email:${value.toLowerCase()}` : null;
  if (kind === 'phone') {
    if (!/^\+?[\d ()-]+$/.test(value)) return null;
    const digits = value.replace(/[ ()-]/g, '');
    const normalized = digits.startsWith('09') ? `+63${digits.slice(1)}` : digits.startsWith('639') ? `+${digits}` : digits;
    return /^\+639\d{9}$/.test(normalized) ? `phone:${normalized}` : null;
  }
  return /^(?:\d{16}|\d{4}[- ]\d{4}[- ]\d{4}[- ]\d{4})$/.test(value) ? `philsys:${value.replace(/[- ]/g, '')}` : null;
}
export const detectIdentity = (raw: string) => (['email', 'phone', 'philsys'] as const).map(kind => normalizeIdentity(kind, raw)).find(Boolean) ?? null;
export const validPassword = (value: string) => value.length >= 12 && value.length <= 128 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value);
export function validateSignup(input: Signup): SignupErrors {
  const errors: SignupErrors = {};
  if (!input.name.trim()) errors.name = 'requiredField'; else if (input.name.trim().length < 2 || input.name.trim().length > 60 || /[\u0000-\u001f<>]/.test(input.name)) errors.name = 'invalidName';
  if (!input.identifier.trim()) errors.identifier = 'requiredField';
  else if (!normalizeIdentity(input.kind, input.identifier)) errors.identifier = ({ email: 'invalidEmail', phone: 'invalidPhone', philsys: 'invalidPhilSys' } as const)[input.kind];
  if (!input.password) errors.password = 'requiredField'; else if (!validPassword(input.password)) errors.password = 'passwordRules';
  if (!input.confirm) errors.confirm = 'requiredField'; else if (input.password !== input.confirm) errors.confirm = 'passwordMismatch';
  return errors;
}
const INDEX = 'rikna.accounts.v2';
const accountKey = (id: string) => `rikna.account.${id}`;
const identityHash = (salt: string, value: string) => bytesToHex(sha256(utf8ToBytes(`${salt}:${value}`)));
const passwordHash = async (password: string, salt: string, iterations: number) => bytesToHex(await pbkdf2Async(sha256, utf8ToBytes(password), hexToBytes(salt), { c: iterations, dkLen: 32, asyncTick: 8 }));
const sameHash = (a: string, b: string) => { let diff = a.length ^ b.length; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0); return diff === 0; };
export function createAuthService(storage: AccountStorage, random: (length: number) => Promise<Uint8Array>, iterations = 600_000) {
  let initialized: Promise<void> | undefined;
  let queue = Promise.resolve();
  const readAccounts = async () => {
    const raw = await storage.get(INDEX);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const accounts = await Promise.all(ids.map(async id => { const data = await storage.get(accountKey(id)); if (!data) throw Error('Account storage unavailable'); return JSON.parse(data) as Account; }));
    return accounts;
  };
  const create = async (profile: Profile, identities: string[], password: string): Promise<Account> => {
    const salt = bytesToHex(await random(32));
    return { ...profile, salt, iterations, identities: identities.map(i => identityHash(salt, i)), passwordHash: await passwordHash(password, salt, iterations) };
  };
  const save = async (account: Account, accounts: Account[]) => {
    await storage.set(accountKey(account.id), JSON.stringify(account));
    try { await storage.set(INDEX, JSON.stringify([...accounts.map(a => a.id), account.id])); }
    catch (error) { await storage.remove(accountKey(account.id)); throw error; }
  };
  const initialize = () => initialized ??= (async () => {
    if (await storage.get(INDEX)) { await readAccounts(); return; }
    const identities = [normalizeIdentity('email', sampleAccount.identifier)!, normalizeIdentity('phone', sampleAccount.phone)!, normalizeIdentity('philsys', sampleAccount.philsys)!];
    await save(await create(demoProfile, identities, sampleAccount.password), []);
  })().catch(error => { initialized = undefined; throw error; });
  return {
    initialize,
    async signup(input: Signup): Promise<AuthResult<Profile>> {
      if (Object.keys(validateSignup(input)).length) return { ok: false, error: 'signupFailed' };
      let unlock!: () => void; const previous = queue; queue = new Promise(resolve => { unlock = resolve; }); await previous;
      try {
        await initialize(); const accounts = await readAccounts(); const identity = normalizeIdentity(input.kind, input.identifier)!;
        if (accounts.length >= 25 || accounts.some(a => a.identities.includes(identityHash(a.salt, identity)))) return { ok: false, error: 'signupFailed' };
        // Input cannot assign privileges. All public signups are Residents.
        const profile: Profile = { id: `resident-${bytesToHex(await random(12))}`, name: input.name.trim(), grants: [{ role: 'resident' }] };
        await save(await create(profile, [identity], input.password), accounts);
        return { ok: true, value: profile };
      } catch { return { ok: false, error: 'storageError' }; }
      finally { unlock(); }
    },
    async login(identifier: string, password: string, role: Role): Promise<AuthResult<Profile>> {
      try {
        await initialize(); const identity = detectIdentity(identifier); const accounts = await readAccounts();
        const account = identity ? accounts.find(a => a.identities.includes(identityHash(a.salt, identity))) : undefined;
        // Same KDF work and same message for unknown accounts, bad passwords, and disallowed roles.
        const candidate = await passwordHash(password.slice(0, 128), account?.salt ?? '00'.repeat(32), account?.iterations ?? iterations);
        if (!account || password.length > 128 || !sameHash(candidate, account.passwordHash) || !canUseRole(account, role)) return { ok: false, error: 'loginFailed' };
        return { ok: true, value: { id: account.id, name: account.name, grants: account.grants } };
      } catch { return { ok: false, error: 'storageError' }; }
    },
  };
}
