import { describe, expect, it } from 'vitest';

import { env } from './env';

describe('frontend environment configuration', () => {
  it('exposes a backend API base URL', () => {
    expect(env.backendUrl).toBeDefined();
    expect(typeof env.backendUrl).toBe('string');
    expect(env.backendUrl.length).toBeGreaterThan(0);
  });

  it('uses an API URL that points to the backend API path', () => {
    expect(env.backendUrl).toContain('/api');
  });
});