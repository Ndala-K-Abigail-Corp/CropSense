# 🌱 CropSense - Agricultural Guidance Platform

CropSense is an AI-powered agricultural guidance platform that provides farmers with evidence-based answers to their farming questions using RAG (Retrieval-Augmented Generation) technology.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)

## 🎯 Overview

CropSense combines trusted agricultural resources with advanced AI to deliver:

- **Context-aware answers** grounded in verified agricultural documents
- **Source citations** for every response
- **Mobile-friendly** chat interface
- **Real-time** query processing

## 🏗️ Architecture

```
┌──────────────┐
│   Web App    │
│ (React+Vite) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Firebase   │
│ Auth+Hosting │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   Functions  │────▶│  RAG Backend │
│  (Node.js)   │     │  (FastAPI)   │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Vertex AI   │
                     │ Embeddings + │
                     │   Gemini     │
                     └──────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **TanStack Query** - Data fetching
- **React Hook Form + Zod** - Form handling

### Backend
- **Firebase** - Auth, Hosting, Firestore, Functions
- **FastAPI** (Python) - RAG backend
- **Vertex AI** - Embeddings & Generation
- **Firestore** - Vector storage (MVP)

### Tooling
- **PNPM** - Package manager
- **ESLint + Prettier** - Code quality
- **Vitest** - Testing
- **GitHub Actions** - CI/CD

## 📁 Project Structure

```
.
├── apps/
│   └── web/                    # React frontend application
│       ├── src/
│       │   ├── components/     # React components
│       │   │   ├── ui/         # Base UI components
│       │   │   └── layouts/    # Layout components
│       │   ├── pages/          # Page components
│       │   ├── contexts/       # React contexts
│       │   ├── hooks/          # Custom hooks
│       │   ├── lib/            # Utilities & Firebase
│       │   └── styles/         # CSS & design tokens
│       ├── index.html
│       └── vite.config.ts
│
├── packages/
│   ├── shared/                 # Shared TypeScript code
│   │   └── src/
│   │       ├── schemas.ts      # Zod schemas
│   │       ├── types.ts        # TypeScript types
│   │       ├── utils.ts        # Utilities
│   │       └── constants.ts    # Constants
│   │
│   └── rag/                    # Python RAG backend
│       ├── main.py             # FastAPI app
│       ├── embeddings.py       # Embedding service
│       ├── vector_store.py     # Vector storage
│       ├── retriever.py        # Retrieval service
│       └── requirements.txt
│
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       └── index.ts
│
├── docs/                       # Documentation
│   ├── Technical Design Doc.md
│   ├── design-tokens.json
│   └── rag.md
│
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── ci.yml
│       └── deploy.yml
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **PNPM** >= 8.x
- **Python** >= 3.11
- **Firebase CLI**
- **Google Cloud** account (for Vertex AI)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CropSense_Rag_tool
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   For web app (`apps/web/.env`):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_URL=http://localhost:8000
   ```
   
   For RAG backend (`packages/rag/.env`):
   ```env
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
   VERTEX_AI_LOCATION=us-central1
   ```

4. **Set up Python environment**
   ```bash
   cd packages/rag
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cd ../..
   ```

## 💻 Development

### Run the web app
```bash
pnpm dev:web
```

The app will be available at `http://localhost:3000`

### Run the RAG backend
```bash
cd packages/rag
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python main.py
```

The API will be available at `http://localhost:8000`

### Run Firebase emulators
```bash
firebase emulators:start
```

### Common Commands

```bash
# Development
pnpm dev:web              # Start web dev server
pnpm build:web            # Build web app
pnpm preview:web          # Preview production build

# Code Quality
pnpm lint                 # Lint all packages
pnpm lint:fix             # Fix linting issues
pnpm format               # Format code
pnpm typecheck            # Type check all packages

# Testing
pnpm test                 # Run tests
pnpm test:watch           # Run tests in watch mode
```

## 🚢 Deployment

### Prerequisites
1. Firebase project created
2. GitHub secrets configured:
   - `FIREBASE_SERVICE_ACCOUNT`
   - `FIREBASE_TOKEN`
   - `FIREBASE_PROJECT_ID`
   - All `VITE_FIREBASE_*` variables

### Automatic Deployment
Push to `main` branch triggers automatic deployment via GitHub Actions.

### Manual Deployment

**Web App:**
```bash
pnpm build:web
firebase deploy --only hosting
```

**Cloud Functions:**
```bash
cd functions
pnpm build
firebase deploy --only functions
```

**RAG Backend:**
```bash
cd packages/rag
gcloud run deploy cropsense-rag --source .
```

## 📚 Documentation

- [Technical Design Document](./docs/Technical%20Design%20Doc.md) - Complete technical specification
- [RAG Plan](./docs/rag.md) - RAG implementation details
- [Design Tokens](./docs/design-tokens.json) - Design system tokens

### Key Features

#### 🔐 Authentication
- Email/password authentication via Firebase Auth
- Protected routes for authenticated users
- User profile management

#### 💬 Chat Interface
- Real-time chat with RAG-powered responses
- Source citations for every answer
- Conversation history
- Mobile-responsive design

#### 🎨 Design System
- Custom design tokens from Figma
- Consistent color palette and typography
- Accessible components following WCAG guidelines

#### 🤖 RAG Pipeline
- Document ingestion and chunking
- Vector embeddings via Vertex AI
- Semantic search with Firestore
- Answer generation with Gemini

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes: `git commit -m 'Add amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Firebase](https://firebase.google.com/)
- AI by [Vertex AI](https://cloud.google.com/vertex-ai)
- Design inspired by agricultural best practices

---

**Note:** This is an MVP implementation. For production deployment:
1. Replace mock data with real Vertex AI integration
2. Implement proper vector search (Vertex AI Vector Search)
3. Add comprehensive error handling and monitoring
4. Implement rate limiting and security measures
5. Add data ingestion pipeline for agricultural documents

For questions or support, please refer to the [Technical Design Document](./docs/Technical%20Design%20Doc.md).

