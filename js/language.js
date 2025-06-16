import { translations } from './translations.js';
import { setAudioLanguage } from './animations.js';
import { preloadAudio, startExperience } from './handDetection.js';

// Default language
let currentLang = 'en';
const languageChangeListeners = [];

// Helper to get translated text
export function translate(key) {
  return translations[currentLang][key] || key;
}

// Update UI text and notify listeners
export function updateLanguage(lang) {
  console.log(`Updating language to: ${lang}`);
  currentLang = lang;

  // Update static UI elements
  const thankYouHeading = document.querySelector('#thank-you-panel h2');
  const thankYouPara = document.querySelector('#thank-you-panel p');
  const learnMoreBtn = document.getElementById('visit-link-button');
  const thankYouLink = document.querySelector('.thank-you-link');
  const instructionsEl = document.getElementById('instructions');
  const Audio = document.getElementById('volume-text');
  const DoubleTapText = document.getElementById('doubleTapInstructions p');

  if (thankYouHeading) thankYouHeading.innerText = translate('thank_you');
  if (thankYouPara) thankYouPara.innerText = translate('completed');
  if (learnMoreBtn) learnMoreBtn.innerText = translate('learn_more_button');
  if (thankYouLink) thankYouLink.innerText = translate('learn_more_link');
  if (instructionsEl) instructionsEl.innerText = translate('instructions_start');
  if (Audio) Audio.innerText = translate('Audio');
  if (DoubleTapText) DoubleTapText.innerText = translate("DoubleTapText");

  // Notify listeners (for dynamic text like animation subtitles)
  languageChangeListeners.forEach(cb => cb(currentLang));

  setAudioLanguage(lang);

  // Show loading UI
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.visibility = 'visible';
    loadingElement.innerText = 'Loading audio...';
  }

  // Defer audio loading until after language is selected
  preloadAudio(() => {
    console.log("Audio loaded after language change");
    if (loadingElement) loadingElement.style.visibility = 'hidden';
    // Optionally start experience if this is the trigger point
    startExperience();
  });
}


export function getCurrentLang() {
  return currentLang;
}

export function initLanguageSwitcher() {
  const switcher = document.getElementById('language-switcher');
  if (!switcher) {
    console.warn('Language switcher not found in DOM');
    return;
  }

  switcher.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const selectedLang = e.target.dataset.lang;
      if (translations[selectedLang]) {
        console.log(`Language button clicked: ${selectedLang}`);
        updateLanguage(selectedLang);
      }
    }
  });
}

// Let other modules listen for language changes
export function onLanguageChange(callback) {
  languageChangeListeners.push(callback);
}

// New helper to update animation subtitle element with translated subtitle
export function updateAnimationSubtitle(subtitleKey) {
  const subtitleEl = document.getElementById('subtitle');
  if (subtitleEl) {
    subtitleEl.innerText = translate(subtitleKey);
  }
}