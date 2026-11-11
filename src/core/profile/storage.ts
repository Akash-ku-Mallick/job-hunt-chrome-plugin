import { UserProfile, ExtensionSettings } from '../../shared/types';
import { STORAGE_KEYS } from '../../shared/constants';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from './schema';

export async function getUserProfile(): Promise<UserProfile> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROFILE);
  if (result[STORAGE_KEYS.PROFILE]) {
    return { ...DEFAULT_PROFILE, ...result[STORAGE_KEYS.PROFILE] };
  }
  return DEFAULT_PROFILE;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  // Strip redundant excess whitespace from resume text to optimize storage
  if (profile.resumeText) {
    profile.resumeText = profile.resumeText.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  }

  // Quota safety check
  if (chrome.storage.local.getBytesInUse) {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    // 8MB threshold warning (limit is ~10MB)
    if (bytesInUse > 8 * 1024 * 1024) {
      console.warn('Storage warning: storage usage is nearing the local quota (~10MB)');
    }
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.PROFILE]: profile });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (result[STORAGE_KEYS.SETTINGS]) {
    return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
}

