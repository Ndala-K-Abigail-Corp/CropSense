# CropSense Web Application

React + Vite frontend for the CropSense agriculture RAG system.

## Development

```bash
# Install dependencies (from root)
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Run Storybook
pnpm storybook

# Type check
pnpm typecheck

# Build for production
pnpm build
```

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn/ui base components
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   └── ChatInterface.tsx
├── hooks/           # Custom React hooks
│   ├── useRegionCropContext.tsx
│   ├── useChatInterface.ts
│   ├── useRetrievalAPI.ts
│   └── useFormValidation.ts
├── lib/             # Utilities and configs
│   ├── utils.ts
│   ├── trpc.ts
│   └── trpc-provider.tsx
├── pages/           # Route pages
│   ├── HomePage.tsx
│   └── AdminPage.tsx
├── layouts/         # Layout components
│   └── MainLayout.tsx
├── styles/          # Global styles and tokens
│   ├── globals.css
│   └── tokens.css
└── test/            # Test utilities
    └── setup.ts
```

## Key Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **tRPC** - Type-safe API client
- **Vitest** - Unit testing
- **Storybook** - Component documentation

## Design System

The app uses design tokens from `../../docs/design-tokens.json`:

- **Colors:** Primary (green), secondary (blue), neutral, feedback
- **Typography:** Inter (base), Playfair Display (headings)
- **Spacing:** 4px base unit (0-128px scale)
- **Breakpoints:** mobile (0-767px), tablet (768-1279px), desktop (1280px+)

All tokens are available as:
1. Tailwind utilities (e.g., `text-primary-500`)
2. CSS variables (e.g., `var(--ag-color-primary-500)`)

## Components

### Navbar
Responsive navigation with mobile menu, authentication state, and keyboard accessibility.

### Hero
Landing hero section with responsive typography, gradient background, and feature highlights.

### ChatInterface
Interactive chat with message history, loading states, and source citations display.

### RegionCropForm
Context selection form with React Hook Form + Zod validation.

## Custom Hooks

### useRegionCropContext
Manages region/crop selection with localStorage persistence.

```tsx
const { region, crop, setRegion, setCrop } = useRegionCropContext();
```

### useChatInterface
Chat state management with tRPC integration.

```tsx
const { messages, input, setInput, handleSubmit, isLoading } = useChatInterface();
```

### useRetrievalAPI
Retrieves documents from knowledge base.

```tsx
const { documents, isLoading } = useRetrievalAPI(query, limit);
```

### useFormValidation
Generic form validation with Zod schemas.

```tsx
const form = useFormValidation(mySchema);
```

## Testing

All components have:
- Unit tests (`.test.tsx`)
- Storybook stories (`.stories.tsx`)

Run tests:
```bash
pnpm test              # Run tests
pnpm test:ui           # Interactive UI
pnpm coverage          # Coverage report
```

## Accessibility

All components meet WCAG 2.1 AA standards:
- Keyboard navigation
- ARIA labels
- Focus management
- Color contrast ≥ 4.5:1

Test with Storybook's a11y addon.

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/trpc
```

See `.env.example` for full list.

## Building

```bash
pnpm build       # Production build → dist/
pnpm preview     # Preview production build
```

## Notes

- tRPC endpoints are currently stubs returning mock data
- Authentication is mocked (not functional)
- Firebase integration is configured but not implemented

