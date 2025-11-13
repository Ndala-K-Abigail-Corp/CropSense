# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the CropSense project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Format

We use a simple format for our ADRs:

- **Title**: Short, descriptive title
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: The issue motivating this decision
- **Decision**: The change we're proposing/making
- **Consequences**: What becomes easier or more difficult

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [001](001-monorepo-structure.md) | Adopt Monorepo Structure with PNPM Workspaces | Accepted |
| [002](002-rag-architecture.md) | RAG Architecture with Firestore and Vertex AI | Accepted |
| [003](003-frontend-framework-choice.md) | Use React with Vite and TypeScript for Frontend | Accepted |

## Creating a New ADR

1. Copy the template from `000-template.md`
2. Number it sequentially (e.g., `004-your-decision.md`)
3. Fill in the sections
4. Create a PR for review
5. Update this index

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's ADR Template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/templates/decision-record-template-by-michael-nygard/index.md)


