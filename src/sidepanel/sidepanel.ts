import { getUserProfile, saveUserProfile, getSettings, saveSettings } from '../core/profile/storage';
import { getAuthUser, signInWithGoogle, signOutGoogle, getRedirectUri } from '../core/auth/google-auth';
import { UserProfile, ExtensionSettings, FormField, JobDescriptionAnalysis, AuthUser } from '../shared/types';
import { GROQ_MODELS, FEEDBACK_FORM_URL, buildFeedbackUrl } from '../shared/constants';
import { buildQuestionAnswerPrompt, buildResumeParsePrompt } from '../core/ai/prompts';

let currentProfile: UserProfile;
let currentSettings: ExtensionSettings;
let currentAuthUser: AuthUser | null = null;
let detectedFields: FormField[] = [];
let currentJd: JobDescriptionAnalysis | null = null;

// DOM Elements - Navigation
const tabFillBtn = document.getElementById('tabFillBtn') as HTMLButtonElement;
const tabProfileBtn = document.getElementById('tabProfileBtn') as HTMLButtonElement;
const tabSettingsBtn = document.getElementById('tabSettingsBtn') as HTMLButtonElement;

const panelFill = document.getElementById('panelFill') as HTMLElement;
const panelProfile = document.getElementById('panelProfile') as HTMLElement;
const panelSettings = document.getElementById('panelSettings') as HTMLElement;

// Header Auth Elements
const btnGoogleSignInHeader = document.getElementById('btnGoogleSignInHeader') as HTMLButtonElement;
const userProfilePill = document.getElementById('userProfilePill') as HTMLElement;
const userAvatarImg = document.getElementById('userAvatarImg') as HTMLImageElement;
const userNameSpan = document.getElementById('userNameSpan') as HTMLElement;

// Settings Auth Elements
const accountStatusBadge = document.getElementById('accountStatusBadge') as HTMLElement;
const accountDetailsBox = document.getElementById('accountDetailsBox') as HTMLElement;
const accountEmailText = document.getElementById('accountEmailText') as HTMLElement;
const accountNameText = document.getElementById('accountNameText') as HTMLElement;
const btnGoogleSignInSettings = document.getElementById('btnGoogleSignInSettings') as HTMLButtonElement;
const btnGoogleSignOut = document.getElementById('btnGoogleSignOut') as HTMLButtonElement;

// Main Fill Action Elements
const btnScanPage = document.getElementById('btnScanPage') as HTMLButtonElement;
const btnAutofill = document.getElementById('btnAutofill') as HTMLButtonElement;
const fieldsContainer = document.getElementById('fieldsContainer') as HTMLElement;
const fieldCountBadge = document.getElementById('fieldCountBadge') as HTMLElement;

const jdCard = document.getElementById('jdCard') as HTMLElement;
const jdTitle = document.getElementById('jdTitle') as HTMLElement;
const jdCompany = document.getElementById('jdCompany') as HTMLElement;
const jdSummary = document.getElementById('jdSummary') as HTMLElement;
const statusMessage = document.getElementById('statusMessage') as HTMLElement;

// Profile Form Elements
const btnAutoParseResume = document.getElementById('btnAutoParseResume') as HTMLButtonElement;
const profileForm = document.getElementById('profileForm') as HTMLFormElement;
const profFullName = document.getElementById('profFullName') as HTMLInputElement;
const profEmail = document.getElementById('profEmail') as HTMLInputElement;
const profPhone = document.getElementById('profPhone') as HTMLInputElement;
const profLocation = document.getElementById('profLocation') as HTMLInputElement;
const profLinkedin = document.getElementById('profLinkedin') as HTMLInputElement;
const profGithub = document.getElementById('profGithub') as HTMLInputElement;
const profAuthorized = document.getElementById('profAuthorized') as HTMLInputElement;
const profSponsorship = document.getElementById('profSponsorship') as HTMLInputElement;
const profSummary = document.getElementById('profSummary') as HTMLTextAreaElement;
const profResume = document.getElementById('profResume') as HTMLTextAreaElement;

// Profile Export/Import Elements
const btnExportProfile = document.getElementById('btnExportProfile') as HTMLButtonElement;
const btnImportProfile = document.getElementById('btnImportProfile') as HTMLButtonElement;
const fileImportProfile = document.getElementById('fileImportProfile') as HTMLInputElement;

