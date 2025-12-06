# ConductOS Design System

**Version 1.0.0** | Last Updated: December 2025

A comprehensive design system for building empathetic, trauma-informed workplace safety interfaces.

---

## 🎨 Philosophy

Our design system is built on these core principles:

1. **Empathy First**: Every design decision prioritizes user emotional safety
2. **Warm, Not Corporate**: Approachable tones over cold, intimidating interfaces
3. **Consistent**: Predictable patterns reduce cognitive load
4. **Accessible**: WCAG 2.1 AA compliant, supports all abilities
5. **Role-Aware**: Subtle visual cues for different user contexts

---

## 🎯 Quick Start

### Installation

Design tokens are already configured in `tailwind.config.js`. Simply import components:

```jsx
import { Button, Card, Input, Badge } from '@/components/design-system';
import AppLayout from '@/components/design-system/AppLayout';

function MyPage() {
  return (
    <AppLayout>
      <AppLayout.Container>
        <Card>
          <Card.Header>Welcome</Card.Header>
          <Card.Body>
            <Input label="Email" type="email" />
            <Button variant="primary">Submit</Button>
          </Card.Body>
        </Card>
      </AppLayout.Container>
    </AppLayout>
  );
}
```

---

## 🎨 Color System

### Role-Specific Accents

Each user role has a unique accent color for familiarity and context:

| Role | Color | Tailwind Class | Use Case |
|------|-------|----------------|----------|
| **Employee** | Soft Blue | `primary-500` to `primary-700` | Approachable, trustworthy |
| **IC Member** | Teal/Green | `accent-500` to `accent-700` | Professional, balanced |
| **HR Admin** | Indigo | `admin-500` to `admin-700` | Authoritative, sophisticated |

```jsx
// Automatically adapts to user role
<Button variant="primary" role="employee">Employee Action</Button>
<Button variant="primary" role="ic">IC Action</Button>
<Button variant="primary" role="admin">Admin Action</Button>
```

### Base Colors (Shared)

**Warm Grays** - Used across all roles for neutrality:
```
warm-50  → Backgrounds (lightest)
warm-200 → Borders, dividers
warm-600 → Body text
warm-900 → Headings (darkest)
```

### Semantic Colors

| Purpose | Color | Example |
|---------|-------|---------|
| Success | `success-500` | "Case resolved" |
| Warning | `warning-500` | "Deadline approaching" |
| Danger | `danger-500` | "Error in submission" |
| Info | `info-500` | "New message received" |
| Safe | `safe` (green) | "🔒 Confidential" badges |

---

## 📝 Typography

### Type Scale

We use a modular scale for predictable, harmonious sizing:

```jsx
className="text-display-lg"  // 56px - Hero headlines
className="text-display-md"  // 48px - Major sections
className="text-display-sm"  // 36px - Page titles

className="text-h1"          // 32px - Main headings
className="text-h2"          // 24px - Section headings
className="text-h3"          // 20px - Subsection headings

className="text-body-lg"     // 18px - Prominent text
className="text-body"        // 16px - Default body (1rem)
className="text-body-sm"     // 14px - Small text

className="text-caption"     // 12px - Captions, metadata
```

### Font Family

- **Primary**: Inter (clean, readable, professional)
- **Fallback**: System fonts for performance

```css
font-family: Inter, system-ui, -apple-system, sans-serif;
```

### Best Practices

- **Line height**: Generous (1.5 for body, 1.25 for headings)
- **Letter spacing**: Tighter for large text (-0.02em), normal for body
- **Never use all caps** except for small labels (e.g., "CONFIDENTIAL")

---

## 🧩 Components

### Button

**Variants**: `primary` | `secondary` | `outline` | `ghost` | `danger`
**Sizes**: `sm` | `md` | `lg`

```jsx
<Button variant="primary" size="md">
  Submit Report
</Button>

<Button variant="secondary" icon={<Icon />}>
  Cancel
</Button>

<Button variant="danger" loading>
  Delete Case
</Button>
```

**Role Adaptation**: Primary buttons automatically use role-specific colors.

---

### Card

Container for grouping related content:

```jsx
<Card hover padding="default">
  <Card.Header>Case #2024-001</Card.Header>
  <Card.Body>
    Details about the case...
  </Card.Body>
  <Card.Footer>
    <Button>View Details</Button>
  </Card.Footer>
</Card>
```

**Padding options**: `none` | `sm` | `default` | `lg`

---

### Input

Form input with label, error, and help text:

```jsx
<Input
  label="Email Address"
  type="email"
  placeholder="your.email@company.com"
  error="Invalid email format"
  helpText="We'll never share your email"
  required
/>
```

---

### Badge

Status indicators and labels:

