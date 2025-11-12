# ADR 001: Adopt Monorepo Structure with PNPM Workspaces

**Date**: 2025-11-12  
**Status**: Accepted  
**Deciders**: CropSense Team

## Context

CropSense consists of multiple interconnected components:
- Frontend web application (React + TypeScript)
- Backend Cloud Functions (Node.js + TypeScript)
- Python RAG backend (FastAPI)
- Shared TypeScript types and utilities
- Documentation

We needed to decide on a repository structure that would:
1. Allow code sharing between packages
2. Simplify dependency management
3. Enable consistent tooling and CI/CD
4. Support different languages (TypeScript and Python)
5. Scale as the project grows

### Considered Options

1. **Multi-repo**: Separate repositories for each component
2. **Monorepo with npm workspaces**: Single repo using npm's workspace feature
3. **Monorepo with PNPM workspaces**: Single repo using PNPM's workspace feature
4. **Monorepo with Yarn workspaces**: Single repo using Yarn's workspace feature
5. **Monorepo with Lerna + npm**: Single repo managed with Lerna

## Decision

We will use a **monorepo structure with PNPM workspaces**.

### Structure

```
├── apps/
│   └── web/              # Frontend React application
├── functions/            # Firebase Cloud Functions
├── packages/
│   ├── shared/           # Shared TypeScript code
│   └── rag/              # Python RAG backend (isolated)
├── docs/                 # Documentation and ADRs
└── .github/              # CI/CD workflows
```

### Why PNPM?

1. **Disk space efficiency**: Uses content-addressable storage (saves ~2-3x disk space)
2. **Speed**: Faster than npm and Yarn in most benchmarks
3. **Strict node_modules**: Better dependency isolation prevents phantom dependencies
4. **Built-in workspace support**: No additional tools needed
5. **Compatible with npm ecosystem**: Drop-in replacement for npm

## Consequences

### Positive

✅ **Code Sharing**: Easy to share TypeScript types, utilities, and schemas between packages  
✅ **Dependency Management**: Single `pnpm-lock.yaml` ensures version consistency  
✅ **Atomic Commits**: Changes across multiple packages in single commits  
✅ **Unified CI/CD**: Single pipeline for all packages  
✅ **Faster Installs**: PNPM's symlink-based approach speeds up installations  
✅ **Better DX**: Developers work in single repository with consistent tooling  
✅ **Turbo Integration**: PNPM works seamlessly with Turborepo for build caching

### Negative

⚠️ **Learning Curve**: Team needs to learn PNPM-specific commands  
⚠️ **Python Isolation**: Python package (`packages/rag`) still requires separate virtual environment  
⚠️ **Large Repository**: Clone size grows with project (mitigated by sparse checkout)  
⚠️ **CI Complexity**: Need to determine which packages changed to optimize builds

### Mitigation Strategies

- Document PNPM commands in README
- Use Turborepo for intelligent caching and selective builds
- Implement workspace-specific CI jobs
- Keep Python dependencies in isolated virtual environment

## Related Decisions

- [ADR 002](002-rag-architecture.md): RAG Architecture design
- [ADR 003](003-frontend-framework-choice.md): Frontend framework selection

## References

- [PNPM Workspaces Documentation](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
- [Why PNPM?](https://pnpm.io/motivation)

