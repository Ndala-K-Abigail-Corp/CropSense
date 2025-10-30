# CropSense - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites

- Node.js 18+ installed
- PNPM 8+ installed (`npm install -g pnpm`)

### Installation

```bash
# 1. Navigate to project directory
cd CropSense

# 2. Install all dependencies (may take 2-3 minutes)
pnpm install

# 3. Start the development server
pnpm dev
```

🎉 Open **http://localhost:5173** in your browser!

---

## 🎨 Explore Components in Storybook

```bash
# Start Storybook
pnpm storybook
```

Open **httpgi://localhost:6006** to see:
- Navbar (5 variants)
- Hero (5 variants)
- ChatInterface (4 variants)
- UI components (Button, Input, Card, etc.)

**Try the a11y addon** to check accessibility!

---

## 🧪 Run Tests

```bash
# Run all tests
pnpm test

# Run tests with UI
cd apps/web
pnpm test:ui

# Check coverage
pnpm coverage
```

---

## 📁 Project Structure

```
apps/web/src/
├── components/         # React components
│   ├── Navbar.tsx     ← Navigation bar
│   ├── Hero.tsx       ← Landing hero
│   ├── ChatInterface.tsx ← Chat UI
│   └── ui/            ← shadcn base components
├── hooks/             # Custom React hooks
├── pages/             # Route pages (HomePage, AdminPage)
└── styles/            # CSS + design tokens
```

---

## 🎯 Key Features to Explore

### 1. Chat Interface
- Navigate to home page (http://localhost:5173)
- Click "Start Now" to scroll to chat
- Try sample questions or type your own
- See mock responses with source citations

### 2. Region/Crop Context
- Context is stored in localStorage
- Will persist across refreshes
- Used by Hero component to display context

### 3. Responsive Design
- Resize browser window
- Navbar becomes hamburger menu on mobile
- Hero typography scales down
- ChatInterface stacks vertically

### 4. Accessibility
- Tab through interactive elements
- Press Enter/Space to activate
- Check focus indicators (blue rings)
- Mobile menu closes with Escape

---

## 🛠️ Development Commands

```bash
# Development
pnpm dev                # Start dev server (port 5173)
pnpm storybook         # Start Storybook (port 6006)

# Testing
pnpm test              # Run unit tests
pnpm typecheck         # TypeScript type checking

# Code Quality
pnpm lint              # ESLint check
pnpm format            # Format with Prettier
pnpm format:check      # Check formatting

# Building
pnpm build             # Production build
```

---

## 📖 Code Examples

### Using a Component

```tsx
import { Hero } from '@/components/Hero';

function MyPage() {
  return (
    <Hero 
      title="Welcome!"
      ctaText="Get Started"
      onCtaClick={() => console.log('Clicked')}
    />
  );
}
```

### Using a Hook

```tsx
import { useRegionCropContext } from '@/hooks/useRegionCropContext';

function MyComponent() {
  const { region, setRegion } = useRegionCropContext();
  
  return (
    <button onClick={() => setRegion({ region: 'Midwest USA' })}>
      Set Region
    </button>
  );
}
```

### Using Design Tokens

```tsx
// Tailwind classes (from design-tokens.json)
<div className="bg-primary-500 text-neutral-white p-6 rounded-lg shadow-md">
  Styled with design tokens
</div>

// CSS variables
<div style={{ 
  backgroundColor: 'var(--ag-color-primary-500)',
  padding: 'var(--ag-spacing-6)'
}}>
  Direct CSS variable usage
</div>
```

---

## 🎨 Customizing Design Tokens

Design tokens are in `docs/design-tokens.json`.

After editing, they're used in:
1. `apps/web/tailwind.config.js` (Tailwind theme)
2. `apps/web/src/styles/tokens.css` (CSS variables)

No rebuild needed - hot reload works! ⚡

---

## 🧩 Adding New Components

```bash
# 1. Create component file
touch apps/web/src/components/MyComponent.tsx

# 2. Create test file
touch apps/web/src/components/MyComponent.test.tsx

# 3. Create story file
touch apps/web/src/components/MyComponent.stories.tsx
```

### Component Template

```tsx
// MyComponent.tsx
import React from 'react';
import { Button } from './ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div className="p-6">
      <h2 className="font-heading text-2xl">{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}
```

### Test Template

```tsx
// MyComponent.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    
    render(<MyComponent title="Test" onAction={onAction} />);
    await user.click(screen.getByText('Action'));
    
    expect(onAction).toHaveBeenCalledOnce();
  });
});
```

### Story Template

```tsx
// MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    title: 'My Component',
    onAction: () => console.log('Action clicked'),
  },
};
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change port in package.json or:
PORT=5174 pnpm dev
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### TypeScript Errors

```bash
# Restart TypeScript server in your editor
# Or run type check:
pnpm typecheck
```

### Tests Failing

```bash
# Clear test cache
cd apps/web
pnpm test --clearCache
```

---

## 📚 Learn More

- **README.md** - Full project overview
- **IMPLEMENTATION_SUMMARY.md** - Detailed implementation guide
- **apps/web/README.md** - Web app specifics
- **docs/Technical Design Doc.md** - Technical specifications

---

## 🎯 Next Steps

1. ✅ Run `pnpm install` and `pnpm dev`
2. ✅ Explore the app at http://localhost:5173
3. ✅ Check components in Storybook
4. ✅ Run tests to verify setup
5. 🚀 Start building new features!

**Happy coding!** 🌾

