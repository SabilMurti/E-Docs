import { describe, it, expect, vi } from 'vitest';
import { formatRelativeTime, truncate, getInitials, debounce } from '../helpers';

describe('Helpers', () => {
  describe('formatRelativeTime', () => {
    it('returns "just now" for seconds ago', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('just now');
    });

    it('returns minutes ago', () => {
        const date = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
        expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });
  });

  describe('truncate', () => {
    it('truncates long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncate(text, 10)).toBe('This is a...');
    });

    it('returns original if short enough', () => {
      const text = 'Short';
      expect(truncate(text, 10)).toBe('Short');
    });
  });

  describe('getInitials', () => {
    it('returns initials for full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('returns single initial for single name', () => {
      expect(getInitials('Alice')).toBe('A');
    });

    it('handles empty', () => {
      expect(getInitials('')).toBe('?');
    });
  });

  describe('debounce', () => {
    it('delays execution', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 1000);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
