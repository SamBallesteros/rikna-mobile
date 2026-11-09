import { test, expect, type Page } from '@playwright/test';
const button = (p: Page, name: string) => p.getByRole('button', { name, exact: true });
const sampleLogin = async (p: Page, role = 'Resident') => {
  await p.goto('/login'); await p.getByTestId('login-identifier').fill('demo@rikna.example'); await p.getByTestId('login-password').fill('RiknaDemo!2026');
  await p.getByRole('radio', { name: role, exact: true }).click(); await expect(p.getByRole('radio', { name: role, exact: true })).toBeChecked(); await expect(button(p, 'Log in')).toBeEnabled(); await button(p, 'Log in').click(); await expect(p).toHaveURL(/\/$/);
};
const save = async (p: Page, name: string) => { await expect(p.getByTestId('language-switch').filter({ visible: true })).toBeVisible(); await p.waitForTimeout(240); await p.screenshot({ path: `shots/update-${name}.png`, fullPage: true }); };

for (const scenario of [
  { method: 'Email address', id: 'bea@example.com', login: 'BEA@example.com', key: 'email' },
  { method: 'Philippine mobile number', id: '09181234567', login: '+639181234567', key: 'phone' },
  { method: 'PhilSys Digital ID · Card Number', id: '9876-5432-9876-5432', login: '9876543298765432', key: 'philsys' },
]) test(`${scenario.key} signup, stored credentials, denied privilege, and registered login`, async ({ page: p }) => {
  await p.goto('/signup'); await p.getByTestId('signup-name').fill('Bea Santos'); await p.getByRole('radio', { name: scenario.method, exact: true }).click();
  await p.getByTestId('signup-identifier').fill(scenario.id); await p.getByTestId('signup-password').fill('GreenBarangay!2026'); await p.getByTestId('signup-confirm').fill('GreenBarangay!2026');
  await expect(button(p, 'Create account')).toBeEnabled(); await button(p, 'Create account').dblclick(); await expect(p.getByText('Account created. Log in to open your wallet.', { exact: true })).toBeVisible({ timeout: 20000 });
  const stored = await p.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith('rikna.account.')).map(([,v]) => v).join(''));
  expect(stored).not.toContain('GreenBarangay!2026'); expect(stored).not.toContain(scenario.id); expect(stored).not.toContain(scenario.login);
  expect(await p.evaluate(() => JSON.parse(localStorage.getItem('rikna.accounts.v2')!).length)).toBe(2);
  await p.reload(); await p.getByTestId('login-identifier').fill(scenario.login); await p.getByTestId('login-password').fill('GreenBarangay!2026');
  await p.getByRole('radio', { name: 'Barangay Official', exact: true }).click(); await button(p, 'Log in').click();
  await expect(p.getByText('Unable to log in with these details and role. Check your entries or ask your barangay about access.', { exact: true })).toBeVisible({ timeout: 20000 });
  await p.getByRole('radio', { name: 'Resident', exact: true }).click(); await button(p, 'Log in').click(); await expect(p.getByText('Hello, Bea', { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(p.getByTestId('resident-balance')).toHaveText('1,200'); await button(p, 'Switch role').click(); await expect(button(p, 'Resident')).toBeVisible(); await expect(button(p, 'Barangay Official')).toHaveCount(0); await expect(button(p, 'Open shop wallet')).toHaveCount(0);
  await save(p, `registered-${scenario.key}`);
  await p.goto('/verify'); await expect(p).toHaveURL(/\/login$/); await expect(button(p, 'Confirm verification')).toHaveCount(0);
});

test('signup required fields, method formats, password policy, confirmation and field focus', async ({ page: p }) => {
  await p.goto('/signup'); await expect(button(p, 'Create account')).toBeEnabled({ timeout: 20000 }); await button(p, 'Create account').click();
  await expect(p.getByTestId('signup-name')).toBeFocused(); await expect(p.getByText('This field is required.', { exact: true })).toHaveCount(4);
  await p.getByTestId('signup-name').fill('Bea Santos'); await p.getByTestId('signup-identifier').fill('bad'); await p.getByTestId('signup-password').fill('weak'); await p.getByTestId('signup-confirm').fill('different'); await button(p, 'Create account').click();
  await expect(p.getByTestId('signup-identifier-error')).toContainText('valid email'); await expect(p.getByTestId('signup-password-error')).toContainText('12–128'); await expect(p.getByTestId('signup-confirm-error')).toContainText('do not match');
  await p.getByRole('radio', { name: 'Philippine mobile number', exact: true }).click(); await p.getByTestId('signup-identifier').fill('123'); await button(p, 'Create account').click(); await expect(p.getByTestId('signup-identifier-error')).toContainText('Philippine mobile number');
  await p.getByRole('radio', { name: 'PhilSys Digital ID · Card Number', exact: true }).click(); await p.getByTestId('signup-identifier').fill('123456789012'); await button(p, 'Create account').click(); await expect(p.getByTestId('signup-identifier-error')).toContainText('16 digits');
  await save(p, 'signup-validation');
});

test('invalid login, pressed/focus/loading/disabled states, and duplicate submission blocking', async ({ page: p }) => {
  await p.goto('/login'); await expect(button(p, 'Log in')).toBeEnabled({ timeout: 20000 });
  await button(p, 'Log in').click(); await expect(p.getByTestId('login-identifier')).toBeFocused(); await expect(p.getByTestId('login-password-error')).toContainText('required');
  await p.getByTestId('login-identifier').fill('bad'); await p.getByTestId('login-password').fill('wrong'); await button(p, 'Log in').click(); await expect(p.getByTestId('login-identifier-error')).toContainText('valid PhilSys');
  await p.getByTestId('login-identifier').fill('demo@rikna.example'); await p.getByTestId('login-password').fill('WrongPassword!2026');
  // Observe the complete async action; fast devices may finish before click() returns.
  await p.evaluate(() => {
    const node = document.querySelector('[data-testid="login-submit"]')!;
    const states: { busy: string | null; disabled: boolean; readonly: boolean; processing: boolean }[] = [];
    (window as unknown as { buttonStates: typeof states }).buttonStates = states;
    new MutationObserver(() => states.push({ busy: node.getAttribute('aria-busy'), disabled: node.hasAttribute('disabled'), readonly: (document.querySelector('[data-testid="login-password"]') as HTMLInputElement).readOnly, processing: node.textContent?.includes('Processing') ?? false })).observe(node, { attributes: true, subtree: true, childList: true, characterData: true });
  });
  await button(p, 'Log in').click();
  await expect(p.getByText('Unable to log in with these details and role. Check your entries or ask your barangay about access.', { exact: true })).toBeVisible({ timeout: 20000 });
  const states = await p.evaluate(() => (window as unknown as { buttonStates: { busy: string | null; disabled: boolean; readonly: boolean; processing: boolean }[] }).buttonStates);
  expect(states.some(s => s.busy === 'true' && s.disabled && s.readonly && s.processing)).toBe(true);
  await button(p, 'Log in').focus(); expect(await button(p, 'Log in').evaluate(e => parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(2);
  const b = button(p, 'Create account'); await b.scrollIntoViewIfNeeded(); const rect = await b.boundingBox(); if (!rect) throw Error('Missing button');
  await p.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await p.mouse.down();
  await expect(b).not.toHaveCSS('transform', 'none'); await save(p, 'button-pressed'); await p.mouse.move(1, 1); await p.mouse.up();
  await p.getByTestId('login-password').fill('RiknaDemo!2026'); await button(p, 'Log in').dblclick(); await expect(p.getByTestId('resident-balance')).toHaveText('1,200', { timeout: 20000 });
});

test('login and Settings language toggles share state through navigation, logout and reload', async ({ page: p }) => {
  await p.goto('/login'); await button(p, 'Switch to Tagalog').click(); await expect(button(p, 'Mag-log in')).toBeVisible();
  await p.getByTestId('login-identifier').fill('demo@rikna.example'); await p.getByTestId('login-password').fill('RiknaDemo!2026'); await expect(button(p, 'Mag-log in')).toBeEnabled(); await button(p, 'Mag-log in').click();
  await expect(p.getByText('Kumusta, Ana', { exact: true })).toBeVisible({ timeout: 20000 }); await button(p, 'Mga setting').click();
  await p.getByTestId('settings-language').click(); await expect(p.getByText('Your Rikna preferences', { exact: true })).toBeVisible(); await expect(p.getByTestId('language-switch').filter({ visible: true })).toHaveText('EN / TL'); await save(p, 'settings-en');
  await button(p, 'Go back').click(); await expect(button(p, 'Generate pickup code')).toBeVisible(); await button(p, 'Settings').click(); await p.getByTestId('settings-language').click();
  await expect(p.getByText('Mga kagustuhan mo sa Rikna', { exact: true })).toBeVisible(); await save(p, 'settings-tl'); await button(p, 'Mag-log out').click();
  await expect(button(p, 'Mag-log in')).toBeVisible(); await p.reload(); await expect(p.getByTestId('language-switch')).toHaveText('TL / EN');
});

test('activity colors, readable labels, preserved attendance, and disabled/error verification states', async ({ page: p }) => {
  await sampleLogin(p); await expect(p.getByText('River clean-up', { exact: true })).toHaveCSS('color', 'rgb(24, 84, 119)'); await expect(p.getByText('Tree planting', { exact: true })).toHaveCSS('color', 'rgb(40, 97, 55)');
  await button(p, 'Generate pickup code').click(); await expect(p.getByText('Recycling', { exact: true })).toHaveCSS('color', 'rgb(128, 80, 26)'); await save(p, 'pickup-recycling'); await button(p, 'Go back').click();
  await button(p, 'Switch role').click(); await button(p, 'Barangay Official').click(); await button(p, 'Verify waste pickup').click(); await expect(button(p, 'Use latest demo code')).toBeDisabled();
  await p.getByTestId('pickup-code-input').fill('invalid'); await button(p, 'Look up code').click(); await expect(p.getByText('Pickup code not found. Check the code and try again.', { exact: true })).toBeVisible(); await save(p, 'official-error');
  await button(p, 'Go back').click(); await button(p, 'Manage event attendance').click(); await expect(p.getByText('River clean-up', { exact: true })).toHaveCSS('color', 'rgb(24, 84, 119)');
  await p.getByRole('radio', { name: 'Plant a greener barangay', exact: true }).click(); await expect(p.getByText('Tree planting', { exact: true })).toHaveCSS('color', 'rgb(40, 97, 55)'); await save(p, 'official-trees');
});

test('responsive action pair, auth pages, Settings, touch targets, focus and reduced motion', async ({ page: p }) => {
  const errors: string[] = []; p.on('pageerror', e => errors.push(e.message));
  await p.emulateMedia({ reducedMotion: 'reduce' }); await sampleLogin(p);
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    for (const language of ['en', 'tl']) {
      const toggle = p.getByTestId('language-switch'); if ((await toggle.innerText()).startsWith(language === 'en' ? 'TL' : 'EN')) await toggle.click();
      const a = await p.getByTestId('pickup-action').boundingBox(), b = await p.getByTestId('attendance-action').boundingBox(); if (!a || !b) throw Error('Missing actions');
      if (width >= 380) { expect(Math.abs(a.y - b.y)).toBeLessThan(1); expect(Math.abs(a.height - b.height)).toBeLessThan(1); expect(b.x).toBeGreaterThan(a.x); }
      else { expect(b.y).toBeGreaterThanOrEqual(a.y + a.height); expect(Math.abs(a.x - b.x)).toBeLessThan(1); }
      const audit = await p.evaluate(() => {
        const visible = (e: Element) => !e.closest('[aria-hidden="true"]') && !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
        const controls = [...document.querySelectorAll('[role="button"],[role="radio"],input,textarea')].filter(visible);
        return { small: controls.filter(e => e.getBoundingClientRect().height < 44).map(e => e.getAttribute('aria-label')), spill: [...document.querySelectorAll('*')].filter(e => visible(e) && e.getBoundingClientRect().right > innerWidth + 1).length };
      }); expect(audit).toEqual({ small: [], spill: 0 }); await save(p, `home-${width}-${language}`);
    }
  }
  await p.setViewportSize({ width: 390, height: 844 }); await button(p, 'Mga setting').click(); await save(p, 'settings-mobile'); await button(p, 'Mag-log out').click();
  await save(p, 'login-mobile-tl'); await button(p, 'Switch to English').click(); await button(p, 'Create account').click(); await save(p, 'signup-mobile');
  await p.setViewportSize({ width: 1440, height: 900 }); await save(p, 'signup-wide'); expect(errors).toEqual([]);
});
