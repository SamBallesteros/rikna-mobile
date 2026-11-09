# Decisions to resolve beyond the prototype

| Topic | Current prototype | Unresolved decision |
|---|---|---|
| Physical scanning | Labeled simulated scans with generated real QR codes; payload adapters separated from UI | Whether to add Expo Camera; permission prompts, invalid payload handling, scanner debounce, device testing |
| Pickup codes | Session-local sequential `RK-000001` format, linked to a resident and pickup; one verification | Production entropy, privacy, expiry, collection dates, offline lookup, sharing/printing |
| Refresh/reset | Reload signs out and resets ledger activity; accounts and language persist locally; role switching and logout preserve the in-memory ledger | Server wallet persistence, explicit reset behavior, account migration, receipts after reinstall, reconciliation |
| Event creation | Two configurable preloaded events, check-in/out/approval for each | LGU creation/editing/cancellation, dates and completion eligibility, multiple residents/officials, correction/reversal policy |
| Merchant claim policy | Clearly labeled sample location, Friday schedule, ₱250 cash example, provisional status; no live conversion to cash | Eligibility, schedules per account, claim status, cash conversion, funding, payout processing, reconciliation |
| Payment conversion | Requested ₱1 = 10 Eco-Tokens in one module; sample starting balances, rewards and LGU token rows scaled by ten; two-decimal amounts; no fees | Production denomination/rounding, caps, refunds, reversals and dispute procedure |
| LGU register | Separate read-only sample records: 600 earned, 400 spent; not the session ledger | Whether to show current-session/live activity, permissions, data export, auditability |
| Sign-in and SMS | Persistent local accounts, salted password verifiers/identifier hashes, assigned privileges, multiple resident wallets, simulated SMS | Backend auth, account/phone/email ownership and PhilSys verification, privileged-role provisioning, recovery, rate limits, real SMS and retries |
| Separate mascot | Supplied bird logo is included unchanged; no separate mascot asset provided | Supply the original mascot artwork and approve its native welcome/reward placement |
| Language review | Complete English/Tagalog application strings, flexible wrapping | Review municipal vocabulary and translations with local native speakers before public release |

The sample's people, merchants, barangay, event dates, reward amounts, and claim details are illustrative configurable data, not claims about an operating municipality. Local credentials are not a production identity service. No backend, live identity verification, live SMS, payout processing, municipal tax credits, geolocation, or cross-device sync is part of this build.
