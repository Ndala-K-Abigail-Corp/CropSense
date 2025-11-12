import { describe, it, expect } from 'vitest';
import { cn, formatRelativeTime } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('handles conditional classes', () => {
      const result = cn('base-class', { 'conditional-class': true, 'not-included': false });
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('not-included');
    });

    it('handles undefined and null', () => {
      const result = cn('base-class', undefined, null);
      expect(result).toBe('base-class');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats just now correctly', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('formats seconds ago correctly', () => {
      const date = new Date(Date.now() - 30 * 1000);
      expect(formatRelativeTime(date)).toBe('30 seconds ago');
    });

    it('formats minutes ago correctly', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });

    it('formats hours ago correctly', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('2 hours ago');
    });

    it('formats days ago correctly', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('3 days ago');
    });
  });
});

