/**
 * tRPC instance configuration
 * Base configuration for type-safe API procedures
 */

import { initTRPC } from '@trpc/server';

// Create tRPC instance
const t = initTRPC.create();

/**
 * Export reusable router and procedure builders
 */
export const router = t.router;
export const publicProcedure = t.procedure;

