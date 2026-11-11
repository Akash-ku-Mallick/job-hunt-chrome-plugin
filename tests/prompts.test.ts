import { describe, it, expect } from 'vitest';
import { buildJdAnalysisPrompt, buildQuestionAnswerPrompt, buildResumeParsePrompt } from '../src/core/ai/prompts';
import { DEFAULT_PROFILE } from '../src/core/profile/schema';
import { JobDescriptionAnalysis, UserProfile } from '../src/shared/types';

describe('Groq Prompt Builders', () => {
  it('constructs a valid JD analysis prompt with raw JD text', () => {
    const rawJd = 'Acme Corp is seeking a Senior Backend Engineer proficient in Go and Kubernetes...';
    const messages = buildJdAnalysisPrompt(rawJd);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Extract key information from the job posting');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain(rawJd);
  });

  it('constructs tailored question answer prompt with candidate profile and JD context', () => {
    const candidateProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      personal: {
        ...DEFAULT_PROFILE.personal,
        fullName: 'Alex Rivera',
      },
      experienceSummary: 'Lead engineer with 8 years building distributed microservices in Go and Python.',
      skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Redis'],
      workHistory: [
        {
          company: 'CloudTech',
          role: 'Staff Engineer',
          startDate: '2021',
          endDate: 'Present',
          highlights: ['Architected low-latency streaming pipeline', 'Scaled to 10M DAU'],
        },
      ],
      resumeText: 'Alex Rivera - Resume. Staff Engineer at CloudTech...',
    };

    const mockJd: JobDescriptionAnalysis = {
      companyName: 'DataScale Inc',
      jobTitle: 'Senior Distributed Systems Engineer',
      requiredSkills: ['Go', 'Distributed Systems'],
      preferredSkills: ['Kubernetes'],
      summary: 'DataScale is building real-time telemetry streaming platforms.',
      rawText: 'Full JD text...',
    };

    const question = 'Why do you believe you are the right fit for DataScale?';
    const messages = buildQuestionAnswerPrompt(question, candidateProfile, mockJd);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('DataScale Inc');
    expect(messages[0].content).toContain('Senior Distributed Systems Engineer');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain(question);
    expect(messages[1].content).toContain('Alex Rivera');
    expect(messages[1].content).toContain('CloudTech');
  });

  it('injects custom tone and instructions into question answer prompt when provided', () => {
    const candidateProfile: UserProfile = { ...DEFAULT_PROFILE };
    const mockJd: JobDescriptionAnalysis = {
      companyName: 'Acme',
      jobTitle: 'Engineer',
      requiredSkills: [],
      preferredSkills: [],
      summary: 'Summary',
      rawText: 'Raw',
    };

    const customTone = 'Emphasize leadership and keep answer to 2 short sentences.';
    const messages = buildQuestionAnswerPrompt('Tell us about yourself', candidateProfile, mockJd, customTone);

    expect(messages[0].content).toContain('USER SPECIFIC INSTRUCTIONS FOR THIS ANSWER');
    expect(messages[0].content).toContain(customTone);
  });

  it('constructs resume parsing prompt requesting strictly structured JSON', () => {
    const resume = 'Jane Doe\nEmail: jane@example.com\nSenior Frontend Engineer with React & TypeScript';
    const messages = buildResumeParsePrompt(resume);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('expert resume parsing AI');
    expect(messages[0].content).toContain('fullName');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain(resume);
  });
});
