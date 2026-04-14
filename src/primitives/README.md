# BIGMAMA$ Primitives

Reusable, dependency-light component primitives for the civic-reporting app.
Import from the barrel:

```jsx
import { CardItem, Toggle, StatDisplay, Badge, IconAvatar,
         SecondaryButton, CardHeader, FormSection } from '@/primitives';
```

All primitives are functional components compatible with React 19, expose
`forwardRef`, pass through `className` / `style`, and ship with CSS classes
(`bm-*`) defined in [`primitives.css`](./primitives.css). Styles are
tokenized via CSS variables so the theme layer can swap palettes without
touching component code.

## Design conventions

- **Dependencies**: `react`, `clsx`, and (where relevant) `lucide-react`
  icons passed as props. No new npm deps introduced.
- **Accent prop**: interactive/tinted primitives accept
  `accent="cyan" | "magenta" | "green"` or any raw CSS color string. The
  accent is applied via a `--bm-accent` CSS custom property so callers can
  override from outside without forking.
- **Accessibility**: every interactive primitive is focusable, keyboard
  operable, and exposes appropriate ARIA attributes. Icon-only buttons
  require an `aria-label` / `label` prop.
- **Motion**: transitions respect `prefers-reduced-motion: reduce`.
- **Inline styles**: used only for dynamic values. Everything else lives in
  `primitives.css`.

## Tokens referenced

The CSS references the following custom properties. Missing tokens fall
back to sensible defaults so primitives render in isolation; the
integration agent should backfill these in `src/styles/tokens.css`.

| Token | Fallback |
| --- | --- |
| `--color-accent-cyan` | `#00f2ff` |
| `--color-accent-magenta` | `#ff007a` |
| `--color-accent-green` | `#22e584` |
| `--color-accent-amber` | `#ffb020` (used by Badge warning) |
| `--color-text-dim` | `#a0a0a0` |
| `--color-border-subtle` | `rgba(255,255,255,0.05)` |
| `--color-border-hover` | `rgba(255,255,255,0.12)` |
| `--color-surface-glass` | `rgba(255,255,255,0.02)` |
| `--radius-md` | `16px` (CardItem) / `10px` (SecondaryButton) |
| `--space-md` | — currently unused; reserved for future spacing scale |
| `--transition-speed` | `0.3s` (already defined in `tokens.css`) |

> **Unresolved / to be added**: `--color-accent-amber`,
> `--color-text-dim`, `--color-border-subtle`, `--color-border-hover`,
> `--color-surface-glass`, `--color-accent-cyan`, `--color-accent-magenta`,
> `--color-accent-green`, `--radius-md`, `--space-md`. The current
> `tokens.css` only defines brand/gradient colors, so these primitives will
> look correct out-of-the-box thanks to fallbacks and should be promoted
> to real tokens during integration.

---

## CardItem

Translucent panel chrome (padding, radius, subtle background + border).

```jsx
import { CardItem } from '@/primitives';

<CardItem padding="md">
  <p>Plain card body.</p>
</CardItem>

<CardItem accent="cyan" padding="md" onClick={handleOpen}>
  Clickable, cyan-tinted, keyboard focusable.
</CardItem>

<CardItem as="article" padding="lg" className="feed-item">
  {/* ... */}
</CardItem>
```

Props: `padding` (`sm|md|lg|none`, default `md`), `accent`, `interactive`,
`as` (defaults to `div`), `onClick`, `className`, `style`.

## Toggle

Accessible on/off switch (`role="switch"`, Space/Enter toggle).

```jsx
import { Toggle } from '@/primitives';

// Bare switch (provide aria-label)
<Toggle active={isOn} onChange={setIsOn} aria-label="Dark mode" />

// Labeled row
<Toggle
  active={isAnonymous}
  onChange={setIsAnonymous}
  label="Anonymous mode"
  description="Hide your identity from authorities."
  accent="magenta"
/>
```

Props: `active` (bool, required), `onChange(next)` (required), `label`,
`description`, `accent`, `size` (`sm|md`), `disabled`.

## StatDisplay

