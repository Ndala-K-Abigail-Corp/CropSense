# CropSense - Agriculture RAG Web Application

**One-sentence pitch:** CropSense provides farmers with concise, context-aware best-practice guidance by combining retrieval of trusted agricultural resources with generative explanations tailored to local conditions.

## 🌾 Overview

CropSense is a modern web application that makes agricultural knowledge accessible to smallholder and commercial farmers through an AI-powered chat interface. Built with React, TypeScript, and a robust RAG (Retrieval-Augmented Generation) architecture.

### Key Features

- 💬 Natural-language Q&A chat interface
- 📚 Answers grounded in verified agricultural sources
- 🌍 Region and crop-aware recommendations
- 🎨 Beautiful, accessible UI built with shadcn/ui
- 📱 Fully responsive (mobile, tablet, desktop)
- ♿ WCAG 2.1 AA compliant

## 🏗️ Tech Stack

**Frontend:**
- React 18 + TypeScript (strict mode)
- Vite for build tooling
- Tailwind CSS with custom design tokens
- shadcn/ui components (Radix UI + Tailwind)
- TanStack Query for data fetching
- React Hook Form + Zod for form validation

**Backend (stub):**
- tRPC for type-safe API
- Firebase (Auth, Firestore, Functions)
- Node.js runtime

**Testing & Quality:**
- Vitest + Testing Library (unit/component tests)
- Storybook (component documentation)
- ESLint + Prettier (code quality)
- TypeScript strict mode

**Monorepo:**
- PNPM workspaces
- Organized workspace structure

## 📁 Project Structure

```
CropSense/
├── apps/
│   └── web/                  # React web application
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── hooks/        # Custom React hooks
│       │   ├── lib/          # Utilities
│       │   ├── pages/        # Route pages
│       │   ├── layouts/      # Layout components
│       │   └── styles/       # CSS and design tokens
│       ├── .storybook/       # Storybook config
│       └── vitest.config.ts  # Test config
├── packages/
│   └── shared/               # Shared schemas and types
│       └── src/
│           ├── schemas/      # Zod validation schemas
│           └── types/        # TypeScript types
├── functions/                # tRPC routers (stub)
│   └── src/
│       └── routers/          # API route handlers
└── docs/                     # Documentation
    ├── Technical Design Doc.md
    └── design-tokens.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PNPM >= 8.0.0

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CropSense
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
cp apps/web/.env.example apps/web/.env
```

4. Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

## 📜 Available Scripts

From the root directory:

```bash
# Development
pnpm dev                    # Start web app dev server
pnpm storybook             # Launch Storybook

# Building
pnpm build                 # Build all packages
pnpm build-storybook       # Build Storybook static site

# Testing
pnpm test                  # Run all tests
pnpm typecheck             # Type-check all packages

# Code Quality
pnpm lint                  # Run ESLint
pnpm format                # Format code with Prettier
pnpm format:check          # Check formatting
```

## 🧪 Testing

### Unit & Component Tests

```bash
cd apps/web
pnpm test                  # Run tests
pnpm test:ui               # Run tests with UI
pnpm coverage              # Generate coverage report
```

### Storybook

Visual component testing and documentation:

```bash
pnpm storybook             # Start Storybook dev server
```

Visit `http://localhost:6006` to interact with components in isolation.

## 🎨 Design System

The application uses a comprehensive design token system defined in `docs/design-tokens.json`. Tokens are integrated into:

- **Tailwind CSS** (`apps/web/tailwind.config.js`)
- **CSS Variables** (`apps/web/src/styles/tokens.css`)

### Design Token Categories

- **Colors:** Primary (green), secondary (blue), neutral, feedback
- **Typography:** Fonts (Inter, Playfair Display), sizes, weights
- **Spacing:** Consistent scale (0-32)
- **Border Radius:** sm/md/lg/rounded/pill
- **Shadows:** sm/md/lg
- **Animations:** Durations, easings, keyframes
- **Breakpoints:** mobile/tablet/desktop

## ♿ Accessibility

CropSense follows WCAG 2.1 AA guidelines:

- ✅ Color contrast ratios ≥ 4.5:1
- ✅ Keyboard navigation support
- ✅ ARIA labels and roles
- ✅ Focus visible states
- ✅ Semantic HTML structure
- ✅ Screen reader support

Run accessibility audits in Storybook using the a11y addon.

## 🔧 Configuration

### Environment Variables

Create `apps/web/.env` with:

```env
VITE_API_URL=http://localhost:3000/trpc
VITE_FIREBASE_API_KEY=your_key_here
# ... see .env.example for full list
```

### TypeScript

Strict mode enabled across all packages. Path aliases configured:
- `@/*` → `apps/web/src/*`

## 📚 Component Documentation

### Implemented Components

1. **Navbar** - Responsive navigation with mobile menu
2. **Hero** - Landing hero section with CTAs
3. **ChatInterface** - Interactive chat with RAG retrieval
4. **RegionCropForm** - Context selection form
5. **UI Components** - Button, Input, Card, Avatar, Separator (shadcn/ui)

### Custom Hooks

1. **useRegionCropContext** - Region/crop context management
2. **useChatInterface** - Chat state and message handling
3. **useRetrievalAPI** - Knowledge base retrieval
4. **useFormValidation** - Generic form validation wrapper

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new components
3. Update Storybook stories
4. Ensure accessibility standards
5. Use conventional commits

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Design tokens follow industry best practices
- Built with love for farmers worldwide 🌾

---

For detailed technical documentation, see `docs/Technical Design Doc.md`

