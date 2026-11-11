import { describe, it, expect } from 'vitest';
import { classifyField } from '../src/core/matcher/field-classifier';

describe('Field Classifier Heuristics', () => {
  it('classifies full name, first name, and last name accurately', () => {
    expect(classifyField('Full Name', 'applicant_name', 'text')).toBe('FULL_NAME');
    expect(classifyField('Your Legal Given Name', 'first_name', 'text')).toBe('FIRST_NAME');
    expect(classifyField('Surname / Family Name', 'last_name', 'text')).toBe('LAST_NAME');
  });

  it('classifies contact information fields', () => {
    expect(classifyField('Email Address', 'email', 'email')).toBe('EMAIL');
    expect(classifyField('Phone Number', 'phone', 'tel')).toBe('PHONE');
    expect(classifyField('Mobile Phone', 'mobile', 'text')).toBe('PHONE');
  });

  it('classifies profile and portfolio URLs', () => {
    expect(classifyField('LinkedIn Profile', 'linkedin', 'url')).toBe('LINKEDIN_URL');
    expect(classifyField('GitHub Account', 'github', 'url')).toBe('GITHUB_URL');
    expect(classifyField('Personal Website / Portfolio', 'portfolio', 'url')).toBe('PORTFOLIO_URL');
  });

  it('classifies work authorization and visa questions', () => {
    expect(
      classifyField('Are you legally authorized to work in this country?', 'work_auth', 'select')
    ).toBe('WORK_AUTHORIZATION');

    expect(
      classifyField('Will you now or in the future require visa sponsorship?', 'visa_sponsorship', 'select')
    ).toBe('VISA_SPONSORSHIP');
  });

  it('classifies salary and notice period questions', () => {
    expect(classifyField('Desired Salary / Compensation', 'salary', 'text')).toBe('SALARY_EXPECTATION');
    expect(classifyField('Notice Period / Earliest Start Date', 'notice_period', 'text')).toBe('NOTICE_PERIOD');
  });

  it('classifies long-form essay and custom questions', () => {
    expect(
      classifyField(
        'Why do you want to join our engineering team at Acme Corp?',
        'custom_question_1',
        'textarea'
      )
    ).toBe('CUSTOM_ESSAY');

    expect(
      classifyField(
        'Describe a challenging technical problem you solved using distributed systems.',
        'custom_question_2',
        'textarea'
      )
    ).toBe('CUSTOM_ESSAY');
  });

  it('falls back to UNKNOWN for unrecognized generic fields', () => {
    expect(classifyField('Miscellaneous Notes', 'notes_field', 'text')).toBe('UNKNOWN');
  });
});

