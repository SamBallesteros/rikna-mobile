GATE: ERROR (the copy (the page showed no <main>, <section> or <h1> to lint); consistency.mjs could not walk 1440, 390; check.mjs could not run (exit 2: check: timed out))

# Rikna mobile update — implementation and verification

The line above is the historical website gate result from the original prototype. That failed gate was not rerun, as the skill instructs. It is **not a design-gate pass for this update**. No waivers were added and no skill kit files were edited. Current mobile interface, behavior, accessibility-state, contrast, and build results are reported separately below.

## Main changes and decisions

**Local signup/login replaces the password-free demo entry.** Signup supports a name plus one identifier: email, Philippine mobile number, or 16-digit PhilSys Digital ID Card Number (PCN), with password and confirmation. Required fields, method-specific formats, name bounds, password requirements, and password match have field-level errors. The first invalid field receives focus. Login accepts the registered identifier and password, followed by a role selector.

PhilSys validation checks the public 16-digit Card Number format, including grouped input. It rejects a 12-digit PSN and does not perform identity verification. This follows the PSA's description of the 16-digit transaction-facing Card Number. [PSA advisory](https://psa.gov.ph/content/public-advisory-37).

**Roles are assigned to accounts.** New signups always receive Resident access. Supplied signup payloads cannot grant privileges. Login rejects unassigned roles; wrong passwords, unknown accounts, and unassigned roles share one generic message. Protected routes, role switching, Merchant recipient selection, and ledger mutations enforce the account's grants. The sample account explicitly has all three roles and both Merchant wallets so the original competition flow remains demonstrable. The role registry and route access map live in `src/access.ts`.

