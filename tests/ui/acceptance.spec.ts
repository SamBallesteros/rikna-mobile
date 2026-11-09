import { test, expect, type Page } from '@playwright/test';
const button = (p: Page, name: string) => p.getByRole('button', { name, exact: true });
const enter = async (p: Page) => { await p.goto('/'); await p.getByTestId('login-identifier').fill('demo@rikna.example'); await p.getByTestId('login-password').fill('RiknaDemo!2026'); await button(p, 'Log in').click(); await expect(p.getByTestId('resident-balance')).toHaveText('1,200'); };
const changeRole = async (p: Page, role: string) => { await button(p, 'Switch role').click(); await button(p, role).click(); };
const shot = async (p: Page, name: string) => { await p.screenshot({ path: `shots/${name}.png`, fullPage: true }); };

test('resident earns, pays tricycle, and the same payment reaches the driver wallet', async ({ page: p }) => {
  await enter(p); await shot(p, 'resident-en');
  await button(p, 'Generate pickup code').click(); await button(p, 'Generate pickup code').click();
  await expect(p.getByText('RK-000001', { exact: true })).toBeVisible();
  await button(p, 'Generate another code').click(); await expect(p.getByText('RK-000002', { exact: true })).toBeVisible();
  await button(p, 'Go back').click(); await changeRole(p, 'Barangay Official');
  await button(p, 'Verify waste pickup').click(); await p.getByTestId('pickup-code-input').fill('RK-000001'); await button(p, 'Look up code').click();
  await shot(p, 'official-verification-en'); await button(p, 'Confirm verification').click();
  await expect(p.getByText('200 Eco-Tokens awarded', { exact: true })).toBeVisible();
  await button(p, 'Look up code').click(); await expect(p.getByText('This pickup was already verified. No extra tokens were awarded.')).toBeVisible();
  await button(p, 'Go back').click(); await changeRole(p, 'Resident'); await expect(p.getByTestId('resident-balance')).toHaveText('1,400');
  await button(p, 'Scan to pay').click(); await button(p, 'Simulate driver scan').click();
  await p.getByTestId('payment-amount').fill('25'); await button(p, 'Review payment').click(); await expect(p.getByText('1,150 Eco-Tokens', { exact: true })).toBeVisible();
  await button(p, 'Confirm payment').dblclick(); await expect(p.getByTestId('receipt-amount')).toHaveText('250');
  await expect(p.getByTestId('simulated-sms')).toContainText('no SMS was sent'); await shot(p, 'payment-confirmation-en');
  const ref = await p.getByText(/^tx-\d+$/).innerText();
  await button(p, 'Open recipient wallet').click(); await expect(p.getByTestId('merchant-total')).toHaveText('250');
  await expect(p.getByText(`Eco-Tokens · ${ref}`, { exact: true })).toHaveCount(1);
  await expect(p.getByText('Municipal treasury · Maligaya civic hall', { exact: true })).toBeVisible();
  await expect(p.getByText('Fridays, 9:00 AM–3:00 PM', { exact: true })).toBeVisible();
  await expect(p.getByText('₱250.00', { exact: true })).toBeVisible(); await shot(p, 'driver-wallet-en');
  await changeRole(p, 'Open shop wallet'); await expect(p.getByTestId('merchant-total')).toHaveText('0');
});

