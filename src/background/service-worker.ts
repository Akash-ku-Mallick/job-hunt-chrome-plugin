import { GroqClient } from '../core/ai/groq-client';
import { getSettings } from '../core/profile/storage';
import { FEEDBACK_FORM_URL } from '../shared/constants';

// Enable opening the side panel when the extension toolbar icon is clicked
chrome.runtime.onInstalled.addListener(async () => {
  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  // Set uninstall feedback URL to gather insights on uninstalls
  if (chrome.runtime.setUninstallURL) {
    chrome.runtime.setUninstallURL(FEEDBACK_FORM_URL);
  }
});

// Message listener for Groq API proxy and cross-context events
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CALL_GROQ_API') {
    (async () => {
      try {
        const settings = await getSettings();
        if (!settings.groqApiKey) {
          throw new Error('Groq API Key is missing. Please configure it in extension settings.');
        }

        const client = new GroqClient(settings.groqApiKey);
        const result = await client.chatCompletion(
          message.payload.messages,
          message.payload.model || settings.preferredModel,
          settings.temperature
        );

        sendResponse({ success: true, data: result });
      } catch (error: any) {
        console.error('Groq API execution error:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error occurred' });
      }
    })();

    return true; // Keep message channel open for async response
  }
});