Label + big value + optional trend / subtext / icon.

```jsx
import { StatDisplay } from '@/primitives';
import { Activity } from 'lucide-react';

<StatDisplay label="Reports" value="1,247" trend="+12%" accent="cyan" />

<StatDisplay
  label="Active Users"
  value="8,421"
  icon={Activity}
  accent="green"
  size="lg"
/>
```

Props: `label`, `value`, `subtext`, `trend`, `icon`, `accent`, `size`
(`sm|md|lg`), `as` (`dl|div|article`, default `dl`).

## Badge

Inline colored tag / pill.

```jsx
import { Badge } from '@/primitives';
import { Check } from 'lucide-react';

<Badge>Verified</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="success" tone="solid" icon={Check}>Approved</Badge>
<Badge accent="#ff007a" tone="outline">Custom</Badge>
```

Props: `variant` (`default|success|warning|danger|info|neutral`, default
`default`), `tone` (`soft|solid|outline`, default `soft`), `accent`,
`icon`.

## IconAvatar

Icon in a colored rounded square. Defaults to 40x40 with a 20px glyph.

```jsx
import { IconAvatar } from '@/primitives';
import { Shield } from 'lucide-react';

<IconAvatar icon={Shield} accent="green" />
<IconAvatar icon={Shield} accent="cyan" size={48} ring />
<IconAvatar icon={Shield} muted label="Locked" />
```

Props: `icon` (lucide component, required), `size` (default `40`),
`iconSize`, `accent`, `ring`, `muted`, `label` (adds role=img for
decorative-but-named avatars).

## SecondaryButton

Ghost / outline toolbar button for non-primary actions.

```jsx
import { SecondaryButton } from '@/primitives';
import { Filter, ChevronDown } from 'lucide-react';

<SecondaryButton icon={Filter} onClick={openFilters}>Filter</SecondaryButton>

<SecondaryButton
  icon={Filter}
  trailingIcon={ChevronDown}
  size="sm"
  accent="cyan"
>
  Sort
</SecondaryButton>

{/* Icon-only — aria-label is required */}
<SecondaryButton icon={Filter} ariaLabel="Filter" />
```

Props: `icon`, `trailingIcon`, `size` (`sm|md|lg`), `accent`, `disabled`,
`type` (`button|submit|reset`, default `button`), `ariaLabel`.

## CardHeader

Title (+ optional subtitle) on the left, action buttons on the right.

```jsx
import { CardHeader } from '@/primitives';
import { Filter, Download } from 'lucide-react';

<CardHeader
  title="Recent Incidents"
  actions={[
    { icon: Filter, onClick: openFilters, label: 'Filter' },
    { icon: Download, onClick: exportData, label: 'Export' },
  ]}
/>

{/* Subtitle + leading icon */}
<CardHeader
  title="Privacy"
  subtitle="How your data is handled"
  icon={Filter}
/>

{/* Custom actions slot */}
<CardHeader
  title="Settings"
  actionsSlot={<SecondaryButton>Save</SecondaryButton>}
/>
```

Props: `title` (required), `subtitle`, `actions` (array of
`{ icon, onClick, label, key?, disabled? }` — `label` becomes the
aria-label/title on the icon button), `actionsSlot` (takes precedence
over `actions`), `icon`, `as` (`h2|h3|h4|div`, default `h3`).

## FormSection

Label + helper/error text wrapper for a single form control. Does not
render the control — it clones the child to inject
`id`/`aria-describedby`/`aria-invalid`/`aria-required`.

```jsx
import { FormSection } from '@/primitives';

<FormSection label="Incident Title" required error={errors.title}>
  <input
    type="text"
    value={title}
    onChange={e => setTitle(e.target.value)}
  />
</FormSection>

<FormSection
  label="Description"
  hint="Up to 500 characters"
  labelAside={`${desc.length}/500`}
>
  <textarea value={desc} onChange={e => setDesc(e.target.value)} />
</FormSection>
```

Props: `label` (required), `children` (exactly one element, required),
`hint`, `error`, `required`, `id`, `labelAside`.
