export type FieldCategory =
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'FULL_NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'LOCATION'
  | 'LINKEDIN_URL'
  | 'GITHUB_URL'
  | 'PORTFOLIO_URL'
  | 'WORK_AUTHORIZATION'
  | 'VISA_SPONSORSHIP'
  | 'SALARY_EXPECTATION'
  | 'NOTICE_PERIOD'
  | 'EXPERIENCE_YEARS'
  | 'CUSTOM_ESSAY'
  | 'EEO_DEMOGRAPHIC'
  | 'UNKNOWN';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required: boolean;
  currentValue: string;
  classification?: FieldCategory;
  suggestedValue?: string;
  options?: string[];
}

export interface UserProfile {
  personal: {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
  };
  workAuthorization: {
    authorizedInCountry: boolean;
    requiresSponsorship: boolean;
    visaStatus?: string;
  };
  experienceSummary: string;
  resumeText: string;
  skills: string[];
  workHistory: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }>;
  customQAOverrides: Record<string, string>;
}

export interface AuthUser {
  id: string;           // Google sub ID
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  token: string;
  authenticatedAt: number;
}

export interface ExtensionSettings {
  groqApiKey: string;
  preferredModel: string;
  temperature: number;
  autoDetectFields: boolean;
  highlightFilledFields: boolean;
  autoDeclineEeo: boolean;
}

export interface JobDescriptionAnalysis {
  companyName: string;
  jobTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  summary: string;
  rawText: string;
}

export type ExtensionMessage =
  | { type: 'ANALYZE_PAGE' }
  | { type: 'PAGE_ANALYSIS_RESULT'; payload: { jd: JobDescriptionAnalysis; fields: FormField[] } }
  | { type: 'GENERATE_FIELD_ANSWER'; payload: { question: string; fieldId: string; jd: JobDescriptionAnalysis; customInstructions?: string } }
  | { type: 'FIELD_ANSWER_RESULT'; payload: { fieldId: string; answer: string } }
  | { type: 'FILL_FIELDS'; payload: { fields: Array<{ id: string; value: string }> } }
  | { type: 'FILL_COMPLETE'; payload: { count: number } }
  | { type: 'PARSE_RESUME_TEXT'; payload: { resumeText: string } }
  | { type: 'GET_AUTH_USER' }
  | { type: 'SIGN_IN_GOOGLE' }
  | { type: 'SIGN_OUT_GOOGLE' }
  | { type: 'CALL_GROQ_API'; payload: { messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>; model?: string } };