**Accounts persist locally; the wallet remains a shared session prototype.** Passwords use salted PBKDF2-HMAC-SHA256 verifiers with 600,000 iterations. Identifiers use per-account salted hashes. No plaintext password or identifier is stored. Native records use Expo SecureStore; the browser preview uses localStorage. Account records are stored individually and the index is limited to 25 accounts. Local credentials do not provide server-backed authentication or authorization. [Expo SDK 58 SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [noble-hashes](https://github.com/paulmillr/noble-hashes).

Each resident has a separate wallet and owns their pickups, attendance, intents, and payment receipts. Officials can award another registered resident in the same app session without receiving that reward themselves. Role switching and logout preserve session activity; reload signs out and resets the ledger while retaining registered accounts and language.

**₱1 = 10 Eco-Tokens is centralized.** Starting balances, reward amounts, and LGU token rows are scaled by ten to preserve their previous peso value. The sample wallet starts at 1,200 tokens, waste earns 200, river attendance earns 400, and tree planting earns 500. A ₱25 fare costs 250 tokens; a ₱30.50 shop payment costs 305. Claim information still shows its independent labeled ₱250 example, not an automatic payout calculated from receipts. The old conversion was removed from current source, setup notes, decision notes, and rebuilt outputs.

**Shared language controls.** Login/header and Settings toggles use one persisted English/Tagalog state. Navigation, role switching, logout, and reload retain the language. New account, validation, privilege, storage, and busy messages are translated.

**Native visual system.** The requested design-taste-frontend skill guides one Manrope type system, aligned 24-point gutters, a 12/20-point control/card radius family, Morning Canopy wallet colors, and reusable controls. Large, equal earning tiles sit side by side from 380 points and stack below that. River activity uses blue, tree activity green, recycling amber, coastal teal, and community terracotta, with names and icons in addition to color. Existing river/tree events and recycling workflows use these treatments on relevant screens and reward history. The existing bird artwork, leaves, water, recycling icons, and working product UI supply the environmental visuals; no unrelated stock imagery or invented mascot is used.

**Interaction states.** Shared controls have pressed feedback, focus outlines, disabled states, asynchronous busy indicators, and error feedback. Submission locks prevent repeated async submissions. Earning tiles schedule navigation after one feedback frame and reuse existing routes. Selection controls use radio semantics. Both native accessibility states and explicit web ARIA aliases expose checked/busy/disabled state. Reduced motion disables route fades; no continuous animation is added.

## Verification results

| Check | Result | Evidence |
|---|---|---|
| PhilSys signup/login | PASS | Registered using a grouped 16-digit PCN and logged in with ungrouped digits after reload. Malformed and 12-digit input rejected. |
| Email signup/login | PASS | Registered and logged in case-insensitively after recreating/reloading local account storage. |
| Phone signup/login | PASS | Registered with `09…`, logged in with normalized `+639…`; invalid lengths/formats rejected. |
| Required fields and passwords | PASS | Individual errors, first-error focus, minimum/maximum length, case/number/symbol policy, confirmation mismatch, malformed identifiers. |
| Credential and privilege failures | PASS | Wrong password, unknown account, and unassigned role blocked with the same generic error. No extra privileges from signup input. |
| Assigned-role navigation | PASS | Resident-only signup sees only Resident; privileged route access requires login; direct ledger operations and unassigned Merchant recipients are denied. |
| Both language controls | PASS | Login → wallet → Settings → navigation → logout → reload retains the selected language; both toggles update the same state. |
| Conversion calculations | PASS | One rate constant; 25 pesos costs 250 tokens; 30.50 costs 305; minor-unit calculations, rewards, summaries, histories, receipts and sample LGU totals agree. |
| Pickup and attendance tile responsiveness | PASS | Equal-width/equal-height paired tiles at 390/768/1440; vertical stack at 320, in both languages. |
| Control states | PASS | Browser observed the real loading lifecycle, disabled/read-only inputs, busy announcements, pressed transform, visible focus outline, field errors, and disabled empty-code lookup. |
| Duplicate submissions/payments | PASS | Concurrent signup stores one account; UI double-submit blocked; repeated payment confirmation returns the original transaction with one deduction and recipient entry. |
| Activity colors | PASS | Browser checked named river/tree/recycling colors; unit checks verify all five tone/ground pairs at ≥4.5:1 contrast. |
| Responsive/accessibility QA | PASS within browser scope | Touch-target and overflow checks in English/Tagalog; 320/390/768/1440 responsive audit, plus 500-point Resident audit; checked radio/busy semantics, first-error focus, focus outlines, labels and reduced-motion preference. |
| Preserved earning/spending workflows | PASS | Waste code uniqueness, equal once-only verification, check-in/out without balance changes, completed once-only attendance approval, shop/driver payments, matching Merchant transactions, simulated SMS and separate LGU register. |

### Automated commands

- `npm run lint`: PASS, no findings.
- `npm run typecheck`: PASS.
- `npm test`: **25 passed, 0 failed** (11 account/validation tests and 14 ledger/conversion/contrast tests). Service-level tests use a reduced KDF cost for most cases; a separate test verifies the real 600,000-iteration default. Browser tests use the actual production-configured local KDF.
- `npm run test:ui`: **13 passed, 0 failed** on the final built preview. Five original end-to-end scenario groups and eight update groups. These cover all nine original acceptance scenarios plus the update requirements above.
- `npm run export:web`: PASS.
- `npm run export:native`: PASS for Android and iOS Hermes bundles. This is compilation, not physical-device execution or APK/IPA packaging.

Core shared-ledger demonstration: **1,200 → 1,400 after verified waste → 1,150 after a ₱25 fare → the driver sees one +250-token transaction with the same reference**. Shop and driver histories remain separate. Sample LGU totals are 600 earned and 400 spent and do not reflect current-session activity.

The browser suite uses its own preview port **8091**, leaving an existing Expo development server on 8081 alone. Screenshot capture waits for route feedback to settle. TypeScript, ledger tests, and native exports use the environment's approved execution permission where Windows sandbox restrictions require it.

## Visual QA and skill adaptation

Kind: native software wallet. The client's palette overrides palette dealing. One system is reused for authentication, role selection, resident earning actions, Official verification, Merchant wallets, activity, confirmation, and Settings. Marketing heroes, viewport-sized website sections, shaders, scroll moments, promotional footers, and browser contact forms are not imposed on native transactional screens. Sample labels are retained because the brief requires them.

Voice: direct public-service instructions; field errors say what to enter; statuses name the actual state; no live-government or live-SMS claims. The supplied name Rikna required no coined-name search. There are no photographic stand-ins, external form endpoints, invented proof, or canonical public domain. `rikna-logo.png` remains the user's unchanged bird artwork. A separate mascot has not been supplied.

Reviewed screenshots include `shots/update-login-mobile-tl.png`, `shots/update-signup-mobile.png`, `shots/update-signup-wide.png`, `shots/update-signup-validation.png`, `shots/update-home-320-en.png`, `shots/update-home-390-tl.png`, `shots/update-home-768-en.png`, `shots/update-home-1440-en.png`, `shots/update-settings-en.png`, `shots/update-settings-tl.png`, `shots/update-button-pressed.png`, `shots/update-official-trees.png`, and the refreshed wallet/verification/receipt images. The HTML browser report is in `playwright-report/`.

## Files changed

| Files | Purpose |
|---|---|
| `src/app/login.tsx`, `signup.tsx`, `settings.tsx` | New validated account forms and Settings/language/logout. |
| All previous `app/*` routes moved to `src/app/*` | Matches project AGENTS.md; non-route modules remain outside the route directory. Existing root layout, QR, payment, and LGU screens are preserved. Restart an existing Expo dev server after this move. |
| `src/app/index.tsx`, `roles.tsx`, `pickup.tsx`, `attendance.tsx`, `verify.tsx`, `events.tsx`, `activity.tsx`, `receipt.tsx` | New auth entry, grant filtering, responsive earning actions, activity tones, per-resident ownership, summaries/receipts and preserved role workflows. |
| `src/auth.ts`, `storage.ts`, `access.ts` | Account validation/service/storage, password verifiers and assigned-role access. |
| `src/exchange.ts`, `demo.ts`, `ledger.ts` | Central 10-token rate, scaled sample data, per-account balances and authorized atomic ledger operations. |
| `src/context.tsx`, `strings.ts` | Shared auth integration, persisted language and complete bilingual strings. |
| `src/ui.tsx`, `theme.ts` | Reusable controls, field/error/focus/busy states, semantic activity colors and responsive tiles. |
| `tests/auth.test.ts`, `ledger.test.ts`, `tests/ui/acceptance.spec.ts`, `updates.spec.ts` | Signup, credentials, grants, conversions, original flow regressions, UI states, language and layout coverage. |
| `app.json`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `playwright.config.ts` | SDK-compatible storage/crypto/lint dependencies, scripts, route/typecheck configuration and isolated test preview. |
| `README.md`, `DESIGN.md`, `DECISIONS.md`, `REPORT.md`, `shots/*`, `../rikna-mobile.zip` | Updated setup, demo guide, decisions, verification and handoff artifacts. |

## Remaining limitations

- Authentication is local to one installation/browser. A backend, trusted server authorization, rate limiting, recovery, verified email/phone ownership, and live PhilSys verification are required before production. The competition sample account intentionally has all roles. Local storage/grants are not a security boundary against a device/browser owner.
- Use sample identifiers in this prototype. Native account storage uses SecureStore; browser localStorage does not provide its device-encrypted guarantees. Account creation is capped at 25. There is no account-linking, deletion, password reset or privileged-role administration UI.
- Wallet history and balances remain session-only and reset on reload; accounts and language persist. There is no cross-device synchronization, live SMS, live payout processing, municipal tax-credit system, or geolocation.
- Physical-device/emulator interaction, native screen-reader use, system font enlargement, keyboard behavior on hardware, and camera scanning were not exercised here. Browser accessibility checks and Hermes exports do not substitute for those tests. No installable APK/IPA is produced.
- The historical website skill gate/performance checker is not passed. Current native-adapted browser checks and visual review are the evidence for this redesign. Separate mascot artwork and local native-speaker language review remain outstanding.

Setup and sample credentials are in [README.md](README.md); product policy decisions remain in [DECISIONS.md](DECISIONS.md).