test('completed attendance approval, shop payment and Tagalog across all roles', async ({ page: p }) => {
  await enter(p); await button(p, 'Show attendance QR').click(); await expect(p.locator('svg')).toBeVisible(); await button(p, 'Go back').click();
  await changeRole(p, 'Barangay Official'); await button(p, 'Manage event attendance').click(); await button(p, 'Load resident demo QR').click();
  await button(p, 'Scan for check-in').click(); await expect(p.getByText('Checked in', { exact: true })).toBeVisible();
  await shot(p, 'official-checked-in-en');
  await button(p, 'Go back').click(); await changeRole(p, 'Resident'); await expect(p.getByTestId('resident-balance')).toHaveText('1,200');
  await changeRole(p, 'Barangay Official'); await button(p, 'Manage event attendance').click(); await button(p, 'Load resident demo QR').click();
  await button(p, 'Scan for check-out').click(); await expect(p.getByText('Checked out — awaiting approval', { exact: true })).toBeVisible();
  await button(p, 'Go back').click(); await changeRole(p, 'Resident'); await expect(p.getByTestId('resident-balance')).toHaveText('1,200');
  await changeRole(p, 'Barangay Official'); await button(p, 'Manage event attendance').click(); await button(p, 'Approve attendance').click();
  await expect(p.getByText('Approved', { exact: true })).toBeVisible(); await shot(p, 'official-approved-en');
  await button(p, 'Approve attendance').click(); await expect(p.getByText('Attendance already approved. No extra tokens were awarded.')).toBeVisible();
  await button(p, 'Switch to Tagalog').click(); await expect(button(p, 'Aprubahan ang pagdalo')).toBeVisible(); await shot(p, 'official-tl');
  await button(p, 'Bumalik').click(); await button(p, 'Palitan ang papel').click(); await button(p, 'Residente').click();
  await expect(p.getByTestId('resident-balance')).toHaveText('1,600'); await shot(p, 'resident-tl');
  await button(p, 'Mag-scan para magbayad').click(); await button(p, 'Kunwaring scan ng tindahan').click();
  await p.getByTestId('payment-amount').fill('30.50'); await button(p, 'Suriin ang bayad').click(); await button(p, 'Kumpirmahin ang bayad').click();
  await expect(p.getByTestId('receipt-amount')).toHaveText('305'); await expect(p.getByTestId('simulated-sms')).toContainText('walang SMS na ipinadala'); await shot(p, 'payment-confirmation-tl');
  await button(p, 'Buksan ang wallet ng tatanggap').click(); await expect(p.getByTestId('merchant-total')).toHaveText('305');
  await expect(p.getByText('Halimbawang detalye ng pagkuha', { exact: true })).toBeVisible(); await expect(p.getByText('Biyernes, 9:00 AM–3:00 PM', { exact: true })).toBeVisible(); await shot(p, 'shop-wallet-tl');
});

test('invalid QR, amount and insufficient tokens leave wallet unchanged', async ({ page: p }) => {
  await enter(p); await button(p, 'Scan to pay').click(); await p.getByTestId('payment-payload').fill('unrecognized'); await button(p, 'Read QR payload').click();
  await expect(p.getByText('QR not recognized. Use a valid Rikna demo QR.')).toBeVisible();
  await button(p, 'Simulate shop scan').click(); await p.getByTestId('payment-amount').fill('-2'); await button(p, 'Review payment').click();
  await expect(p.getByText('Enter an amount greater than zero, with up to two decimal places.')).toBeVisible();
  await p.getByTestId('payment-amount').fill('121'); await button(p, 'Review payment').click();
  await expect(p.getByText('Not enough Eco-Tokens. Enter a smaller amount or earn more tokens.')).toBeVisible();
  await button(p, 'Go back').click(); await expect(p.getByTestId('resident-balance')).toHaveText('1,200');
  await changeRole(p, 'Open shop wallet'); await expect(p.getByTestId('merchant-total')).toHaveText('0');
});

test('LGU register is a separate read-only sample view', async ({ page: p }) => {
  await p.goto('/'); await button(p, 'Open sample LGU register').click(); await expect(p.getByText('LGU sample register', { exact: true })).toBeVisible();
  await expect(p.getByText('does not reflect this session', { exact: false })).toBeVisible(); await expect(p.getByText('600', { exact: true })).toBeVisible(); await expect(p.getByText('400', { exact: true })).toBeVisible();
  await expect(p.getByText(/S-10\d/)).toHaveCount(4); await expect(p.getByRole('textbox')).toHaveCount(0); await shot(p, 'lgu-register');
});

test('English and Tagalog phone layouts at 320, 390 and 500 points have no horizontal spill or small targets', async ({ page: p }) => {
  await enter(p);
  for (const width of [320, 390, 500]) {
    await p.setViewportSize({ width, height: 844 });
    for (const locale of ['en', 'tl']) {
      if ((await p.getByTestId('language-switch').innerText()).startsWith(locale === 'en' ? 'TL' : 'EN')) await p.getByTestId('language-switch').click();
      const audit = await p.evaluate(() => {
        const controls = [...document.querySelectorAll('[role="button"],input,textarea')].filter(e => e.getClientRects().length && e.getAttribute('aria-hidden') !== 'true');
        const small = controls.filter(e => e.getBoundingClientRect().height < 44).map(e => e.getAttribute('aria-label'));
        const spill = [...document.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(e).visibility !== 'hidden'; }).length;
        return { small, spill };
      });
      expect(audit).toEqual({ small: [], spill: 0 }); await shot(p, `resident-${locale}-${width}`);
    }
  }
});
