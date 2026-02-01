# Check Pages - Design System

Version: 2.0.0
Last Updated: 2026-01-29

## Overview

This design system defines the visual language, components, and interaction patterns for the Check Pages URL monitoring dashboard. The system features a fresh, clean blue color scheme that prioritizes clarity, accessibility, and consistency across all interfaces.

## Design Principles

1. **Clarity First** - Information should be immediately scannable
2. **Status Awareness** - Use color semantically to convey system state
3. **Progressive Disclosure** - Show essential info first, details on demand
4. **Keyboard-Friendly** - All actions accessible via keyboard
5. **Responsive** - Adapt gracefully from mobile to desktop

---

## Design Tokens

### Colors

#### Semantic Colors
```css
--bg: #f8fafc           /* Primary background - Slate 50 */
--panel: #ffffff        /* Card/panel background - White */
--text: #0f172a         /* Primary text - Slate 900 */
--muted: #64748b        /* Secondary text - Slate 500 */
--border: #e2e8f0       /* Borders and dividers - Slate 200 */

/* Status Colors */
--success: #10b981      /* OK status, positive actions - Emerald 500 */
--error: #ef4444        /* Error status, destructive actions - Red 500 */
--warn: #f59e0b         /* Warning status - Amber 500 */
--change: #8b5cf6       /* Changed status, highlights - Violet 500 */

/* Brand Colors - Fresh Sky Blue */
--primary: #0ea5e9      /* Primary actions, links - Sky 500 */
--primary-hover: #0284c7 /* Hover states - Sky 600 */
--primary-weak: #38bdf8 /* Lighter variant - Sky 400 */
--primary-light: #e0f2fe /* Background tints - Sky 50 */
--info: #0ea5e9         /* Informational elements - Sky 500 */
```

#### Color Usage Rules
- **Success (Emerald Green)**: Successful checks, positive confirmations
- **Error (Red)**: Failed checks, destructive actions, critical alerts
- **Warning (Amber)**: Warnings, non-critical issues
- **Change (Violet)**: Content changes detected, highlight information
- **Primary (Sky Blue)**: Primary actions, links, focused states - creates a fresh, modern, and trustworthy feel

### Typography

#### Font Family
```css
Primary: 'Space Grotesk', 'Inter', system-ui
Monospace: ui-monospace, 'SF Mono', Menlo, Monaco, Consolas
```

#### Font Scales
```css
--font-xs: 11px     /* Badges, micro text */
--font-sm: 12px     /* Secondary info, labels */
--font-base: 14px   /* Body text, table cells */
--font-md: 16px     /* Section headers */
--font-lg: 18px     /* Page headers */
--font-xl: 28px     /* KPI values */
```

#### Font Weights
```css
--weight-normal: 400
--weight-medium: 500
--weight-semibold: 600
--weight-bold: 700
```

### Spacing Scale

```css
--space-1: 4px
--space-2: 6px
--space-3: 8px
--space-4: 10px
--space-5: 12px
--space-6: 16px
--space-7: 20px
--space-8: 24px
--space-10: 32px
--space-12: 48px
--space-16: 64px
```

### Border Radius

```css
--radius-sm: 6px      /* Small elements (tags) */
--radius-base: 10px   /* Buttons, inputs */
--radius-lg: 12px     /* Pills, badges */
--radius-xl: 16px     /* Cards */
```

### Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.25);
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.35);
```

---

## Layout System

### Breakpoints

```css
--breakpoint-sm: 640px   /* Mobile landscape */
--breakpoint-md: 768px   /* Tablet */
--breakpoint-lg: 1024px  /* Desktop */
--breakpoint-xl: 1280px  /* Large desktop */
--breakpoint-2xl: 1536px /* Extra large */
```

### Grid System

#### Main Layout
- **Desktop (≥768px)**: Sidebar (240px) + Content (1fr)
- **Mobile (<768px)**: Stacked layout with drawer sidebar

#### Content Grid
```css
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.split {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}
```

### Responsive Patterns

#### Table → Cards (Mobile)
On screens <768px, data tables transform into card-based layouts:
- Hide table headers
- Display rows as individual cards
- Show labels inline with data

#### Sidebar → Drawer (Mobile)
- Fixed sidebar slides in from left
- Overlay with backdrop
- Close on outside click or navigation

---

## Components

### Buttons

#### Primary Button
```tsx
<button className="button">
  <Icon size={16} />
  Label Text
</button>
```
- Background: Sky 500 `#0ea5e9`
- Hover: Sky 600 `#0284c7` with lift effect
- Text: White `#ffffff`
- Padding: 10px 16px
- Border radius: 8px
- Font weight: 500
- Shadow: Subtle sky-tinted shadow

#### Ghost Button
```tsx
<button className="button ghost">
  <Icon size={16} />
  Label Text
</button>
```
- Background: `rgba(255, 255, 255, 0.05)`
- Border: 1px solid `var(--border)`
- Color: `var(--text)`

