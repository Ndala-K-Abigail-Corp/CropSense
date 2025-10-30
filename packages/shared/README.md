# Shared Package

Shared TypeScript types and Zod schemas used across CropSense monorepo.

## Contents

### Schemas

Zod validation schemas for runtime type checking:

- **region.schema.ts** - Region and crop selection validation
- **chat.schema.ts** - Chat messages, queries, and responses

### Types

TypeScript types for domain models:

- User, KnowledgeDocument, FeedbackSubmission
- ApiResponse utility type

## Usage

Import from the package:

```typescript
import { regionSchema, chatMessageSchema, type User } from 'shared';

// Validate data
const result = regionSchema.parse(data);

// Type checking
const user: User = {
  uid: '123',
  email: 'farmer@example.com',
  role: 'farmer',
  createdAt: new Date().toISOString(),
};
```

## Schema Examples

### Region/Crop Context

```typescript
import { regionCropContextSchema } from 'shared';

const context = regionCropContextSchema.parse({
  region: {
    region: 'Midwest USA',
    country: 'United States',
  },
  crop: {
    cropName: 'Corn',
    cropType: 'cereal',
  },
  season: 'spring',
});
```

### Chat Query

```typescript
import { chatQuerySchema } from 'shared';

const query = chatQuerySchema.parse({
  query: 'When should I plant corn?',
  context: {
    region: 'Midwest',
    crop: 'corn',
  },
});
```

## Adding New Schemas

1. Create schema file in `src/schemas/`
2. Export from `src/index.ts`
3. Add tests if needed

## Type Safety

All schemas automatically generate TypeScript types:

```typescript
import { type ChatMessage, chatMessageSchema } from 'shared';

// Type is inferred from schema
type ChatMessage = z.infer<typeof chatMessageSchema>;
```