// Settings Form Elements
const settingsForm = document.getElementById('settingsForm') as HTMLFormElement;
const setApiKey = document.getElementById('setApiKey') as HTMLInputElement;
const setModel = document.getElementById('setModel') as HTMLSelectElement;
const setAutoDeclineEeo = document.getElementById('setAutoDeclineEeo') as HTMLInputElement;

// Feedback & Toast Banner Elements
const btnHeaderFeedback = document.getElementById('btnHeaderFeedback') as HTMLButtonElement | null;
const btnSettingsFeedback = document.getElementById('btnSettingsFeedback') as HTMLButtonElement | null;
const autofillSuccessBanner = document.getElementById('autofillSuccessBanner') as HTMLElement | null;
const autofillCountText = document.getElementById('autofillCountText') as HTMLElement | null;
const btnAutofillFeedback = document.getElementById('btnAutofillFeedback') as HTMLButtonElement | null;
const btnCloseSuccessBanner = document.getElementById('btnCloseSuccessBanner') as HTMLButtonElement | null;

// Status Message Helper with quiet indicator dot
function setStatus(text: string, state: 'ready' | 'loading' | 'success' | 'error' = 'ready') {
  const dotColor = state === 'success' ? 'bg-emerald-500' :
                   state === 'loading' ? 'bg-amber-500 animate-pulse' :
                   state === 'error' ? 'bg-red-500' : 'bg-emerald-500';
  statusMessage.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span><span>${text}</span>`;
}

// Initialize
async function init() {
  currentProfile = await getUserProfile();
  currentSettings = await getSettings();
  currentAuthUser = await getAuthUser();

  populateProfileForm();
  populateSettingsForm();
  updateAuthUI(currentAuthUser);
  setupEventListeners();
}

function updateAuthUI(user: AuthUser | null) {
  if (user) {
    // Header UI
    btnGoogleSignInHeader.classList.add('hidden');
    userProfilePill.classList.remove('hidden');
    userNameSpan.textContent = user.givenName || user.name || 'User';
    if (user.picture) {
      userAvatarImg.src = user.picture;
      userAvatarImg.classList.remove('hidden');
    } else {
      userAvatarImg.classList.add('hidden');
    }

    // Settings Card UI
    accountStatusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1.5 font-medium';
    accountStatusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>Connected</span>';
    accountEmailText.textContent = user.email;
    accountNameText.textContent = user.name;
    accountDetailsBox.classList.remove('hidden');
    btnGoogleSignInSettings.classList.add('hidden');
    btnGoogleSignOut.classList.remove('hidden');
  } else {
    // Header UI
    btnGoogleSignInHeader.classList.remove('hidden');
    userProfilePill.classList.add('hidden');

    // Settings Card UI
    accountStatusBadge.className = 'text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center gap-1.5 font-medium';
    accountStatusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-zinc-400"></span><span>Not connected</span>';
    accountDetailsBox.classList.add('hidden');
    btnGoogleSignInSettings.classList.remove('hidden');
    btnGoogleSignOut.classList.add('hidden');
  }
}

async function handleGoogleSignIn() {
  setStatus('Connecting Google account...', 'loading');
  try {
    const user = await signInWithGoogle(true);
    currentAuthUser = user;
    updateAuthUI(user);

    // Auto-populate empty profile fields from Google account
    let profileUpdated = false;
    if (!currentProfile.personal.fullName && user.name) {
      currentProfile.personal.fullName = user.name;
      profFullName.value = user.name;
      profileUpdated = true;
    }
    if (!currentProfile.personal.email && user.email) {
      currentProfile.personal.email = user.email;
      profEmail.value = user.email;
      profileUpdated = true;
    }

    if (profileUpdated) {
      await saveUserProfile(currentProfile);
    }

    setStatus(`Signed in as ${user.email}`, 'success');
    setTimeout(() => { setStatus('Ready'); }, 3000);
  } catch (err: any) {
    console.error('Google Sign-In failed:', err);
    alert(err.message || 'Google Sign-In failed.');
    setStatus('Sign-in cancelled', 'error');
    setTimeout(() => { setStatus('Ready'); }, 2000);
  }
}

async function handleGoogleSignOut() {
  setStatus('Signing out...', 'loading');
  try {
    await signOutGoogle();
    currentAuthUser = null;
    updateAuthUI(null);
    setStatus('Signed out', 'ready');
    setTimeout(() => { setStatus('Ready'); }, 2000);
  } catch (err: any) {
    console.error('Sign out error:', err);
    setStatus('Sign out error', 'error');
  }
}

function switchTab(activeTab: 'fill' | 'profile' | 'settings') {
  panelFill.classList.toggle('hidden', activeTab !== 'fill');
  panelProfile.classList.toggle('hidden', activeTab !== 'profile');
  panelSettings.classList.toggle('hidden', activeTab !== 'settings');

  const activeClasses = ['bg-white', 'text-zinc-900', 'shadow-2xs', 'font-semibold'];
  const inactiveClasses = ['text-zinc-600', 'hover:text-zinc-900', 'font-medium'];

  [tabFillBtn, tabProfileBtn, tabSettingsBtn].forEach(btn => {
    btn.classList.remove(...activeClasses);
    btn.classList.add(...inactiveClasses);
  });

  if (activeTab === 'fill') {
    tabFillBtn.classList.add(...activeClasses);
    tabFillBtn.classList.remove(...inactiveClasses);
  } else if (activeTab === 'profile') {
    tabProfileBtn.classList.add(...activeClasses);
    tabProfileBtn.classList.remove(...inactiveClasses);
  } else {
    tabSettingsBtn.classList.add(...activeClasses);
    tabSettingsBtn.classList.remove(...inactiveClasses);
  }
}

function populateProfileForm() {
  profFullName.value = currentProfile.personal.fullName || '';
  profEmail.value = currentProfile.personal.email || '';
  profPhone.value = currentProfile.personal.phone || '';
  profLocation.value = currentProfile.personal.location || '';
  profLinkedin.value = currentProfile.personal.linkedinUrl || '';
  profGithub.value = currentProfile.personal.githubUrl || '';
  profAuthorized.checked = currentProfile.workAuthorization.authorizedInCountry;
  profSponsorship.checked = currentProfile.workAuthorization.requiresSponsorship;
  profSummary.value = currentProfile.experienceSummary || '';
  profResume.value = currentProfile.resumeText || '';
}

function populateSettingsForm() {
  setApiKey.value = currentSettings.groqApiKey || '';
  const currentModel = currentSettings.preferredModel;
  if (!currentModel || currentModel === 'llama-3.1-8b-instant') {
    currentSettings.preferredModel = GROQ_MODELS.DEV_ESSAY_PRIMARY;
  }
  setModel.value = currentSettings.preferredModel;
  if (setAutoDeclineEeo) {
    setAutoDeclineEeo.checked = currentSettings.autoDeclineEeo ?? true;
  }
}

function setupEventListeners() {
  tabFillBtn.addEventListener('click', () => switchTab('fill'));
  tabProfileBtn.addEventListener('click', () => switchTab('profile'));
  tabSettingsBtn.addEventListener('click', () => switchTab('settings'));

  // Auth Button Listeners
  btnGoogleSignInHeader.addEventListener('click', handleGoogleSignIn);
  btnGoogleSignInSettings.addEventListener('click', handleGoogleSignIn);
  btnGoogleSignOut.addEventListener('click', handleGoogleSignOut);

  // Redirect URI Copy
  const btnCopyRedirectUri = document.getElementById('btnCopyRedirectUri') as HTMLButtonElement;
  const redirectUriDisplay = document.getElementById('redirectUriDisplay') as HTMLElement;
  if (redirectUriDisplay) {
    redirectUriDisplay.textContent = getRedirectUri();
  }
  if (btnCopyRedirectUri) {
    btnCopyRedirectUri.addEventListener('click', async () => {
      const uri = getRedirectUri();
      await navigator.clipboard.writeText(uri);
      btnCopyRedirectUri.innerHTML = `
        <svg class="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        <span>Copied</span>
      `;
      setTimeout(() => {
        btnCopyRedirectUri.innerHTML = `
          <svg class="w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <span>Copy URI</span>
        `;
      }, 2000);
    });
  }

  // Resume Auto-Parser
  if (btnAutoParseResume) {
    btnAutoParseResume.addEventListener('click', handleAutoParseResume);
  }

  // Profile Export & Import Listeners
  if (btnExportProfile) {
    btnExportProfile.addEventListener('click', handleExportProfile);
  }
  if (btnImportProfile && fileImportProfile) {
    btnImportProfile.addEventListener('click', () => fileImportProfile.click());
    fileImportProfile.addEventListener('change', handleImportProfile);
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const names = profFullName.value.trim().split(' ');
    currentProfile = {
      ...currentProfile,
      personal: {
        fullName: profFullName.value.trim(),
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: profEmail.value.trim(),
        phone: profPhone.value.trim(),
        location: profLocation.value.trim(),
        linkedinUrl: profLinkedin.value.trim(),
        githubUrl: profGithub.value.trim(),
        portfolioUrl: currentProfile.personal.portfolioUrl || '',
      },
      workAuthorization: {
        authorizedInCountry: profAuthorized.checked,
        requiresSponsorship: profSponsorship.checked,
      },
      experienceSummary: profSummary.value.trim(),
      resumeText: profResume.value.trim(),
    };

    await saveUserProfile(currentProfile);
    setStatus('Profile saved', 'success');
    setTimeout(() => { setStatus('Ready'); }, 2000);
  });

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    currentSettings = {
      ...currentSettings,
      groqApiKey: setApiKey.value.trim(),
      preferredModel: setModel.value,
      autoDeclineEeo: setAutoDeclineEeo ? setAutoDeclineEeo.checked : true,
    };

    await saveSettings(currentSettings);
    setStatus('Settings saved', 'success');
    setTimeout(() => { setStatus('Ready'); }, 2000);
  });

  btnScanPage.addEventListener('click', handleScanPage);
  btnAutofill.addEventListener('click', handleAutofill);

  // Feedback Triggers
  if (btnHeaderFeedback) {
    btnHeaderFeedback.addEventListener('click', () => {
      const url = buildFeedbackUrl({
        portal: currentJd?.companyName || currentJd?.jobTitle || '',
      });
      chrome.tabs.create({ url });
    });
  }

  if (btnSettingsFeedback) {
    btnSettingsFeedback.addEventListener('click', () => {
      chrome.tabs.create({ url: FEEDBACK_FORM_URL });
    });
  }

  if (btnAutofillFeedback) {
    btnAutofillFeedback.addEventListener('click', () => {
      const url = buildFeedbackUrl({
        portal: currentJd?.companyName || '',
        rating: '5',
      });
      chrome.tabs.create({ url });
    });
  }

  if (btnCloseSuccessBanner && autofillSuccessBanner) {
    btnCloseSuccessBanner.addEventListener('click', () => {
      autofillSuccessBanner.classList.add('hidden');
    });
  }
}

async function handleAutoParseResume() {
  const resumeText = profResume.value.trim();
  if (!resumeText || resumeText.length < 50) {
    alert('Please paste your resume text (at least 50 characters) in the box below first.');
    return;
  }
  if (!currentSettings.groqApiKey) {
    alert('Please configure your Groq API key in the Settings tab first.');
    switchTab('settings');
    return;
  }

  btnAutoParseResume.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span><span>Extracting...</span>`;
  btnAutoParseResume.disabled = true;
  setStatus('Extracting resume profile...', 'loading');

  try {
    const messages = buildResumeParsePrompt(resumeText);
    const modelToUse = currentSettings.preferredModel || GROQ_MODELS.DEV_FAST_EXTRACT;
    const parsedRaw = await callGroqApi(messages, modelToUse);
    
    // Clean any markdown backticks if returned
    const cleanJson = parsedRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.fullName) profFullName.value = parsed.fullName;
    if (parsed.email) profEmail.value = parsed.email;
    if (parsed.phone) profPhone.value = parsed.phone;
    if (parsed.location) profLocation.value = parsed.location;
    if (parsed.linkedinUrl) profLinkedin.value = parsed.linkedinUrl;
    if (parsed.githubUrl) profGithub.value = parsed.githubUrl;
    if (parsed.experienceSummary) profSummary.value = parsed.experienceSummary;

    // Trigger form save
    profileForm.dispatchEvent(new Event('submit'));
    setStatus('Profile updated from resume', 'success');
  } catch (err: any) {
    console.error('Resume parse error:', err);
    alert(`Resume extraction failed: ${err.message}`);
    setStatus('Extraction error', 'error');
  } finally {
    btnAutoParseResume.innerHTML = `
      <svg class="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
      </svg>
      <span>Extract profile</span>
    `;
    btnAutoParseResume.disabled = false;
    setTimeout(() => { setStatus('Ready'); }, 3000);
  }
}

