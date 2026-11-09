software — native civic rewards wallet for Philippine residents, barangay officials, and Merchants.
Client-directed Morning Canopy palette; Manrope in one family; balance-led wallet composition; cream/white grounds; no shaders, scenes, photographic stand-ins, or scroll moments in the transactional mobile UI.

## Signup/login redesign update

The same native adaptation now guides the signup/login screens and Settings. Morning Canopy remains the brand foundation; semantic activity tones add blue for river clean-up, green for tree planting, amber for recycling, teal for coastal activity, and terracotta for community activity. Every tone has a named label and an icon; text/ground pairs are automatically checked at a minimum 4.5:1 contrast.

At 380 points and above the two earning actions occupy equal-width, equal-height tiles, with recycling and tree icon treatments. They stack below 380 points. The shell grows to 600 points on wider screens while retaining 24-point content edges. Wallet amount/unit text wraps as whole elements on narrow phones.

Login and signup each have one filled primary submission control, with secondary navigation. Choice controls replace competing filled buttons for signup method, login role, waste type, and event selection. Field labels stay visible, individual errors sit below fields, and the first invalid field receives focus. Buttons, tiles, language controls, password visibility controls, tabs, and choices have a shared focus outline, pressed feedback, disabled state, and asynchronous busy handling. Native accessibility states and explicit web ARIA state aliases are both set. No fake network delay is added.

Accounts register as Residents. Assigned privileges determine login, role switching, screen access, and ledger mutation access. Settings and login/header language toggles share a persisted language state. The short route fade still respects reduced motion; there are no continuous animations or environmental effects over transactional content.

The supplied bird artwork, leaf/water/recycling imagery, activity hues, and working wallet records provide the environmental/product visuals. No unrelated stock photos or invented mascot are added. Native screens use actual product UI rather than website marketing heroes.

Guided by `.agents/skills/design-taste-frontend/SKILL.md`, including its copy, voice, system, layout, sections, cards, and motion references. The user's native-mobile brief takes precedence over its website-specific layouts and scripts.

## Fact sheet and voice

Rikna lets residents earn through verified waste collection and environmental event attendance, then spend at participating shops and on tricycles. The three roles share one session. The app uses clearly labeled configurable sample rates, events, merchants, and claim policies.

Voice: public-service, direct and friendly; “you” for resident actions; short complete instructions; house words Eco-Tokens, pickup code, attendance, Merchant. Errors state the problem and next action. No invented municipal policy or live-service claim.

## Native adaptation

- A single horizontal content system: 24-point gutters, 16-point gaps, 24-point section spacing. The app remains phone-width on desktop previews.
- Manrope 16-point reading text; 13–14-point metadata; 21–30-point section/screen headings; 46–52-point wallet amounts. Labels wrap instead of shrinking. Token amounts use tabular figures.
- Teal `#146375` anchors wallets and primary controls. Green `#3C8D70`, leaf `#99CB5B`, lime `#D4EA50`, and cream `#F5EFB3` remain palette tokens. Dark ink provides legible text over lime and cream; white text sits on teal. Success uses a darker accessible green.
- `Screen`, `Card`, `Button`, `ListItem`, `Detail`, `Badge`, and `Field` make one reusable system. Both shop and tricycle wallets render the same Merchant layout and transaction records.
- Native ScrollViews, safe areas, keyboard avoidance, flexible text, and at least 44-point control targets replace browser grids, fixed viewport sections, hover-only actions, and site navigation.
- No auto-playing decorations or scroll effects. Press feedback and a short native route fade answer actions. Reduced-motion preferences disable route animation. Confirmation status is visible immediately; the simulated SMS follows in a separate block.
- The user explicitly requires labeled sample content; that overrides the website skill's ban on sample labels.
- The Resident screen places balance first, events next, then partner shops. Pickup, attendance, and payment controls sit near the wallet.
- Official screens separate record lookup/review from confirmation. Attendance displays each explicit state. The confirmation screen prioritizes status, amount, recipient, and reference.
- Merchant screens place received tokens before customer history and claim information. Sample cash is separated and labeled.

## Artwork

`assets/rikna-logo.png` is the user's supplied `rikna logo.png`, copied unchanged. It appears on the welcome screen and in the shared app header and is used in Expo app metadata. It is never used behind QR codes or payment information. A separate mascot file has not been supplied; no replacement mascot was invented. Once supplied, it can appear on the welcome/reward screen without changing the wallet layout. No external photographs or third-party product logos are used.

## Website-only skill requirements

HTML hero dealing, 100vh section rhythm, CSS kit mounting, web shaders, scroll moments, site footers, contact forms, canonical/share-image marketing metadata, and web-page performance scores do not describe native app screens. They are not represented as native acceptance passes. The skill gate is attempted against the optional web preview; its exact outcome is reported in REPORT.md independently from the mobile acceptance tests.
