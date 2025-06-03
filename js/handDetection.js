import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter, checkIfFist } from './handUtils.js';
import { Animator } from './animator.js';
import { animations } from './animations.js';
import { translate, onLanguageChange } from './language.js';

// Sprite setup
const spriteImg = document.createElement('img');
spriteImg.className = 'sprite-animation';
spriteImg.style.position = 'fixed';
spriteImg.style.width = '100px';
spriteImg.style.height = '100px';
spriteImg.style.pointerEvents = 'none';
spriteImg.style.display = 'none';
document.body.appendChild(spriteImg);

// UI elements
const subtitleElement = document.getElementById('subtitle');
const instructionElement = document.getElementById('instructions');
const handPromptContainer = document.getElementById('handPromptContainer');
const doubleTapPanel = document.getElementById('doubleTapInstructions');

const loadingElement = document.getElementById('loading') || document.createElement('div');
loadingElement.id = 'loading';
loadingElement.style.display = 'block';
loadingElement.style.position = 'fixed';
loadingElement.style.top = '50%';
loadingElement.style.left = '50%';
loadingElement.style.transform = 'translate(-50%, -50%)';
loadingElement.style.color = 'white';
loadingElement.style.fontSize = '24px';
loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
loadingElement.style.padding = '20px';
loadingElement.style.borderRadius = '10px';
loadingElement.innerText = 'Loading assets... 0%';
document.body.appendChild(loadingElement);

// Animation control
const animationKeys = Object.keys(animations);
let currentAnimationIndex = 0;
let animationFinished = false;
let pauseInProgress = false;
let lastTapTime = 0;
let showHandPrompt = false;
const preloadStatus = {};
let totalAssets = 0;
let loadedAssets = 0;

// Calculate total assets to preload
animationKeys.forEach(key => {
  const anim = animations[key];
  totalAssets += anim.frames.length + 1; // Frames + audio
});

// Preload all animations and audio
function preloadAssets(callback) {
  animationKeys.forEach(key => {
    const anim = animations[key];
    if (preloadStatus[key]) return;

    // Preload images
    const images = anim.frames.map(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => updateProgress();
      img.onerror = () => {
        console.warn(`Failed to load frame: ${src}`);
        updateProgress();
      };
      return img;
    });

    // Preload audio
    const audio = new Audio();
    audio.src = anim.audio;
    audio.preload = 'auto';
    audio.oncanplaythrough = () => updateProgress();
    audio.onerror = () => {
      console.warn(`Failed to load audio: ${anim.audio}`);
      updateProgress();
    };

    anim.preloadedImages = images;
    anim.preloadedAudio = audio;
    preloadStatus[key] = false;
  });

  function updateProgress() {
    loadedAssets++;
    const progress = Math.round((loadedAssets / totalAssets) * 100);
    loadingElement.innerText = `Loading assets... ${progress}%`;
    if (loadedAssets >= totalAssets) {
      animationKeys.forEach(k => preloadStatus[k] = true);
      loadingElement.style.display = 'none';
      if (callback) callback();
    }
  }
}

// Start preloading all assets
preloadAssets(() => {
  console.log("All assets preloaded");
  startExperience();
});

// Animator setup
let animator = new Animator(
  spriteImg,
  animations[animationKeys[0]],
  24,
  onAnimationComplete,
  subtitleElement,
  translate
);

onLanguageChange(() => {
  if (!animationFinished && !pauseInProgress) {
    const key = animationKeys[currentAnimationIndex];
    animator.setFrames(animations[key], translate);
    if (animator.subtitleElement) {
      animator.subtitleElement.innerText = translate(animations[key].subtitle);
    }
  }
});

function onAnimationComplete() {
  const currentKey = animationKeys[currentAnimationIndex];
  const currentAnim = animations[currentKey];
  console.log(`Animation ${currentKey} completed`);

  if (currentAnim.requiresGesture) {
    animator.waitForGesture();
    instructionElement.innerText = translate("instructions_show_closed_fist");
  } else {
    advanceToNextAnimation();
    setTimeout(() => {
      animator.start();
      instructionElement.innerText = '';
    }, 100);
  }
}

