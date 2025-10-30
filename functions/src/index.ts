/**
 * Combined tRPC router export
 * Merges all routers into a single app router
 */

import { router } from './trpc';
import { userRouter } from './routers/user.router';
import { chatRouter } from './routers/chat.router';

/**
 * Main application router
 */
export const appRouter = router({
  user: userRouter,
  chat: chatRouter,
});

/**
 * Export type for use in client
 */
export type AppRouter = typeof appRouter;

