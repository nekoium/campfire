# Campfire Design Language

> Status: reference synthesis recorded; first-screen UX and final tokens remain pending product confirmation.

## Design Intent

Campfire should feel like a living shared place rather than a crypto dashboard.

The visual language combines:

- hiyo's soft, atmospheric, social warmth
- the botanical references' sense of place, cultivated environment, and editorial composition
- a functional product layer that keeps tasks, credits, membership, and wallet actions clear

The emotional target is **quiet mutuality**: a community noticeboard in a warm shared space, where invisible contributions become visible without becoming gamified or financialized.

## Reference Sources

- `C:\Users\Ashless\Downloads\UX Design Ref\hiyo.png`
- `C:\Users\Ashless\Downloads\UX Design Ref\Core Atelier Pilates.png`
- `C:\Users\Ashless\Downloads\UX Design Ref\NORMAL IS BORING.jpg`

These are art-direction references. They should guide atmosphere, image treatment, palette, and composition rather than be copied as literal page structures.

## Visual Principles

### 1. Atmosphere before crypto

The first impression should communicate warmth, place, and people. Avoid neon, dark trading-terminal conventions, speculative charts, coin logos, and aggressive Web3 language.

### 2. Nature is contextual

Botanical imagery should show plants as part of a shared environment: a room, garden, workshop, street, courtyard, or event space. Avoid generic leaf icons, isolated stock cutouts, and decorative botanical borders.

### 3. Editorial composition, usable product

Use generous space, strong image-led focal areas, and a small number of deliberate typographic gestures. Keep functional controls conventional and scannable. Expressiveness belongs in the community identity/header and featured contribution surfaces, not in every button.

### 4. Tactile but not ornamental

Surfaces may suggest paper, textile, plaster, foliage, or warm light through real imagery and restrained color. Do not use decorative glassmorphism, gradients, grain filters, or ornamental blobs as substitutes for meaningful content.

### 5. Contribution over status

The visual hierarchy should make requests, offers, completed work, and mutual exchange more prominent than rankings, holdings, or speculative value.

## Color Direction

### Strategy

**Restrained product palette with a committed atmospheric community header.**

The product UI should use a calm neutral base, one botanical green accent, one warm clay/peach accent, and a deep blue-green ink. Color should communicate state and community context, not decorate every surface.

### Provisional roles

These are direction seeds, not final accessibility-approved tokens:

```css
:root {
  /* surfaces */
  --color-surface: #f6f3ec;
  --color-surface-raised: #fbfaf6;
  --color-surface-warm: #e8c8b7;
  --color-surface-lilac: #d8d4df;

  /* ink */
  --color-ink: #18383a;
  --color-ink-soft: #536365;
  --color-ink-inverse: #fffaf2;

  /* accents */
  --color-botanical: #5d765d;
  --color-clay: #c58f79;
  --color-sun: #d6ad6b;
  --color-sky: #6b8fa1;

  /* semantic states */
  --color-success: #47735d;
  --color-warning: #a26e3f;
  --color-danger: #9a514f;
  --color-info: #4d7180;
}
```

Use OKLCH tokens in implementation after contrast checks. The final palette must meet WCAG AA for body text and controls.

### Color behavior

- Deep blue-green ink anchors the interface and avoids an all-beige reading experience.
- Botanical green identifies care, contribution, and shared environment.
- Clay/peach marks warmth, human presence, and community moments.
- Muted lilac and blue-gray can support secondary surfaces and seasonal imagery.
- Warm neutrals should support imagery, not dominate the entire interface.
- Semantic colors remain reserved for success, warning, error, and transaction states.

## Typography Direction

### Product UI

Use one highly legible sans-serif family for navigation, labels, task data, balances, forms, and wallet states. Product typography must remain familiar and readable.

Suggested role:

