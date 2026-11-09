import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createAuthService, demoProfile, detectIdentity, normalizeIdentity, sampleAccount, validateSignup, validPassword, type AccountStorage, type AuthResult, type Signup } from '../src/auth';
import { canUseRole, routeRoles } from '../src/access';
const value = <T>(result: AuthResult<T>) => { if (!result.ok) assert.fail(result.error); return result.value; };
const setup = (iterations = 100) => {
  const map = new Map<string, string>();
  const storage: AccountStorage = { async get(key) { return map.get(key) ?? null; }, async set(key, val) { map.set(key, val); }, async remove(key) { map.delete(key); } };
  return { map, storage, auth: createAuthService(storage, async count => randomBytes(count), iterations) };
};
const signup = (kind: Signup['kind'], identifier: string): Signup => ({ name: 'Bea Santos', kind, identifier, password: 'GreenBarangay!2026', confirm: 'GreenBarangay!2026' });

test('PhilSys accepts only the public 16-digit PCN formatting, not 12-digit PSN', () => {
  for (const id of ['1234567812345678', '1234-5678-1234-5678', '1234 5678 1234 5678']) assert.equal(normalizeIdentity('philsys', id), 'philsys:1234567812345678');
  for (const id of ['123456789012', '1234-5678-1234-567', '1234_5678_1234_5678', '12345678123456789', 'abcd-efgh-ijkl-mnop']) assert.equal(normalizeIdentity('philsys', id), null);
});
test('email and Philippine phone normalization and invalid formats', () => {
  assert.equal(normalizeIdentity('email', ' Bea@Example.com '), 'email:bea@example.com');
  for (const phone of ['09171234567', '+639171234567', '639171234567', '+63 (917) 123-4567']) assert.equal(normalizeIdentity('phone', phone), 'phone:+639171234567');
  for (const phone of ['+12125550123', '0917abc4567', '0917123456', '+6391712345678', '0917/123/4567']) assert.equal(normalizeIdentity('phone', phone), null);
  for (const email of ['name@', 'name@localhost', 'a b@example.com', '@example.com', 'a@.com']) assert.equal(normalizeIdentity('email', email), null);
  assert.equal(detectIdentity('not an identifier'), null);
});
test('required fields, password policy and confirmation produce field errors', () => {
  assert.deepEqual(validateSignup({ name: '', kind: 'email', identifier: '', password: '', confirm: '' }), { name: 'requiredField', identifier: 'requiredField', password: 'requiredField', confirm: 'requiredField' });
  assert.equal(validateSignup({ ...signup('email', 'bad'), password: 'weak', confirm: 'different' }).identifier, 'invalidEmail');
  assert.equal(validateSignup({ ...signup('phone', '123') }).identifier, 'invalidPhone');
  assert.equal(validateSignup({ ...signup('philsys', '123') }).identifier, 'invalidPhilSys');
  assert.equal(validateSignup({ ...signup('email', 'bea@example.com'), confirm: 'different' }).confirm, 'passwordMismatch');
  for (const p of ['Short1!', 'alllowercase1!', 'ALLUPPERCASE1!', 'MissingNumber!', 'MissingSymbol2026', 'X'.repeat(129)]) assert.equal(validPassword(p), false);
});
for (const [kind, id, alias] of [['email', 'Bea@Example.com', 'bea@example.com'], ['phone', '09181234567', '+639181234567'], ['philsys', '9876-5432-9876-5432', '9876543298765432']] as const) {
  test(`${kind} signup persists and logs in after recreating the service`, async () => {
    const { auth, storage, map } = setup(); const profile = value(await auth.signup(signup(kind, id)));
    assert.deepEqual(profile.grants, [{ role: 'resident' }]);
    const reopened = createAuthService(storage, async n => randomBytes(n), 100);
    assert.deepEqual(value(await reopened.login(alias, 'GreenBarangay!2026', 'resident')), profile);
    const serialized = JSON.stringify([...map.values()]);
    assert.ok(!serialized.includes('GreenBarangay!2026')); assert.ok(!serialized.includes(id)); assert.ok(!serialized.includes(alias));
    assert.ok(!('passwordHash' in profile)); assert.ok(!('identities' in profile));
  });
}
test('unknown account, wrong password and unassigned role return the same safe error', async () => {
  const { auth } = setup(); value(await auth.signup(signup('email', 'bea@example.com')));
  for (const result of [await auth.login('missing@example.com', 'GreenBarangay!2026', 'resident'), await auth.login('bea@example.com', 'WrongPassword!2026', 'resident'), await auth.login('bea@example.com', 'GreenBarangay!2026', 'official'), await auth.login('bea@example.com', 'GreenBarangay!2026', 'merchant')]) assert.deepEqual(result, { ok: false, error: 'loginFailed' });
});
test('public signup ignores supplied privilege fields; normalized duplicates cannot create accounts', async () => {
  const { auth, map } = setup(); const input = { ...signup('email', 'Bea@Example.com'), grants: demoProfile.grants };
  const profile = value(await auth.signup(input)); assert.deepEqual(profile.grants, [{ role: 'resident' }]);
  assert.deepEqual(await auth.signup(signup('email', 'bea@example.com')), { ok: false, error: 'signupFailed' });
  assert.equal(JSON.parse(map.get('rikna.accounts.v2')!).length, 2);
});
test('concurrent duplicate signup is serialized and stored once', async () => {
  const { auth, map } = setup(); const results = await Promise.all([auth.signup(signup('email', 'bea@example.com')), auth.signup(signup('email', 'bea@example.com'))]);
  assert.equal(results.filter(r => r.ok).length, 1); assert.equal(JSON.parse(map.get('rikna.accounts.v2')!).length, 2);
});
test('sample account aliases and explicitly assigned roles work', async () => {
  const { auth } = setup();
  for (const identifier of [sampleAccount.identifier, sampleAccount.phone, sampleAccount.philsys]) for (const role of ['resident', 'official', 'merchant'] as const) assert.equal(value(await auth.login(identifier, sampleAccount.password, role)).id, demoProfile.id);
  assert.equal(canUseRole(demoProfile, 'merchant', 'driver'), true); assert.equal(canUseRole({ ...demoProfile, grants: [{ role: 'resident' }] }, 'official'), false);
  assert.deepEqual(routeRoles['/verify'], ['official']); assert.deepEqual(routeRoles['/pay'], ['resident']);
});
test('default credential work factor and storage failures are handled', async () => {
  const { storage, map } = setup(); const auth = createAuthService(storage, async n => randomBytes(n)); await auth.initialize();
  assert.equal(JSON.parse(map.get(`rikna.account.${demoProfile.id}`)!).iterations, 600000);
  const failing: AccountStorage = { async get() { throw Error('unavailable'); }, async set() { throw Error('unavailable'); }, async remove() {} };
  assert.deepEqual(await createAuthService(failing, async n => randomBytes(n), 100).login(sampleAccount.identifier, sampleAccount.password, 'resident'), { ok: false, error: 'storageError' });
});