#### Danger Button
```tsx
<button className="badge danger">
  <Trash2 size={12} />
</button>
```
- Color: `var(--error)`
- Border: `rgba(239, 68, 68, 0.3)`

### Status Pills

```tsx
<StatusPill status="ok" />      // Green
<StatusPill status="error" />   // Red
<StatusPill status="changed" /> // Purple
<StatusPill status="warn" />    // Orange
```

#### Structure
- Icon (dot or symbol) + Text label
- Padding: 4px 10px
- Border radius: 12px
- Semi-transparent background matching status color

### Cards

```tsx
<div className="card">
  <h3>Card Title</h3>
  <div className="value">Card Content</div>
</div>
```

- Border: 1px solid `var(--border)`
- Border radius: 16px
- Padding: 16px
- Background: `var(--panel)`
- Shadow: `var(--shadow-lg)`

#### Highlight Card
Add `.highlight` class for gradient background:
```css
background: linear-gradient(135deg, rgba(47, 111, 237, 0.14), rgba(168, 85, 247, 0.08));
```

### Tags

```tsx
<span className="tag">Tag Label</span>
```

- Padding: 4px 8px
- Border radius: 8px
- Border: 1px solid `var(--border)`
- Background: `rgba(255, 255, 255, 0.03)`
- Font size: 12px

### Badges

```tsx
<span className="badge">Badge Text</span>
```

- Padding: 4px 8px
- Border radius: 10px
- Background: `rgba(255, 255, 255, 0.06)`
- Clickable variant: Add hover states

### Input Fields

```tsx
<input
  type="text"
  placeholder="Placeholder text"
  style={{
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "var(--text)"
  }}
/>
```

#### Search Input
- Icon positioned absolute at left
- Input padding-left: 36px to accommodate icon

### Tables

#### Desktop View
```tsx
<table className="table">
  <thead>
    <tr>
      <th>Column Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell Data</td>
    </tr>
  </tbody>
</table>
```

#### Styles
- Border-collapse: collapse
- Cell padding: 12px 10px
- Border-bottom: 1px solid `var(--border)`
- Header color: `var(--muted)`

### Dropdown Menus

```tsx
<DropdownMenu trigger={<MoreVertical size={18} />}>
  <DropdownItem icon={<ExternalLink size={16} />} onClick={handleView}>
    詳細を見る
  </DropdownItem>
  <DropdownItem icon={<Edit2 size={16} />} onClick={handleEdit}>
    編集
  </DropdownItem>
  <DropdownDivider />
  <DropdownItem icon={<Trash2 size={16} />} onClick={handleDelete} danger>
    削除
  </DropdownItem>
</DropdownMenu>
```

#### Features
- Positioned relative to trigger button
- Auto-closes on outside click or Escape key
- Fade-in animation (150ms)
- Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
- Min-width: 180px
- Danger items styled with error color

#### Alignment
- `align="right"` (default): Menu aligned to right edge
- `align="left"`: Menu aligned to left edge

### Modals

#### Structure
- Backdrop: Semi-transparent overlay with blur
- Modal: Centered card with increased shadow
- Header: Title with bottom border
- Close button: Top-right corner
- Footer: Actions with top border, right-aligned

#### Implementation Pattern
```tsx
{isOpen && (
  <>
    <div className="modal-backdrop" onClick={onClose} />
    <div className="modal">
      <div className="modal-header">
        <h2>Modal Title</h2>
        <button onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        {/* Content */}
      </div>
      <div className="modal-footer">
        <button className="button ghost" onClick={onClose}>
          キャンセル
        </button>
        <button className="button" onClick={onSubmit}>
          保存
        </button>
      </div>
    </div>
  </>
)}
```

### Toast Notifications

#### Toast Component (To Implement)
```tsx
<div className={`toast ${type}`}>
  <Icon />
  <span>{message}</span>
  <button>×</button>
</div>
```

#### Position & Animation
- Fixed position: top-right
- Enter animation: Slide down + fade in (300ms)
- Exit animation: Fade out (200ms)
- Auto-dismiss: 5 seconds
- Stack vertically with 8px gap

---

## Interaction Patterns

### Loading States

#### Button Loading
```tsx
<button disabled={loading}>
  {loading ? <span className="spinner" /> : "Action"}
</button>
```

#### Spinner Animation
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

#### Skeleton Screens
For data loading, show skeleton placeholders:
- Animated shimmer effect
- Match final content dimensions
- Gray background with subtle pulse

### Hover States

#### Interactive Elements
```css
/* Links */
a:hover {
  color: var(--primary);
}

/* Buttons */
.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* Cards (when clickable) */
.card:hover {
  border-color: var(--primary-weak);
}

/* Table Rows */
tr:hover {
  background: rgba(255, 255, 255, 0.02);
}
```

### Focus States

#### Keyboard Navigation
```css
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* For dark elements */
.button:focus-visible {
  outline-color: var(--primary-weak);
}
```

### Transitions

