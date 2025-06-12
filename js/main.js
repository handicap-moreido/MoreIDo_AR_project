// Import camera and hand detection logic
import { startCamera, toggleCamera, videoElement } from './camera.js';
import { onResults, startExperience } from './handDetection.js';
import { initLanguageSwitcher, updateLanguage } from './language.js';

// Setup MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Setup MediaPipe camera loop
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});

window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const languagePanel = document.getElementById('language-panel');
  const transitionPanel = document.getElementById('transition-loading-panel');

  // Start default camera first, then start MediaPipe camera feed
  startCamera().then(() => camera.start());

  // Double-tap to toggle camera
  let lastTap = 0;
  document.addEventListener('touchend', function (event) {
    const currentTime = new Date().getTime();
    if (currentTime - lastTap < 300) {
      toggleCamera();
      event.preventDefault();
    }
    lastTap = currentTime;
  }, false);

  // Language setup
  initLanguageSwitcher();
  updateLanguage('en');

  // Hide loading screen after 3 seconds
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }, 3000);

  // Handle language panel and transition panel
  document.querySelectorAll('#language-switcher button').forEach(button => {
    button.addEventListener('click', () => {
      console.log('Language button clicked, hiding language panel and showing transition panel');
      // Immediately hide language panel
      languagePanel.style.visibility = 'hidden';
      languagePanel.style.opacity = '0';
      // Immediately show transition panel
      if (transitionPanel) {
        console.log('Showing transition loading panel');
        transitionPanel.style.visibility = 'visible';
        transitionPanel.style.opacity = '1';
        setTimeout(() => {
          console.log('Hiding transition loading panel');
          transitionPanel.style.visibility = 'hidden';
          transitionPanel.style.opacity = '0';
          startExperience(); // Start experience after transition
        }, 2000); // Show transition panel for 2 seconds
      } else {
        console.warn('Transition loading panel not found in DOM');
        startExperience(); // Fallback to startExperience if panel is missing
      }
    });
  });
});