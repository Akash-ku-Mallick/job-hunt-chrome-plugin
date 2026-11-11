import { describe, it, expect, vi } from 'vitest';
import { GroqClient } from '../src/core/ai/groq-client';
import { GROQ_MODELS } from '../src/shared/constants';

describe('GroqClient', () => {
  it('throws an error if initialized without an API key', async () => {
    const client = new GroqClient('');
    await expect(
      client.chatCompletion([{ role: 'user', content: 'hello' }])
    ).rejects.toThrow('Groq API Key is not configured');
  });

  it('successfully returns completion content when fetch succeeds', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'I would love to join your engineering team because of...',
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const client = new GroqClient('gsk_valid_key_test');
    const answer = await client.chatCompletion([
      { role: 'user', content: 'Why Acme Corp?' },
    ]);

    expect(answer).toBe('I would love to join your engineering team because of...');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gsk_valid_key_test',
        }),
      })
    );
  });

  it('throws unauthorized error on HTTP 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API Key' } }),
    });

    const client = new GroqClient('gsk_invalid_key');
    await expect(
      client.chatCompletion([{ role: 'user', content: 'test' }])
    ).rejects.toThrow('Invalid Groq API Key (HTTP 401)');
  });

  it('triggers fallback model if primary model returns model decommissioned error', async () => {
    const fetchMock = vi
      .fn()
      // First attempt with primary model fails with model error
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'The model llama-3.3-70b-versatile has been decommissioned.' },
        }),
      })
      // Second attempt with fallback model succeeds
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'Fallback response generated.' } }],
        }),
      });

    global.fetch = fetchMock;

    const client = new GroqClient('gsk_valid_key_test');
    const result = await client.chatCompletion(
      [{ role: 'user', content: 'test prompt' }],
      GROQ_MODELS.DEV_ESSAY_PRIMARY
    );

    expect(result).toBe('Fallback response generated.');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Verify first call used primary model
    const firstCallBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(firstCallBody.model).toBe(GROQ_MODELS.DEV_ESSAY_PRIMARY);

    // Verify second call used fallback model
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondCallBody.model).toBe(GROQ_MODELS.DEV_FAST_EXTRACT);
  });

  it('triggers fallback to primary model if a requested model returns model_not_found', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: 'The model `llama-3.1-8b-instant` does not exist or you do not have access to it.' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'Fallback response from primary model.' } }],
        }),
      });

    global.fetch = fetchMock;

    const client = new GroqClient('gsk_valid_key_test');
    const result = await client.chatCompletion(
      [{ role: 'user', content: 'test prompt' }],
      'llama-3.1-8b-instant'
    );

    expect(result).toBe('Fallback response from primary model.');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondCallBody.model).toBe(GROQ_MODELS.DEV_ESSAY_PRIMARY);
  });
});

