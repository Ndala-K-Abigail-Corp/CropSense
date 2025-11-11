# Contributing to CropSense

Thank you for your interest in contributing to CropSense! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/cropsense.git
   cd cropsense
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Code Style

We use ESLint and Prettier for code formatting:

```bash
pnpm lint        # Check for issues
pnpm lint:fix    # Auto-fix issues
pnpm format      # Format code
```

### Style Guidelines

- Use TypeScript for all new code
- Follow functional programming patterns where possible
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Commit Messages

Follow the Conventional Commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add conversation history export feature

- Add export to JSON functionality
- Add export to PDF functionality
- Update UI with export button
```

## Pull Request Process

1. **Update your branch**
   ```bash
   git fetch origin
   git rebase origin/dev
   ```

2. **Run tests and checks**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   pnpm build:web
   ```

3. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues
   - Describe changes and rationale
   - Add screenshots for UI changes

## Testing

- Write unit tests for utilities and hooks
- Write integration tests for API endpoints
- Write E2E tests for critical user flows

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test -- --ui      # Visual test runner
```

## Documentation

Update relevant documentation:
- README.md for user-facing changes
- Technical Design Doc for architecture changes
- Code comments for complex logic
- API documentation for new endpoints

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- Suggestions for improvements

Thank you for contributing! 🌱

