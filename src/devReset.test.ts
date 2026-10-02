import { describe, expect, it } from 'vitest';
import { shouldResetCooldown } from './devReset';

describe('DEV deploy resets the cooldown', () => {
  it('DEV: a new build resets once', () => {
    expect(shouldResetCooldown('DEV', 'abc1234', 'def5678')).toBe(true);
    expect(shouldResetCooldown('DEV', undefined, 'def5678')).toBe(true);
    expect(shouldResetCooldown('DEV', 'def5678', 'def5678')).toBe(false);
  });
  it('PROD never resets', () => {
    expect(shouldResetCooldown('PROD', 'abc1234', 'def5678')).toBe(false);
  });
});
