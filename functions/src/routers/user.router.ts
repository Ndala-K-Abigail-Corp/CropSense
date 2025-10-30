/**
 * User router - stub implementation
 * Handles user-related procedures
 */

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import type { User } from 'shared';

// Mock user data
const mockUsers: User[] = [
  {
    uid: 'user-1',
    email: 'farmer@example.com',
    displayName: 'John Farmer',
    role: 'farmer',
    region: 'Midwest USA',
    crops: ['corn', 'soybeans'],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    uid: 'user-2',
    email: 'admin@cropsense.com',
    displayName: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
];

export const userRouter = router({
  /**
   * Get user by ID
   */
  getById: publicProcedure
    .input(z.object({ uid: z.string() }))
    .query(({ input }) => {
      const user = mockUsers.find((u) => u.uid === input.uid);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }),

  /**
   * Get current authenticated user
   */
  getCurrent: publicProcedure.query(() => {
    // Return first mock user as "current" user
    return mockUsers[0];
  }),

  /**
   * Update user profile
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        uid: z.string(),
        displayName: z.string().optional(),
        region: z.string().optional(),
        crops: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      const userIndex = mockUsers.findIndex((u) => u.uid === input.uid);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...input,
      };

      return mockUsers[userIndex];
    }),
});

