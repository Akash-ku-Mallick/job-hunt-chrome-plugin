import { AuthUser } from '../../shared/types';
import { STORAGE_KEYS, GOOGLE_OAUTH } from '../../shared/constants';

export async function getAuthUser(): Promise<AuthUser | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_USER);
  return result[STORAGE_KEYS.AUTH_USER] || null;
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_USER]: user });
}

export async function clearAuthUser(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.AUTH_USER);
}

export function getRedirectUri(): string {
  if (chrome.identity?.getRedirectURL) {
    return chrome.identity.getRedirectURL();
  }
  return `https://${chrome.runtime.id}.chromiumapp.org`;
}

export async function signInWithGoogle(interactive: boolean = true): Promise<AuthUser> {
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2?.client_id || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

  if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
    throw new Error(
      'Google OAuth Client ID is not configured. Please add your Client ID in .env (VITE_GOOGLE_CLIENT_ID) or manifest.json.'
    );
  }

  // Use launchWebAuthFlow with standard HTTPS redirect (https://<ext-id>.chromiumapp.org/)
  // This avoids the "Custom URI scheme is not supported on Chrome apps" error
  const redirectUri = getRedirectUri();
  console.log('[JobHunt AI] Using OAuth Redirect URI:', redirectUri);
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId.trim());
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('prompt', 'select_account');

  return new Promise((resolve, reject) => {
    if (!chrome.identity?.launchWebAuthFlow) {
      reject(new Error('chrome.identity.launchWebAuthFlow is not available. Ensure "identity" permission is in manifest.json.'));
      return;
    }

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive,
      },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message || 'Google Sign-In was cancelled.';
          reject(new Error(msg));
          return;
        }

        if (!responseUrl) {
          reject(new Error('No response received from Google authentication.'));
          return;
        }

        try {
          // Parse access_token from response hash: #access_token=ya29...&token_type=Bearer...
          const urlObj = new URL(responseUrl);
          const hashParams = new URLSearchParams(urlObj.hash.substring(1));
          const token = hashParams.get('access_token');

          if (!token) {
            const error = hashParams.get('error') || urlObj.searchParams.get('error') || 'Token missing in response';
            throw new Error(`Google OAuth error: ${error}`);
          }

          const userInfo = await fetchGoogleUserInfo(token);
          const authUser: AuthUser = {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            givenName: userInfo.given_name,
            familyName: userInfo.family_name,
            picture: userInfo.picture,
            token,
            authenticatedAt: Date.now(),
          };

          await saveAuthUser(authUser);
          resolve(authUser);
        } catch (err: any) {
          reject(new Error(`Failed to retrieve Google Profile: ${err.message}`));
        }
      }
    );
  });
}

export async function signOutGoogle(): Promise<void> {
  const currentUser = await getAuthUser();
  if (currentUser?.token) {
    // Revoke token with Google endpoint (best effort)
    try {
      await fetch(`${GOOGLE_OAUTH.REVOKE_ENDPOINT}?token=${currentUser.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (e) {
      console.warn('Revoke token request failed (continuing local sign out):', e);
    }
  }

  // Clear local storage
  await clearAuthUser();
}

async function fetchGoogleUserInfo(token: string): Promise<{
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
}> {
  const response = await fetch(GOOGLE_OAUTH.USER_INFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google UserInfo API responded with HTTP ${response.status}`);
  }

  return response.json();
}
