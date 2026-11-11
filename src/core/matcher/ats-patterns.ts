export interface AtsSelectorConfig {
  name: string;
  hostPattern: string;
  jdContainer: string;
  formContainer: string;
}

export const ATS_CONFIGS: AtsSelectorConfig[] = [
  {
    name: 'Greenhouse',
    hostPattern: 'greenhouse.io',
    jdContainer: '#content, .job-description, #app-body',
    formContainer: '#application_form, form#application',
  },
  {
    name: 'Lever',
    hostPattern: 'lever.co',
    jdContainer: '.section-page, .posting-headline, .posting-requirements',
    formContainer: '.application-form, form#application-form',
  },
  {
    name: 'Ashby',
    hostPattern: 'ashbyhq.com',
    jdContainer: '[data-testid="job-description"], .ashby-job-posting-description',
    formContainer: '[data-testid="application-form"], form',
  },
  {
    name: 'Workday',
    hostPattern: 'myworkdayjobs.com',
    jdContainer: '[data-automation-id="jobPostingDescription"]',
    formContainer: '[data-automation-id="application-form"], form',
  },
  {
    name: 'LinkedIn',
    hostPattern: 'linkedin.com',
    jdContainer: '.jobs-description__content, .jobs-box__html-content',
    formContainer: '.jobs-easy-apply-modal, .jobs-apply-form',
  },
];

export function getAtsConfig(hostname: string): AtsSelectorConfig | undefined {
  return ATS_CONFIGS.find(cfg => hostname.includes(cfg.hostPattern));
}

