# CropSense Cloud Functions

Firebase Cloud Functions for CropSense backend.

## Overview

This package contains serverless functions for:
- User authentication triggers
- tRPC API endpoints
- Scheduled tasks
- Background processing

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Build the functions:
```bash
pnpm build
```

3. Run locally with Firebase emulators:
```bash
pnpm serve
```

## Development

### Available Functions

- `health`: Health check endpoint
- `onUserCreate`: Triggered when a new user signs up
- `cleanupOldConversations`: Scheduled cleanup of old data

### Adding New Functions

1. Add function in `src/index.ts`
2. Build: `pnpm build`
3. Test with emulators: `pnpm serve`
4. Deploy: `pnpm deploy`

## Deployment

Deploy to Firebase:
```bash
firebase deploy --only functions
```

Deploy specific function:
```bash
firebase deploy --only functions:functionName
```

## TODO

- [ ] Implement tRPC handlers
- [ ] Add authentication middleware
- [ ] Implement chat.sendMessage endpoint
- [ ] Add rate limiting
- [ ] Set up monitoring and logging

