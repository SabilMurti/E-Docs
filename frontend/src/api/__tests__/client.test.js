import { describe, it, expect, vi, beforeEach } from 'vitest';
import client from '../client';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should use basic config', () => {
    expect(client.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should attach token to requests if exists', async () => {
    localStorage.setItem('token', 'test-token');
    
    // Mock the request handler to inspect config
    const handler = client.interceptors.request.handlers[0];
    const config = await handler.fulfilled({ headers: {} });
    
    expect(config.headers.Authorization).toBe('Bearer test-token');
  });

  it('should not attach token if missing', async () => {
    const handler = client.interceptors.request.handlers[0];
    const config = await handler.fulfilled({ headers: {} });
    
    expect(config.headers.Authorization).toBeUndefined();
  });
});
