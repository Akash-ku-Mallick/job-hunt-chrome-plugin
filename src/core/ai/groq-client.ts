import { GROQ_MODELS, FALLBACK_MODELS } from '../../shared/constants';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

export async function fetchAvailableGroqModels(apiKey: string): Promise<string[]> {
  if (!apiKey) return [];
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .map((m: any) => m.id)
      .filter((id: string) => !id.includes('whisper') && !id.includes('guard'));
  } catch {
    return [];
  }
}

export class GroqClient {
  private apiKey: string;
  private endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  async chatCompletion(
    messages: ChatMessage[],
    model: string = GROQ_MODELS.DEV_ESSAY_PRIMARY,
    temperature: number = 0.3
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API Key is not configured. Please add your key in the extension settings.');
    }

    try {
      return await this.executeRequest(messages, model, temperature);
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      const isModelNotFound =
        errMsg.includes('model') ||
        errMsg.includes('not found') ||
        errMsg.includes('decommissioned') ||
        errMsg.includes('access') ||
        errMsg.includes('404');

      if (isModelNotFound) {
        // Try fallback models in priority order
        for (const fallback of FALLBACK_MODELS) {
          if (fallback !== model) {
            console.warn(`Model "${model}" not accessible; attempting fallback to "${fallback}"`);
            try {
              return await this.executeRequest(messages, fallback, temperature);
            } catch (fallbackErr: any) {
              const fbMsg = (fallbackErr.message || '').toLowerCase();
              if (
                fbMsg.includes('not found') ||
                fbMsg.includes('model') ||
                fbMsg.includes('404')
              ) {
                continue; // Try next fallback model
              }
              throw fallbackErr;
            }
          }
        }
      }

      throw err;
    }
  }

  private async executeRequest(
    messages: ChatMessage[],
    model: string,
    temperature: number
  ): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    });

    if (response.status === 401) {
      throw new Error('Invalid Groq API Key (HTTP 401). Please check your key in settings.');
    }

    if (response.status === 429) {
      throw new Error('Groq rate limit exceeded (HTTP 429). Please wait a moment and try again.');
    }

    const data: GroqResponse = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `Groq API Error: HTTP ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No completion returned from Groq API.');
    }

    return content.trim();
  }
}