```css
--font-ui: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Expressive layer

A restrained serif or editorial face may be used for:

- Campfire wordmark
- community names
- featured contribution titles
- short reflective copy

Do not use the expressive face for buttons, form labels, balances, status text, or dense task lists.

### Typographic behavior

- Prefer lowercase or sentence case for warmth; reserve uppercase for compact status labels.
- Avoid excessive letter spacing and tiny low-contrast labels.
- Keep UI headings on a fixed product scale rather than hero-scale fluid type.
- Use display type as an identity signal, not as a generic decoration.

## Imagery Direction

### Primary image roles

- community environment: a room, garden, shared workspace, street, or event setting
- contribution in context: someone teaching, repairing, hosting, tending, or preparing
- seasonal atmosphere: soft light, foliage, tables, materials, and traces of use
- community identity: one memorable image for the active community rather than a generic crypto illustration

### Presentation

- Use full-bleed or generously framed environmental imagery for the community header.
- Prefer real, contextual photographs over isolated stock objects.
- Use calm crops with enough negative space for readable overlay copy.
- Let plants and materials establish place, continuity, and care.
- Use overlays only when needed for contrast; never obscure the meaningful subject.

### Asset policy

The supplied reference images remain visual references unless licensed for redistribution. The implementation should use project-owned, generated, or appropriately licensed imagery for the public demo.

## Composition

### Community header

A wide atmospheric community header may use:

- a contextual botanical/environmental image
- a quiet identity label
- community name in expressive type
- one clear orientation cue into the activity board

The image should establish a shared place without turning the app into a marketing landing page.

### Activity board

The operational surface should be a calm, structured board:

- prominent offers and requests
- visible credit amount as a local unit, not an external price
- clear task status
- contributor/requester identity
- one obvious next action
- contribution history close enough to explain trust without becoming a leaderboard

Use repeated task rows or modest individual panels. Avoid nested cards and identical card grids.

### Peripheral navigation

Navigation should remain quiet and predictable. Wallet state, community identity, activity, and history can sit in a compact top bar or side rail depending on the first-screen decision.

## Interaction Language

- Primary actions use familiar text plus an appropriate icon when useful.
- Wallet connection is explicit and never disguised as a generic login.
- Every transaction has idle, pending, success, failure, and rejected states.
- The UI distinguishes a local credit movement from a MON gas payment.
- On-chain actions explain what will change before opening the wallet.
- Expiry should be presented as a visible system rule: `expires in ...` or `eligible for revocation`, not as a surprise deletion.
- Avoid financial language such as `price`, `profit`, `yield`, `market cap`, or `investment` for local credits.
- Prefer `offer`, `request`, `contribution`, `credit`, `shared work`, `claim`, and `complete`.

## Motion

Motion should communicate state and continuity:

- gentle status transition when a task moves from open to claimed to complete
- brief confirmation when credits are issued or transferred
- calm reveal for activity history updates
- no floating coins, token bursts, speculative ticker motion, or decorative page-load choreography
- support `prefers-reduced-motion`

## Shape and Material

- Use mostly rectangular editorial surfaces with small, deliberate corner radii.
- Reserve pill shapes for compact status tags and a primary CTA where appropriate.
- Avoid making every component a rounded capsule.
- Use borders or very small shadows, not both as decoration.
- Avoid nested cards.
- Real image texture is preferred over generated CSS texture.

## Accessibility and Product Constraints

- Body text and controls must meet WCAG AA contrast.
- Status must not rely on color alone.
- All wallet and transaction states need text explanations.
- The app must remain usable with the supplied imagery removed or blocked.
- Mobile layout must preserve task identity, amount, status, and action without overflow.
- Community copy and user-generated text may be long; containers must handle wrapping safely.

## Deliberate Anti-Goals

Campfire should not resemble:

- a crypto exchange
- a DAO treasury dashboard
- a generic SaaS admin template
- a neon Web3 landing page
- a gamified points leaderboard
- a wellness brand that hides the actual task workflow
- a botanical catalog detached from people and place

## Confirmed UX Direction

### Feature summary

Campfire opens as an introductory community page for a mutual-aid group of young and innovative people living close together, holding workshops, activities, discussions, and shared projects. The page should invite people into the active board rather than immediately presenting a transaction dashboard.

The community is not defined primarily by geography. Its shared space is physical, but its identity comes from mutual support, experimentation, and the exchange of ideas and useful work.

### Primary user action

The first meaningful action is:

> Enter the community board and discover one useful way to offer help or request help.

The wallet connection should be available without dominating the introduction. The user should understand the community's atmosphere and purpose before seeing chain mechanics.

### First-screen composition

The first screen is a community home / introduction with:

- an atmospheric environmental hero image
- the Campfire community name and a short statement of purpose
- a visible invitation into the mutual-aid board
- a compact indication that contributions are recorded on Monad Testnet
- quiet navigation to activity, contributions, and wallet state

The first screen should feel like entering a shared place, not opening a financial instrument.

The board is the next destination. It should expose offers, requests, contribution history, and local credits in a structured product layout.

### Demo roles and chain behavior

The online demo should support several wallet accounts. The intended live demonstration uses at least two roles:

- **requester / host**: creates an offer or request and approves completion
- **contributor / member**: claims work, submits completion, receives local credits, and can transfer credits to another member

The demo must connect to Monad Testnet through Rabby, execute real contract reads and writes, and show clear transaction states. The contract address and explorer link should be discoverable from the interface or demo documentation.

The prototype may include seeded visible activity for atmosphere, but the central successful flow must be real on-chain activity rather than simulated state.

### Image strategy

The supplied references are art direction only. They should not be redistributed as product assets unless their licensing permits it.

Use a project-owned or appropriately licensed environmental image for the hero. A generated bitmap image is acceptable if it communicates a shared interior, communal garden, workshop, or gathering space with botanical life. A simple vector mark may support the wordmark or small identity details, but the main hero should use a real or generated bitmap/environmental image rather than a generic vector illustration.

### Interaction states

The UX must visibly distinguish:

- disconnected wallet
- connected member
- connected non-member
- wrong network
- pending wallet approval
- pending chain confirmation
- successful task state change
- failed or rejected transaction
- local credit balance
- gas payment in MON versus internal Campfire credits
- credit balance approaching expiry
- expired balance eligible for permissionless revocation

### Scope

- **Fidelity:** high-fidelity hackathon prototype
- **Breadth:** introductory home, mutual-aid board, task detail/action flow, contribution history, wallet/transaction states
- **Interactivity:** real online app connected to Monad Testnet
- **Time intent:** complete the smallest reliable end-to-end flow first, then polish the atmosphere and responsive layout


## Future Design Extensions

Later use-case explorations may include:

- shared-space maintenance
- hosting a community activity
- teaching and skill exchange
- event setup and cleanup
- neighborhood mutual aid
- inter-community collaboration
- a visual archive of otherwise invisible labor