```jsx
<Badge variant="success">Resolved</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
<Badge variant="safe">🔒 Confidential</Badge>
```

---

## 📐 Spacing & Layout

### Spacing Scale

Consistent 4px grid system:

```
gap-4  → 16px (cards, between elements)
gap-6  → 24px (sections)
gap-8  → 32px (major sections)

p-4    → 16px padding
p-6    → 24px padding (default card)
p-8    → 32px padding (large sections)
```

### Layout Containers

```jsx
<AppLayout.Container size="narrow">  {/* 672px - forms */}
<AppLayout.Container size="default"> {/* 1280px - standard */}
<AppLayout.Container size="wide">    {/* 1536px - dashboards */}
```

---

## 🎭 Elevation (Shadows)

Cards use subtle shadows for depth:

```
shadow-sm  → Default cards (subtle)
shadow-md  → Hover state (slightly elevated)
shadow-lg  → Modals, popovers (floating)
```

---

## 🔲 Border Radius

Consistent rounding for warmth:

```
rounded-md  → 8px  - Buttons, inputs
rounded-lg  → 12px - Small cards
rounded-xl  → 16px - Main cards (standard)
rounded-2xl → 24px - Hero sections
```

**Rule**: Use `rounded-xl` for cards by default.

---

## ✨ Animations

Subtle, meaningful motion:

```jsx
className="animate-fade-in"    // Gentle fade
className="animate-slide-up"   // Content appears from below
className="animate-scale-in"   // Modals/popovers
className="animate-pulse-slow" // Loading states
```

**Duration**: 250-300ms (quick, not sluggish)

---

## 🎯 Usage Patterns

### Dashboard Cards

```jsx
<Card hover>
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-h3 text-warm-900">My Cases</h3>
      <p className="text-body-sm text-warm-500">Active reports</p>
    </div>
    <Badge variant="primary">3</Badge>
  </div>
  <div className="space-y-3">
    {cases.map(case => <CaseItem key={case.id} {...case} />)}
  </div>
</Card>
```

### Forms

```jsx
<Card>
  <Card.Header>Report an Incident</Card.Header>
  <Card.Body>
    <form className="space-y-6">
      <Input label="What happened?" type="textarea" required />
      <Input label="When did this occur?" type="date" required />
      <div className="flex gap-4">
        <Button variant="primary" fullWidth>Submit</Button>
        <Button variant="secondary">Save Draft</Button>
      </div>
    </form>
  </Card.Body>
</Card>
```

### Status Indicators

```jsx
<div className="flex items-center gap-2">
  <Badge variant="warning">Under Review</Badge>
  <span className="text-caption text-warm-500">
    23 days remaining
  </span>
</div>
```

---

## ♿ Accessibility

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Focus states use prominent rings (2-3px, role-specific color)
- Skip links for screen readers

### Color Contrast

- Text on warm-50: Use warm-700 or darker (4.5:1 ratio)
- White backgrounds: Use warm-600 or darker
- Never use colored text on colored backgrounds without testing

### ARIA Labels

```jsx
<Button aria-label="Close dialog">
  <XIcon />
</Button>

<Input
  label="Email"
  aria-describedby="email-help"
  aria-invalid={hasError}
/>
```

---

## 🚀 Best Practices

### DO ✅

- Use design system components consistently
- Stick to the spacing scale (gap-4, gap-6, gap-8)
- Use role-aware button variants
- Test with actual user trauma considerations
- Add generous whitespace (reduces anxiety)

### DON'T ❌

- Don't mix custom colors with system colors
- Don't use `px` values directly (use Tailwind classes)
- Don't create one-off components without documenting
- Don't use harsh red for errors (use danger-600, softer)
- Don't use all caps for body text (feels shouty)

---

## 🔄 Future Additions

Components being developed:

- [ ] Textarea
- [ ] Select / Dropdown
- [ ] Checkbox / Radio
- [ ] Modal / Dialog
- [ ] Toast / Notification
- [ ] Tabs
- [ ] Accordion
- [ ] Timeline (for case history)
- [ ] Chat Bubble (for conversational UI)

---

## 📚 Resources

- **Tailwind Config**: `client/tailwind.config.js`
- **Components**: `client/src/components/design-system/`
- **Examples**: `client/src/pages/employee/` (employee portal)

---

## 🤝 Contributing

When adding new components:

1. Follow the existing component structure
2. Include JSDoc documentation
3. Add role-aware styling where applicable
4. Update this document with examples
5. Test with keyboard navigation and screen readers

---

## 📞 Questions?

See existing implementations:
- **Employee Dashboard**: Exemplary use of the design system
- **Landing Hero**: Typography and spacing standards
- **Employee Layout**: Role-specific theming

---

**Built with empathy. Designed for trust. Maintained for consistency.**
