import { UserProfile, JobDescriptionAnalysis } from '../../shared/types';

export function buildJdAnalysisPrompt(rawJdText: string) {
  return [
    {
      role: 'system' as const,
      content: `You are an AI specialized in analyzing job descriptions.
Extract key information from the job posting and return a JSON object with this exact structure:
{
  "companyName": "string",
  "jobTitle": "string",
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "summary": "1-2 sentence high-level overview of the role"
}
Output ONLY raw JSON. No markdown backticks, no preamble.`
    },
    {
      role: 'user' as const,
      content: `Analyze this Job Description:\n\n${rawJdText.slice(0, 8000)}`
    }
  ];
}

export function buildQuestionAnswerPrompt(
  question: string,
  profile: UserProfile,
  jd: JobDescriptionAnalysis,
  customInstructions?: string
) {
  const profileContext = `
Candidate Name: ${profile.personal.fullName}
Experience Summary: ${profile.experienceSummary}
Core Skills: ${profile.skills.join(', ')}
Work History:
${profile.workHistory.map(w => `- ${w.role} at ${w.company} (${w.startDate} - ${w.endDate}): ${w.highlights.join('; ')}`).join('\n')}
Resume Details:
${profile.resumeText.slice(0, 4000)}
`;

  const instructionContext = customInstructions
    ? `\nUSER SPECIFIC INSTRUCTIONS FOR THIS ANSWER:\n${customInstructions}\n`
    : '';

  return [
    {
      role: 'system' as const,
      content: `You are an expert career advisor representing a qualified job applicant.
Your task is to write a tailored, professional response to a job application question.

CRITICAL RULES:
1. Base your answer strictly on the Candidate Profile provided. Never invent experiences or skills not in the profile.
2. Align the answer with the company (${jd.companyName}) and role (${jd.jobTitle}).
3. Maintain a professional, confident, and engaging tone.
4. Keep the answer appropriately concise (1-2 paragraphs) unless specifically instructed otherwise.
5. Return ONLY the answer text. Do NOT include greetings, quotation marks, or conversational remarks.${instructionContext}`
    },
    {
      role: 'user' as const,
      content: `Company: ${jd.companyName}
Role: ${jd.jobTitle}
Question to answer: "${question}"

Candidate Profile:
${profileContext}`
    }
  ];
}

export function buildResumeParsePrompt(resumeText: string) {
  return [
    {
      role: 'system' as const,
      content: `You are an expert resume parsing AI.
Extract candidate profile data from the resume text and return a strictly valid JSON object:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedinUrl": "string",
  "githubUrl": "string",
  "portfolioUrl": "string",
  "skills": ["string"],
  "experienceSummary": "string (1-2 sentence elevator pitch)",
  "workHistory": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "highlights": ["string"]
    }
  ]
}
Output ONLY raw JSON. Do not include markdown formatting or backticks.`
    },
    {
      role: 'user' as const,
      content: `Parse this resume text into the JSON format:\n\n${resumeText.slice(0, 7000)}`
    }
  ];
}
