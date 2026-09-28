import { describe, expect, it } from 'vitest';
import { pickBreak } from './breaks';

describe('pickBreak', () => {
  const lines = ['a', 'b', 'c'];
  it('never repeats the previous line', () => {
    for (let i = 0; i < 50; i++) expect(pickBreak(lines, 'b')).not.toBe('b');
  });
  it('covers the other lines', () => {
    expect(pickBreak(lines, 'b', () => 0)).toBe('a');
    expect(pickBreak(lines, 'b', () => 0.99)).toBe('c');
  });
  it('a single line may repeat; no lines → no break screen', () => {
    expect(pickBreak(['only'], 'only')).toBe('only');
    expect(pickBreak([], null)).toBeNull();
  });
});