function advanceToNextAnimation() {
  currentAnimationIndex++;
  if (currentAnimationIndex >= animationKeys.length) {
    pauseBeforePanel();
    return;
  }

  const nextKey = animationKeys[currentAnimationIndex];
  const nextAnim = animations[nextKey];
  animator.setFrames(nextAnim, translate);
  animator.reset();
}

function pauseBeforePanel() {
  pauseInProgress = true;
  animator.stop();
  spriteImg.style.display = 'none';
  instructionElement.innerText = '';
  setTimeout(() => showThankYouPanel(), 2000);
}

// Called by Mediapipe
export function onResults(results) {
  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (pauseInProgress || animationFinished) {
    stopAnimation();
    canvasCtx.restore();
    return;
  }

  if (results.multiHandLandmarks?.length > 0) {
    if (showHandPrompt) {
      handPromptContainer.style.display = 'none';
      showHandPrompt = false;
    }

    const landmarks = results.multiHandLandmarks[0];

    if (animator.isPausedForGesture) {
      if (checkIfFist(landmarks)) {
        animator.gestureDetected();
        instructionElement.innerText = '';
        advanceToNextAnimation();
      } else {
        instructionElement.innerText = translate("instructions_show_closed_fist");
      }
      canvasCtx.restore();
      return;
    }

    if (checkIfPalmOpen(landmarks)) {
      const handCenter = calculateHandCenter(landmarks);
      drawSpriteAtPalm(handCenter.x, handCenter.y);
      instructionElement.innerText = '';

      if (!animator.rafId) {
        animator.resume();
      }
    } else {
      stopAnimation();
      instructionElement.innerText = translate("instructions_show_palm");
    }
  } else {
    stopAnimation();
    instructionElement.innerText = translate("instructions_start");
  }

  canvasCtx.restore();
}

function drawSpriteAtPalm(x, y) {
  if (animationFinished || pauseInProgress) return;

  const baseSize = 100;
  const scaleX = 3, scaleY = 4;
  const width = baseSize * scaleX;
  const height = baseSize * scaleY;

  const rect = canvasElement.getBoundingClientRect();
  const px = rect.left + x * rect.width;
  const py = rect.top + y * rect.height;

  spriteImg.style.width = `${width}px`;
  spriteImg.style.height = `${height}px`;
  spriteImg.style.left = `${px - width / 2}px`;
  spriteImg.style.top = `${py - height / 2}px`;
  spriteImg.style.display = 'block';

  if (!animator.rafId) {
    animator.start();
  }
}

function stopAnimation() {
  spriteImg.style.display = 'none';
  animator.pause();
}

function showThankYouPanel() {
  animationFinished = true;
  pauseInProgress = false;

  const panel = document.getElementById('thank-you-panel');
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';

  document.getElementById('visit-link-button')?.addEventListener('click', () => {
    window.open('https://www.handicapinternational.be/nl/petition/stopbombing', '_blank');
  }, { once: true });

  document.getElementById('visit-link-button-2')?.addEventListener('click', () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe15mp24kB68aT9eyer4Z8bhXlJxJ0qgkP9QeC4BAe4mJdZCg/viewform?usp=header', '_blank');
  }, { once: true });
}

function onUserDoubleTapStart() {
  doubleTapPanel.style.display = 'none';
  handPromptContainer.style.display = 'block';
  showHandPrompt = true;
}

function startExperience() {
  console.log("Starting experience, resetting to anim1");
  animationFinished = false;
  pauseInProgress = false;
  currentAnimationIndex = 0;
  animator.stop();
  animator.setFrames(animations[animationKeys[0]], translate);
  animator.reset();
}

// Audio unlock for iOS
window.addEventListener('touchstart', () => {
  const audio = new Audio();
  audio.play().catch(() => {});
}, { once: true });

// Double tap detection
window.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTapTime < 300) {
    onUserDoubleTapStart();
  }
  lastTapTime = now;
});

window.addEventListener('dblclick', () => {
  onUserDoubleTapStart();
});