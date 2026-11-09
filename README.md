# Rikna mobile prototype

React Native, Expo SDK 58, TypeScript, and Expo Router. Includes local signup/login, account privileges, shared civic rewards workflows, English/Tagalog, the supplied bird artwork, and Morning Canopy colors. **₱1 = 10 Eco-Tokens** throughout.

## Run

Use Node 24 (used for this build).

```powershell
cd C:\Users\Sam\Desktop\Rikna\rikna-mobile
npm.cmd ci
npm.cmd start
```

Open with an Expo Go build compatible with SDK 58 and the bundled modules. Press `a` for an installed Android emulator. On macOS, `npm run ios` can open an installed iOS simulator; Windows cannot run the iOS simulator. If your Expo Go version does not include the required SDK/modules, use a development build. On macOS/Linux use `npm` in place of `npm.cmd`.

The existing development server must be restarted after this update because routes now live in `src/app/`.

For a browser preview:

```powershell
npm.cmd run export:web
npm.cmd run preview
```

Open `http://127.0.0.1:8081`. If that port already hosts Expo, choose another port with `$env:PORT='8092'` before running the preview. Interface tests start their own built-preview server on **8091**.

## Log in or sign up

The previous password-free demo entry has been removed. Log in with a registered identifier, password, and an assigned role. The included competition account is:

| Field | Sample value |
|---|---|
| Email | `demo@rikna.example` |
| Phone alias | `+639171234567` |
| PhilSys Card Number alias | `1234-5678-1234-5678` |
| Password | `RiknaDemo!2026` |
| Assigned roles | Resident, Barangay Official, Merchant for both shop and driver |

The login page also shows these sample email/password credentials. The sample aliases are fictional formatting examples; there is no government identity verification.

**Create account** supports one of email, Philippine mobile number, or PhilSys Digital ID Card Number, plus a name, password, and confirmation. Passwords require 12–128 characters, uppercase/lowercase, a number, and a symbol. PhilSys input accepts 16 digits, optionally in groups of four separated by spaces or hyphens; it does not ask for the confidential 12-digit PSN. Email matching is case-insensitive; `09…` phone numbers normalize to `+639…`.

All public signups receive **Resident access only**. They cannot assign themselves Official or Merchant privileges. Wrong credentials and a disallowed role use the same login failure message. Route guards and ledger checks also enforce assigned roles. Provisioning more privileged accounts is a future server/admin responsibility; the sample account's grants are configured in `src/auth.ts` for the competition flow.

## Demonstrate earning and spending

1. Log in as **Resident** with the sample account. Ana starts with **1,200 Eco-Tokens**, sample spending value ₱120.
2. Open **Generate pickup code**, choose a waste type, and generate two codes. Each pickup receives a fresh code linked to its resident.
3. Go back and use **Switch role → Barangay Official → Verify waste pickup**. Enter the code or load the latest demo code, look it up, and confirm. Every waste type earns **200 tokens** once.
4. Switch back to Resident. The balance is **1,400**.
5. Open **Scan to pay → Simulate driver scan**. Enter `25`. Review **₱25.00 = 250 Eco-Tokens**, then confirm. The remaining balance is **1,150**.
6. Confirmation appears immediately, followed by a labeled simulated Merchant SMS. No SMS is sent.
7. With the sample multi-role account, tap **Open recipient wallet**. Kuya Ben sees **250 tokens** and the same transaction reference. The shop remains unchanged.
8. Repeat with the shop: **₱30.50 = 305 tokens**. Both Merchant types use one payment workflow and independent recipient histories.

Newly signed-up residents have separate wallets and pickup/attendance records. In the same app session, log out and use the sample Official account to verify another resident's pickup code. The award goes to the code owner, not the Official's wallet. Log back into that resident account to inspect it.

## Attendance, language, and sample LGU register

- Resident **Show attendance QR** generates that resident's QR. Official **Manage event attendance** supports the preloaded riverside and tree-planting events.
- Use **Load resident demo QR** for Ana, or enter another resident's QR payload. Check-in and check-out do not change balances. Completed approval awards **400 tokens** for riverside clean-up or **500** for tree planting, once.
- Payloads: `rikna:v1:resident:<resident-id>`, `rikna:v1:merchant:shop`, and `rikna:v1:merchant:driver`. All scan controls are labeled simulated; no camera permission is requested. Merchant wallets display genuine generated payment QR codes.
- **EN / TL** on login and other headers and **Settings → App language** use the same state. Language persists through navigation, role switching, logout, and app reload.
- The separate `/lgu` view is linked from login, outside the mobile role picker. It remains read-only sample data: **600 tokens earned, 400 spent**, unrelated to the session ledger.

## Storage and scope

This is a **local credential prototype**, not a production identity service. Use sample details. Native account records use Expo SecureStore; the web preview uses browser localStorage. Passwords are salted PBKDF2-HMAC-SHA256 verifiers (600,000 iterations); normalized identifiers are salted hashes, not plaintext. Native and web storage cannot synchronize. No login session is restored after reload.

Accounts and language persist locally. Wallet activity, pickups, attendance, and payment history live in shared memory for the current session. Switching roles or logging out preserves that session's ledger; reloading resets it. Old password-free demo state is not migrated. Local account creation is capped at 25 accounts to keep the account index small for device storage.

Live PhilSys verification, email/phone ownership verification, password recovery, server-issued authorization, rate limiting, backend persistence, live SMS, payouts, geolocation, municipal tax credits, and cross-device sync remain outside this prototype. Client-side grants/storage are not a production security boundary.

## Change sample values and styles

- `src/exchange.ts`: the single exchange-rate constant and conversion helpers. It is currently fixed to the requested **10 tokens per peso**.
- `src/demo.ts`: sample starting balance, equal waste rewards, events, recipients, claim details, and independent LGU rows. Starting/reward/LGU token values derive from peso values using the same rate.
- `src/auth.ts`: sample credentials, assigned grants, normalization/validation, password policy, account service.
- `src/access.ts`: role registry, grants, and protected-route roles.
- `src/theme.ts`: brand palette plus blue river, green tree, amber recycling, teal coastal, and terracotta community activity tones.
- `src/strings.ts`: all English and Tagalog phrases.
- `src/ui.tsx`: shared buttons, input fields, focus states, tiles, badges, cards, and responsive screen shell.

The sample ₱250 Merchant claim amount is separately labeled and is not calculated from wallet receipts or promised as a payout.

## Verify

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run export:web
npm.cmd run test:ui
npm.cmd run export:native
```

The browser tests require installed Chrome. They use an isolated port, run sequentially, and save screenshots in `shots/` and the HTML report in `playwright-report/`. Native export writes Android/iOS Hermes bundles to `dist-native/`; it does not create an installable APK/IPA.

See [REPORT.md](REPORT.md) for results and files changed, [DESIGN.md](DESIGN.md) for native design guidance, and [DECISIONS.md](DECISIONS.md) for unresolved policies.

Official references used: [Expo SDK 58 SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [Expo SDK 58 Crypto](https://docs.expo.dev/versions/v58.0.0/sdk/crypto/), [React Native Pressable](https://reactnative.dev/docs/pressable), [noble-hashes](https://github.com/paulmillr/noble-hashes), and [PSA public advisory on the 16-digit Card Number](https://psa.gov.ph/content/public-advisory-37).