function handleExportProfile() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProfile, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `jobhunt-profile-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  setStatus('Profile exported', 'success');
  setTimeout(() => { setStatus('Ready'); }, 2000);
}

async function handleImportProfile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed.personal || typeof parsed.personal.fullName !== 'string') {
      throw new Error('Invalid JobHunt profile JSON file.');
    }
    currentProfile = { ...currentProfile, ...parsed };
    await saveUserProfile(currentProfile);
    populateProfileForm();
    setStatus('Profile imported', 'success');
  } catch (err: any) {
    console.error('Import error:', err);
    alert(`Failed to import profile: ${err.message}`);
    setStatus('Import error', 'error');
  } finally {
    fileImportProfile.value = '';
    setTimeout(() => { setStatus('Ready'); }, 2000);
  }
}

async function ensureContentScriptReady(tabId: number): Promise<boolean> {
  try {
    const ping = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    if (ping?.success) return true;
  } catch {
    // Content script not yet injected
  }

  // Attempt dynamic script injection via chrome.scripting for arbitrary job portals
  try {
    if (chrome.scripting?.executeScript) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content.js'],
      });
      await new Promise(resolve => setTimeout(resolve, 150));
      return true;
    }
  } catch (err) {
    console.warn('[JobHunt AI] Dynamic script injection notice:', err);
  }

  return false;
}

async function handleScanPage() {
  autofillSuccessBanner?.classList.add('hidden');
  setStatus('Analyzing page...', 'loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('No active tab', 'error');
    return;
  }

  try {
    await ensureContentScriptReady(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_PAGE' });
    if (response?.success) {
      currentJd = response.payload.jd;
      detectedFields = response.payload.fields;

      // Render JD Card
      jdTitle.textContent = currentJd?.jobTitle || 'Role';
      jdCompany.textContent = currentJd?.companyName || 'Company';
      jdSummary.textContent = currentJd?.summary || 'No job summary extracted.';
      jdCard.classList.remove('hidden');

      // Map values and render
      await resolveFieldValues();
      renderFieldsList();
      btnAutofill.disabled = detectedFields.length === 0;
      setStatus(`Found ${detectedFields.length} fields`, 'success');
    }
  } catch (err) {
    console.error('Scan error:', err);
    setStatus('Scan error: refresh active tab', 'error');
  }
}

async function resolveFieldValues() {
  for (const field of detectedFields) {
    switch (field.classification) {
      case 'FULL_NAME':
        field.suggestedValue = currentProfile.personal.fullName;
        break;
      case 'FIRST_NAME':
        field.suggestedValue = currentProfile.personal.firstName;
        break;
      case 'LAST_NAME':
        field.suggestedValue = currentProfile.personal.lastName;
        break;
      case 'EMAIL':
        field.suggestedValue = currentProfile.personal.email;
        break;
      case 'PHONE':
        field.suggestedValue = currentProfile.personal.phone;
        break;
      case 'LOCATION':
        field.suggestedValue = currentProfile.personal.location;
        break;
      case 'LINKEDIN_URL':
        field.suggestedValue = currentProfile.personal.linkedinUrl;
        break;
      case 'GITHUB_URL':
        field.suggestedValue = currentProfile.personal.githubUrl;
        break;
      case 'WORK_AUTHORIZATION':
        field.suggestedValue = currentProfile.workAuthorization.authorizedInCountry ? 'Yes' : 'No';
        break;
      case 'VISA_SPONSORSHIP':
        field.suggestedValue = currentProfile.workAuthorization.requiresSponsorship ? 'Yes' : 'No';
        break;
      case 'EEO_DEMOGRAPHIC':
        if (currentSettings.autoDeclineEeo) {
          field.suggestedValue = 'Decline to self-identify';
        }
        break;
      case 'NOTICE_PERIOD':
        field.suggestedValue = 'Immediately';
        break;
      case 'SALARY_EXPECTATION':
        field.suggestedValue = field.currentValue || '';
        break;
      default:
        field.suggestedValue = field.currentValue || '';
    }
  }
}

function renderFieldsList() {
  fieldsContainer.innerHTML = '';
  fieldCountBadge.textContent = `${detectedFields.length} fields`;

  if (detectedFields.length === 0) {
    fieldsContainer.innerHTML = `
      <div class="bg-white border border-zinc-200/80 rounded-lg py-6 px-4 text-center space-y-1.5 shadow-2xs">
        <p class="text-xs font-medium text-zinc-700">No form fields detected</p>
        <p class="text-[11px] text-zinc-400">Make sure the active tab contains an application form.</p>
      </div>
    `;
    return;
  }

  detectedFields.forEach((field) => {
    const card = document.createElement('div');
    card.className = 'bg-white p-2.5 rounded-lg border border-zinc-200/90 shadow-2xs space-y-2 transition-subtle';

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center gap-2';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'text-xs font-medium text-zinc-800 truncate max-w-[210px]';
    labelSpan.textContent = field.label;

    const badge = document.createElement('span');
    badge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200/70 text-zinc-600 shrink-0';
    badge.textContent = field.classification || 'TEXT';

    header.appendChild(labelSpan);
    header.appendChild(badge);

    const inputRow = document.createElement('div');
    inputRow.className = 'flex gap-1.5 items-center';

    const valInput = document.createElement('input');
    valInput.type = 'text';
    valInput.className = 'flex-1 text-xs border border-zinc-300 rounded-md px-2.5 py-1 text-zinc-900 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-subtle';
    valInput.value = field.suggestedValue || '';
    valInput.addEventListener('input', (e) => {
      field.suggestedValue = (e.target as HTMLInputElement).value;
    });

    inputRow.appendChild(valInput);

    // If it's a custom essay, add Tone Selector + AI Generate button
    if (field.classification === 'CUSTOM_ESSAY') {
      const toneSelect = document.createElement('select');
      toneSelect.className = 'text-[11px] border border-zinc-300 rounded-md px-1.5 py-1 bg-zinc-50 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-subtle';
      toneSelect.innerHTML = `
        <option value="Balanced and professional">Balanced</option>
        <option value="Concise and direct (1 short paragraph)">Concise</option>
        <option value="Emphasize leadership, ownership, and measurable business impact">Leadership</option>
        <option value="Deep technical focus on architecture and problem solving">Technical</option>
      `;

      const aiBtn = document.createElement('button');
      aiBtn.className = 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs px-2.5 py-1 rounded-md border border-zinc-300 font-medium whitespace-nowrap flex items-center gap-1 transition-subtle cursor-pointer';
      aiBtn.innerHTML = `
        <svg class="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </svg>
        <span>AI</span>
      `;
      aiBtn.addEventListener('click', async () => {
        aiBtn.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span><span>Drafting...</span>`;
        aiBtn.disabled = true;
        try {
          const answer = await generateAiAnswer(field.label, toneSelect.value);
          valInput.value = answer;
          field.suggestedValue = answer;
          aiBtn.innerHTML = `
            <svg class="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span>Done</span>
          `;
        } catch (err: any) {
          alert(`AI generation failed: ${err.message}`);
          aiBtn.innerHTML = `
            <svg class="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
            </svg>
            <span>AI</span>
          `;
        } finally {
          aiBtn.disabled = false;
        }
      });

      inputRow.appendChild(toneSelect);
      inputRow.appendChild(aiBtn);
    }

    card.appendChild(header);
    card.appendChild(inputRow);
    fieldsContainer.appendChild(card);
  });
}

