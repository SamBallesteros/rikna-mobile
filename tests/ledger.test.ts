import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoStore, merchantPayments, parsePesoMinor, qrForResident, resolveMerchantScan, resolveResidentScan, type Result } from '../src/ledger';
import { demo, residentQR } from '../src/demo';
import { demoProfile } from '../src/auth';
import type { Profile, Role } from '../src/access';
import { phrases, translations } from '../src/strings';
import { TOKENS_PER_PESO, tokenMinorFromPesoMinor } from '../src/exchange';
import { activityTones, C } from '../src/theme';
const create = (role: Role = 'resident') => { const s = createDemoStore(() => '2026-11-09T09:00:00+08:00'); s.startSession(demoProfile, role); return s; };
const value = <T>(r: Result<T>) => { if (!r.ok) assert.fail(r.error); return r.value; };

test('fresh resident-linked codes; equal 200-token award for each waste type exactly once', () => {
  const s = create(); const seen = new Set<string>();
  for (const trash of ['recyclable', 'biodegradable', 'residual'] as const) {
    s.switchRole('resident'); const p = value(s.generatePickup(trash)); assert.equal(p.residentId, demo.resident.id); assert.ok(!seen.has(p.code)); seen.add(p.code);
    s.switchRole('official'); assert.equal(value(s.verifyPickup(p.code)).tokenMinor, 20000);
    assert.deepEqual(s.verifyPickup(p.code), { ok: false, error: 'alreadyVerified' });
  }
  assert.equal(s.getSnapshot().balanceMinor, 180000); assert.equal(s.getSnapshot().transactions.length, 3);
});
test('invalid pickup preserves ledger data', () => {
  const s = create('official'), before = s.getSnapshot(); assert.deepEqual(s.verifyPickup('missing'), { ok: false, error: 'unknownPickup' }); assert.strictEqual(s.getSnapshot(), before);
});
test('attendance states change without tokens until once-only 400-token approval', () => {
  const s = create('official'), initial = s.getSnapshot().balanceMinor;
  assert.deepEqual(s.approveAttendance('river'), { ok: false, error: 'needCheckOut' });
  assert.deepEqual(s.scanAttendance('river', residentQR, 'checkOut'), { ok: false, error: 'needCheckIn' });
  assert.equal(value(s.scanAttendance('river', residentQR, 'checkIn')), 'checkedIn'); assert.equal(s.getSnapshot().balanceMinor, initial);
  assert.equal(value(s.scanAttendance('river', residentQR, 'checkOut')), 'checkedOut'); assert.equal(s.getSnapshot().balanceMinor, initial);
  value(s.approveAttendance('river')); assert.equal(s.getSnapshot().attendance[s.attendanceKey('river')], 'approved');
  assert.equal(s.getSnapshot().balanceMinor, initial + 40000); assert.deepEqual(s.approveAttendance('river'), { ok: false, error: 'alreadyApproved' });
});
test('duplicate attendance, unknown event and invalid resident QR do not add awards', () => {
  const s = create('official'); assert.deepEqual(s.scanAttendance('river', 'bad', 'checkIn'), { ok: false, error: 'unknownQR' });
  assert.deepEqual(s.scanAttendance('bad', residentQR, 'checkIn'), { ok: false, error: 'unknownEvent' });
  value(s.scanAttendance('river', residentQR, 'checkIn')); assert.deepEqual(s.scanAttendance('river', residentQR, 'checkIn'), { ok: false, error: 'alreadyCheckedIn' });
  value(s.scanAttendance('river', residentQR, 'checkOut')); assert.deepEqual(s.scanAttendance('river', residentQR, 'checkOut'), { ok: false, error: 'alreadyCheckedOut' }); assert.equal(s.getSnapshot().balanceMinor, 120000);
});
test('earn 200 → pay ₱25 / 250 tokens → driver sees same transaction once', () => {
  const s = create(), p = value(s.generatePickup('recyclable')); s.switchRole('official'); value(s.verifyPickup(p.code)); s.switchRole('resident');
  assert.equal(s.getSnapshot().balanceMinor, 140000); const intent = value(s.beginPayment(demo.merchants[1].qr, '25'));
  assert.equal(intent.tokenMinor, 25000); assert.equal(s.getSnapshot().balanceMinor, 140000);
  const tx = value(s.confirmPayment(intent.id)); assert.equal(s.getSnapshot().balanceMinor, 115000);
  s.switchRole('merchant', 'driver'); const incoming = merchantPayments(s.getSnapshot(), 'driver'); assert.equal(incoming.length, 1); assert.strictEqual(incoming[0], tx); assert.equal(merchantPayments(s.getSnapshot(), 'shop').length, 0);
});
test('shop and driver receive separate payments; retries are idempotent even at zero balance', () => {
  const s = create(); const shop = value(s.beginPayment(demo.merchants[0].qr, '100.25')); const tx = value(s.confirmPayment(shop.id));
  value(s.confirmPayment(value(s.beginPayment(demo.merchants[1].qr, '19.75')).id)); assert.strictEqual(value(s.confirmPayment(shop.id)), tx);
  assert.equal(s.getSnapshot().balanceMinor, 0); assert.equal(s.getSnapshot().transactions.length, 2);
  assert.equal(merchantPayments(s.getSnapshot(), 'shop').length, 1); assert.equal(merchantPayments(s.getSnapshot(), 'driver').length, 1);
});
test('unknown QR, malformed amount and insufficient tokens preserve wallet', () => {
  const s = create(); assert.deepEqual(s.beginPayment('bad', '10'), { ok: false, error: 'unknownQR' });
  for (const amount of ['', '0', '-1', 'NaN', 'Infinity', '10.001', '1e2', '₱20', '1,000', '100000000000000000000']) assert.deepEqual(s.beginPayment(demo.merchants[0].qr, amount), { ok: false, error: 'invalidAmount' }, amount);
  assert.deepEqual(s.beginPayment(demo.merchants[0].qr, '121'), { ok: false, error: 'insufficient' });
  assert.equal(s.getSnapshot().balanceMinor, 120000); assert.equal(s.getSnapshot().transactions.length, 0);
});
test('two reviewed payments cannot overspend the same funds', () => {
  const s = create(), a = value(s.beginPayment(demo.merchants[0].qr, '80')), b = value(s.beginPayment(demo.merchants[1].qr, '80'));
  value(s.confirmPayment(a.id)); assert.deepEqual(s.confirmPayment(b.id), { ok: false, error: 'insufficient' }); assert.equal(s.getSnapshot().balanceMinor, 40000);
});
test('unassigned roles and direct ledger mutations are denied', () => {
  const s = createDemoStore(); assert.deepEqual(s.generatePickup('recyclable'), { ok: false, error: 'accessDenied' });
  const profile: Profile = { id: 'resident-b', name: 'Bea Santos', grants: [{ role: 'resident' }] };
  assert.equal(s.startSession(profile, 'official'), false); assert.equal(s.startSession(profile, 'resident'), true);
  assert.equal(s.switchRole('official'), false); assert.equal(s.switchRole('merchant', 'shop'), false);
  assert.deepEqual(s.verifyPickup('RK-000001'), { ok: false, error: 'accessDenied' }); assert.deepEqual(s.approveAttendance('river'), { ok: false, error: 'accessDenied' });
  s.endSession(); assert.deepEqual(s.beginPayment(demo.merchants[0].qr, '1'), { ok: false, error: 'accessDenied' });
});
test('multiple local accounts retain isolated wallets and rewards go to the pickup/attendance owner', () => {
  const s = create(), anaPickup = value(s.generatePickup('recyclable'));
  const bea: Profile = { id: 'resident-b', name: 'Bea Santos', grants: [{ role: 'resident' }] };
  s.startSession(bea, 'resident'); const beaPickup = value(s.generatePickup('residual'));
  const intent = value(s.beginPayment(demo.merchants[0].qr, '1'));
  s.startSession(demoProfile, 'resident'); assert.deepEqual(s.confirmPayment(intent.id), { ok: false, error: 'accessDenied' });
  s.switchRole('official'); value(s.verifyPickup(beaPickup.code)); assert.equal(s.getSnapshot().balanceMinor, 120000);
  value(s.scanAttendance('river', qrForResident(bea.id), 'checkIn')); value(s.scanAttendance('river', qrForResident(bea.id), 'checkOut')); value(s.approveAttendance('river', bea.id));
  assert.equal(s.getSnapshot().balanceMinor, 120000); s.startSession(bea, 'resident'); assert.equal(s.getSnapshot().balanceMinor, 180000);
  s.startSession(demoProfile, 'official'); value(s.verifyPickup(anaPickup.code)); assert.equal(s.getSnapshot().balanceMinor, 140000);
});
test('Merchant grants limit switching to assigned recipients', () => {
  const s = createDemoStore(); s.startSession({ id: 'shop-owner', name: 'Shop owner', grants: [{ role: 'merchant', merchantIds: ['shop'] }] }, 'merchant');
  assert.equal(s.switchRole('merchant', 'driver'), false); assert.equal(s.getSnapshot().merchantId, 'shop');
});
test('role switching preserves data and conversion is centrally 10 tokens to ₱1', () => {
  const s = create(), p = value(s.generatePickup('recyclable')); s.switchRole('official'); value(s.verifyPickup(p.code)); const before = s.getSnapshot();
  for (const role of ['merchant', 'official', 'resident'] as const) assert.equal(s.switchRole(role), true);
  assert.strictEqual(s.getSnapshot().transactions, before.transactions); assert.strictEqual(s.getSnapshot().pickups, before.pickups);
  assert.equal(TOKENS_PER_PESO, 10); assert.equal(demo.tokensPerPeso, 10); assert.equal(tokenMinorFromPesoMinor(1), 10); assert.equal(tokenMinorFromPesoMinor(2500), 25000);
  assert.equal(resolveMerchantScan(residentQR), undefined); assert.equal(resolveResidentScan(residentQR)?.id, demo.resident.id); assert.equal(parsePesoMinor('19.75'), 1975);
});
test('complete bilingual copy and sample LGU data remain independent', () => {
  for (const pair of Object.values(phrases)) { assert.ok(pair[0]); assert.ok(pair[1]); }
  assert.deepEqual(Object.keys(translations.en), Object.keys(translations.tl)); assert.match(translations.tl.smsBody, /Kunwaring resibo/);
  const saved = JSON.stringify(demo.lguRegister), s = create(); value(s.confirmPayment(value(s.beginPayment(demo.merchants[0].qr, '1')).id)); assert.equal(JSON.stringify(demo.lguRegister), saved);
  assert.equal(demo.lguRegister.filter(r => r.tokens > 0).reduce((n, r) => n + r.tokens, 0), 600); assert.equal(demo.lguRegister.filter(r => r.tokens < 0).reduce((n, r) => n - r.tokens, 0), 400);
});
test('activity palettes and core text meet contrast ratios', () => {
  const luminance = (hex: string) => { const rgb = hex.slice(1).match(/../g)!.map(x => { const v = parseInt(x, 16) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722; };
  const contrast = (a: string, b: string) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  for (const tone of Object.values(activityTones)) { assert.ok(contrast(tone.ink, tone.fill) >= 4.5); assert.ok(tone.icon); assert.ok(tone.label); }
  for (const [ink, fill] of [[C.ink, C.paper], [C.muted, C.white], [C.white, C.teal], [C.ink, C.lime], [C.error, '#FFF0EB']]) assert.ok(contrast(ink, fill) >= 4.5);
});