#### Standard Duration
```css
--transition-fast: 150ms
--transition-base: 200ms
--transition-slow: 300ms
```

#### Easing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
```

---

## Accessibility Guidelines

### Color Contrast

All text must meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum
- Large text (≥18px): 3:1 minimum
- Interactive elements: 3:1 minimum

### Keyboard Navigation

#### Tab Order
- Follows logical reading order (left-to-right, top-to-bottom)
- Skip links provided for main content
- Focus indicators clearly visible

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `/` or `Cmd/Ctrl+K` | Focus search |
| `Esc` | Close modal/drawer |
| `Enter` | Activate focused element |
| `Space` | Toggle checkbox/button |
| `Tab` | Next focusable element |
| `Shift+Tab` | Previous focusable element |

### ARIA Labels

#### Required Attributes
```tsx
// Icon-only buttons
<button aria-label="削除">
  <Trash2 size={16} />
</button>

// Status indicators
<div role="status" aria-live="polite">
  Loading...
</div>

// Modals
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Modal Title</h2>
</div>
```

### Screen Reader Support

#### Semantic HTML
- Use `<button>` for actions, not `<div onClick>`
- Use `<a>` for navigation, not `<span onClick>`
- Use proper heading hierarchy (`h1` → `h2` → `h3`)
- Use `<table>` for tabular data with `<thead>` and `<tbody>`

#### Live Regions
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

---

## Responsive Behavior

### Mobile-First Approach

#### Breakpoint Strategy
```css
/* Base styles: Mobile (320px - 767px) */
.component { }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .component { }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .component { }
}
```

### Touch Targets

#### Minimum Size
- Touch targets: 44×44px minimum
- Spacing between targets: 8px minimum

#### Mobile Interactions
```tsx
// Swipe to delete (optional enhancement)
<div className="swipeable-row">
  <div className="swipe-action delete">
    <Trash2 />
  </div>
  <div className="row-content">
    {/* Row content */}
  </div>
</div>
```

---

## Component Library Structure

### File Organization
```
apps/web/app/
├── components/
│   ├── ui/              # Base UI components
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   ├── spinner.tsx
│   │   └── dropdown-menu.tsx
│   ├── status-pill.tsx  # Domain components
│   ├── timeline.tsx
│   └── kpi-card.tsx
├── styles/
│   ├── globals.css      # Design tokens + base styles
│   ├── utilities.css    # Utility classes
│   └── responsive.css   # Media queries
└── hooks/
    ├── useKeyboardShortcuts.ts
    ├── useToast.ts
    └── useMediaQuery.ts
```

### Naming Conventions

#### CSS Classes
- Use kebab-case: `.status-pill`, `.kpi-card`
- BEM for variants: `.button--primary`, `.card--highlight`
- Utility prefixes: `.flex`, `.grid`, `.text-muted`

#### Components
- PascalCase: `StatusPill`, `KpiCard`
- Prop types: `ButtonProps`, `ModalProps`

---

## Animation Guidelines

### Micro-interactions

#### Button Press
```css
.button:active {
  transform: scale(0.98);
}
```

#### Card Hover
```css
.card {
  transition: border-color 200ms ease, transform 200ms ease;
}

.card:hover {
  border-color: var(--primary-weak);
  transform: translateY(-2px);
}
```

#### Modal Enter/Exit
```css
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal {
  animation: modalFadeIn 300ms ease;
}
```

### Performance Considerations

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Add `will-change` sparingly for complex animations
- Respect `prefers-reduced-motion` media query

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark Theme Specifics

### Background Layers
1. **Base layer**: `--bg` (#0c1015) with radial gradient overlay
2. **Panel layer**: `--panel` (#131a21) for cards
3. **Elevated layer**: Panel + subtle border/shadow

### Opacity System
```css
--overlay-light: rgba(255, 255, 255, 0.02)  /* Subtle hover */
--overlay-base: rgba(255, 255, 255, 0.05)   /* Buttons */
--overlay-strong: rgba(255, 255, 255, 0.1)  /* Active states */
```

---

## Future Enhancements

### Planned Components
- [ ] Data visualization charts (response time trends)
- [ ] Diff viewer (side-by-side HTML comparison)
- [ ] Screenshot comparison slider
- [ ] Notification settings panel
- [ ] User avatar with dropdown menu
- [ ] Command palette (Cmd+K)

### Planned Features
- [ ] Light theme support
- [ ] Custom theme builder
- [ ] Component playground/storybook
- [ ] Animation presets
- [ ] Icon library documentation

---

## Resources

### Design Tools
- Figma: [Link to design files]
- Color contrast checker: https://webaim.org/resources/contrastchecker/
- Accessibility guidelines: https://www.w3.org/WAI/WCAG21/quickref/

### Development
- React: https://react.dev/
- Next.js: https://nextjs.org/docs
- Lucide Icons: https://lucide.dev/

---

**Maintained by**: Check Pages Team
**Questions?**: [GitHub Issues](https://github.com/anthropics/claude-code/issues)
