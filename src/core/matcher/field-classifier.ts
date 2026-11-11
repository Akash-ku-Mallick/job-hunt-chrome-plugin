import { FieldCategory } from '../../shared/types';

export function classifyField(label: string, name: string, type: string): FieldCategory {
  const combined = `${label} ${name}`.toLowerCase();

  if (type === 'email' || combined.includes('email')) {
    return 'EMAIL';
  }
  if (type === 'tel' || combined.includes('phone') || combined.includes('mobile')) {
    return 'PHONE';
  }
  if (combined.includes('first name') || combined.includes('given name')) {
    return 'FIRST_NAME';
  }
  if (combined.includes('last name') || combined.includes('family name') || combined.includes('surname')) {
    return 'LAST_NAME';
  }
  if (combined.includes('full name') || combined.includes('your name') || (combined.includes('name') && !combined.includes('company'))) {
    return 'FULL_NAME';
  }
  if (combined.includes('linkedin')) {
    return 'LINKEDIN_URL';
  }
  if (combined.includes('github')) {
    return 'GITHUB_URL';
  }
  if (combined.includes('portfolio') || combined.includes('website') || combined.includes('personal site')) {
    return 'PORTFOLIO_URL';
  }
  if (combined.includes('location') || combined.includes('city') || combined.includes('address')) {
    return 'LOCATION';
  }
  if (combined.includes('authorized to work') || combined.includes('work authorization') || combined.includes('legally eligible')) {
    return 'WORK_AUTHORIZATION';
  }
  if (combined.includes('sponsorship') || combined.includes('require visa') || combined.includes('future sponsorship')) {
    return 'VISA_SPONSORSHIP';
  }
  if (combined.includes('salary') || combined.includes('compensation') || combined.includes('expected pay')) {
    return 'SALARY_EXPECTATION';
  }
  if (combined.includes('notice period') || combined.includes('start date') || combined.includes('earliest start')) {
    return 'NOTICE_PERIOD';
  }
  if (combined.includes('years of experience') || combined.includes('how many years')) {
    return 'EXPERIENCE_YEARS';
  }

  // EEO & Demographic Survey Fields
  if (
    combined.includes('gender') ||
    combined.includes('race') ||
    combined.includes('ethnicity') ||
    combined.includes('veteran status') ||
    combined.includes('disability') ||
    combined.includes('hispanic or latino') ||
    combined.includes('equal employment')
  ) {
    return 'EEO_DEMOGRAPHIC';
  }

  // Multiline questions or typical essay prompts
  const labelLower = label.toLowerCase();
  if (
    type === 'textarea' ||
    labelLower.includes('why') ||
    labelLower.includes('describe') ||
    labelLower.includes('tell us') ||
    labelLower.includes('cover letter') ||
    labelLower.includes('additional information') ||
    (label.length > 50 && label.includes('?'))
  ) {
    return 'CUSTOM_ESSAY';
  }

  return 'UNKNOWN';
}