async function callGroqApi(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'CALL_GROQ_API',
        payload: {
          messages,
          model: model || currentSettings.preferredModel,
        },
      },
      (res) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (res?.success) {
          resolve(res.data);
        } else {
          reject(new Error(res?.error || 'Failed to execute Groq API call.'));
        }
      }
    );
  });
}

async function generateAiAnswer(question: string, toneInstruction?: string): Promise<string> {
  if (!currentSettings.groqApiKey) {
    throw new Error('Groq API Key is not set. Go to Settings tab to add it.');
  }
  if (!currentJd) {
    throw new Error('Please analyze the page first to extract the Job Description context.');
  }

  const messages = buildQuestionAnswerPrompt(question, currentProfile, currentJd, toneInstruction);
  return callGroqApi(messages, currentSettings.preferredModel);
}

async function handleAutofill() {
  setStatus('Filling fields...', 'loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  await ensureContentScriptReady(tab.id);

  const fieldsToFill = detectedFields
    .filter(f => f.suggestedValue && f.suggestedValue.trim().length > 0)
    .map(f => ({ id: f.id, value: f.suggestedValue! }));

  chrome.tabs.sendMessage(
    tab.id,
    {
      type: 'FILL_FIELDS',
      payload: { fields: fieldsToFill },
    },
    (res) => {
      if (res?.success) {
        const count = res.payload.count || 0;
        setStatus(`Filled ${count} fields`, 'success');
        if (autofillSuccessBanner && autofillCountText) {
          autofillCountText.textContent = String(count);
          autofillSuccessBanner.classList.remove('hidden');
        }
      } else {
        setStatus('Autofill error', 'error');
      }
      setTimeout(() => { setStatus('Ready'); }, 2500);
    }
  );
}

document.addEventListener('DOMContentLoaded', init);
