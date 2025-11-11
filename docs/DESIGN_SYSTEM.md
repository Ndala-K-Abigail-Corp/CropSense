# CropSense Design System

## 🎨 Color Palette

### Brand Colors
```css
--cs-primary: #5C913B      /* Primary green - main brand color */
--cs-accent: #8BC34A       /* Accent green - lighter, energetic */
--cs-surface: #F9FAFB      /* Surface - light gray background */
--cs-background: #FFFFFF   /* Background - pure white */
--cs-text: #1B1B1B         /* Text - near black */
```

### Color Scale
```css
/* Primary Scale */
--cs-color-primary-50: #f2fbf4
--cs-color-primary-100: #dff6e6
--cs-color-primary-200: #c6efcf
--cs-color-primary-300: #9fe0a8
--cs-color-primary-400: #7ccd86
--cs-color-primary-500: #5C913B  /* Main */
--cs-color-primary-600: #4a7630
--cs-color-primary-700: #2f6f30

/* Accent/Secondary Scale */
--cs-color-secondary-100: #f1f8e9
--cs-color-secondary-300: #c5e1a5
--cs-color-secondary-500: #8BC34A  /* Accent */

/* Neutral Scale */
--cs-color-neutral-50: #F9FAFB
--cs-color-neutral-100: #f3f4f6
--cs-color-neutral-200: #e5e7eb
--cs-color-neutral-300: #d1d5db
--cs-color-neutral-400: #9ca3af
--cs-color-neutral-500: #6b7280
--cs-color-neutral-700: #374151

/* Status Colors */
--cs-color-success: #43a047
--cs-color-warning: #ffb300
--cs-color-error: #e53935
```

## 📐 Typography

### Font Family
```css
--cs-font-sans: 'Inter', sans-serif
```

### Font Sizes
```css
--cs-font-size-display: 56px  /* Hero headlines */
--cs-font-size-h1: 40px        /* Main headings */
--cs-font-size-h2: 28px        /* Section headings */
--cs-font-size-h3: 20px        /* Subsection headings */
--cs-font-size-body: 16px      /* Body text */
--cs-font-size-small: 14px     /* Small text */
--cs-font-size-caption: 12px   /* Captions */
```

## 📏 Spacing Scale
```css
--cs-spacing-xxs: 4px
--cs-spacing-xs: 8px
--cs-spacing-sm: 12px
--cs-spacing-md: 16px
--cs-spacing-lg: 24px
--cs-spacing-xl: 32px
--cs-spacing-2xl: 48px
--cs-spacing-3xl: 64px
```

## 🔲 Border Radius
```css
--cs-radius-sm: 6px
--cs-radius-md: 8px
--cs-radius-lg: 16px
--cs-radius-pill: 9999px
```

## 🎭 Shadows
```css
--cs-shadow-sm: 0 1px 2px rgba(15, 23, 20, 0.04)
--cs-shadow-md: 0 6px 18px rgba(15, 23, 20, 0.08)
--cs-shadow-lg: 0 12px 30px rgba(15, 23, 20, 0.12)
```

## ⚡ Motion
```css
--cs-motion-duration-fast: 120ms
--cs-motion-duration-medium: 260ms
--cs-motion-duration-slow: 420ms
--cs-motion-easing-standard: cubic-bezier(0.4, 0, 0.2, 1)
```

## 🧩 Component Patterns

### Buttons
```tsx
// Primary button - main actions
<Button variant="primary">
  Get Started
</Button>

// Secondary button - alternative actions
<Button variant="secondary">
  Learn More
</Button>

// Outline button - tertiary actions
<Button variant="outline">
  View Details
</Button>

// Ghost button - minimal actions
<Button variant="ghost">
  Cancel
</Button>
```

### Cards
```tsx
// Feature card with icon
<div className="p-6 lg:p-8 rounded-xl bg-white border border-neutral-200">
  <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(139, 195, 74, 0.1)' }}>
    <Icon />
  </div>
  <h3>Title</h3>
  <p>Description</p>
</div>
```

### Color Usage Guidelines

#### Primary Color (#5C913B)
- Main CTAs and action buttons
- Logo background
- Active states and highlights
- Important icons and badges

#### Accent Color (#8BC34A)
- Secondary CTAs
- Decorative elements
- Hover states
- Background tints (10% opacity)

#### Text Colors
- Primary text: `--cs-text` (#1B1B1B)
- Secondary text: `--cs-color-neutral-600` (#6b7280)
- Disabled text: `--cs-color-neutral-400` (#9ca3af)

#### Backgrounds
- Main background: `--cs-background` (#FFFFFF)
- Surface: `--cs-surface` (#F9FAFB)
- Muted areas: `--cs-color-muted` (#f3f4f6)

## 🎯 Component Updates

### Navbar
- White background with subtle shadow
- Logo with primary color background
- Clean navigation links with hover states
- CTA button with shadow

### Hero Section
- Gradient background from white to neutral-50
- Organic blob decorations with blur
- Badge with accent color tint
- Primary CTA with shadow
- Feature cards with hover effects

### Footer
- White background with border
- Organized link sections
- Uppercase section headers
- Responsive layout

### Buttons
- Consistent rounded-lg corners (8px)
- Smooth transitions (200ms)
- Focus ring for accessibility
- Hover opacity changes

## 📱 Responsive Breakpoints
```css
--cs-breakpoint-sm: 640px
--cs-breakpoint-md: 768px
--cs-breakpoint-lg: 1024px
--cs-breakpoint-xl: 1280px
```

## ♿ Accessibility
- Minimum contrast ratio: 4.5:1
- Focus outline: 2px solid rgba(76, 175, 80, 0.85)
- Touch target size: 44px minimum
- All interactive elements keyboard accessible

## 🚀 Usage in Tailwind

The design tokens are automatically available in Tailwind through the configuration:

```tsx
// Using color tokens
className="bg-primary text-white"
className="text-accent hover:text-primary"
className="border-neutral-200"

// Using spacing tokens
className="p-lg"  // padding: 24px
className="gap-md" // gap: 16px

// Using radius tokens
className="rounded-lg"  // 16px
className="rounded-md"  // 8px
```

## 🎨 Design Principles

1. **Agricultural & Organic** - Natural greens, soft curves, organic shapes
2. **Clean & Modern** - Ample whitespace, clear hierarchy
3. **Trustworthy** - Professional styling, clear typography
4. **Accessible** - High contrast, clear focus states
5. **Responsive** - Mobile-first, fluid layouts

## 📝 Notes

- Always use CSS custom properties (var(--cs-*)) for consistency
- Maintain color contrast ratios for accessibility
- Use consistent spacing scale across all components
- Apply smooth transitions for better UX
- Keep mobile experience in mind for all designs

