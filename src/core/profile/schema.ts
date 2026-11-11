import { UserProfile, ExtensionSettings } from '../../shared/types';
import { DEFAULT_MODEL } from '../../shared/constants';

export const DEFAULT_PROFILE: UserProfile = {
  personal: {
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  },
  workAuthorization: {
    authorizedInCountry: true,
    requiresSponsorship: false,
    visaStatus: 'Citizen / Permanent Resident',
  },
  experienceSummary: '',
  resumeText: '',
  skills: [],
  workHistory: [],
  customQAOverrides: {},
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  groqApiKey: '',
  preferredModel: DEFAULT_MODEL,
  temperature: 0.3,
  autoDetectFields: true,
  highlightFilledFields: true,
  autoDeclineEeo: true,
};

export function validateProfile(profile: Partial<UserProfile>): boolean {
  return Boolean(
    profile &&
    profile.personal &&
    typeof profile.personal.email === 'string'
  );
}

