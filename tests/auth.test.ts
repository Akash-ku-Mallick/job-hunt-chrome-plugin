import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAuthUser, saveAuthUser, clearAuthUser, getRedirectUri } from '../src/core/auth/google-auth';
import { AuthUser } from '../src/shared/types';
import { STORAGE_KEYS } from '../src/shared/constants';

describe('Google Authentication Module', () => {
  let mockStorage: Record<string, any> = {};

  beforeEach(() => {
    mockStorage = {};

    // Mock chrome APIs
    global.chrome = {
      runtime: {
        id: 'test_extension_id_123',
        lastError: undefined,
        getManifest: () => ({
          oauth2: { client_id: 'test-client-id.apps.googleusercontent.com' },
        }),
      },
      storage: {
        local: {
          get: vi.fn(async (key: string) => {
            return { [key]: mockStorage[key] };
          }),
          set: vi.fn(async (items: Record<string, any>) => {
            Object.assign(mockStorage, items);
          }),
          remove: vi.fn(async (key: string) => {
            delete mockStorage[key];
          }),
        },
      },
      identity: {
        getRedirectURL: vi.fn(() => 'https://test_extension_id_123.chromiumapp.org/'),
        launchWebAuthFlow: vi.fn(),
      },
    } as any;
  });

  it('generates the correct chromiumapp.org redirect URI', () => {
    const uri = getRedirectUri();
    expect(uri).toBe('https://test_extension_id_123.chromiumapp.org/');
  });

  it('saves and retrieves an authenticated user entity', async () => {
    const mockUser: AuthUser = {
      id: 'google-sub-987654321',
      email: 'alex.rivera@example.com',
      name: 'Alex Rivera',
      givenName: 'Alex',
      familyName: 'Rivera',
      picture: 'https://lh3.googleusercontent.com/photo.jpg',
      token: 'ya29.mock_oauth_access_token',
      authenticatedAt: 1700000000000,
    };

    await saveAuthUser(mockUser);
    expect(mockStorage[STORAGE_KEYS.AUTH_USER]).toEqual(mockUser);

    const retrieved = await getAuthUser();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.email).toBe('alex.rivera@example.com');
    expect(retrieved?.name).toBe('Alex Rivera');
    expect(retrieved?.token).toBe('ya29.mock_oauth_access_token');
  });

  it('clears authenticated user entity on sign out', async () => {
    mockStorage[STORAGE_KEYS.AUTH_USER] = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      token: 'mock-token',
      authenticatedAt: 1700000000000,
    };

    expect(await getAuthUser()).not.toBeNull();

    await clearAuthUser();
    expect(await getAuthUser()).toBeNull();
    expect(mockStorage[STORAGE_KEYS.AUTH_USER]).toBeUndefined();
  });
});
