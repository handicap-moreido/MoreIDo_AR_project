import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter, checkIfFist } from './handUtils.js';
import { Animator } from './animator.js';
import { animations } from './animations.js';
import { translate, onLanguageChange } from './language.js';

// Sprite image
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
const loadingElement = document.getElementById('loading') || document.createElement('div');
loadingElement.id = 'loading';
loadingElement.style.display = 'none';
loadingElement.style.position = 'fixed';
loadingElement.style.top = '50%';
loadingElement.style.left = '50%';
loadingElement.style.transform = 'translate(-50%, -50%)';
loadingElement.style.color = 'white';
loadingElement.style.fontSize = '24px';
loadingElement.innerText = 'Loading animation...';
document.body.appendChild(loadingElement);

const animationKeys = Object.keys(animations);
let currentAnimationIndex = 0;
let animationFinished = false;
let pauseInProgress = false;
let lastTapTime = 0;
const handPromptContainer = document.getElementById('handPromptContainer');
let showHandPrompt = false;
const loadedAnimations = {};

function preloadFrames(animKeys, callback = null) {
  let toLoad = animKeys.length;
  animKeys.forEach(key => {
    const anim = animations[key];
    const firstFrame = new Image();
    firstFrame.src = anim.frames[0];
    const audio = new Audio(anim.audio);
    audio.preload = 'auto';

    firstFrame.onload = () => {
      loadedAnimations[key] = true;
      toLoad--;
      if (toLoad === 0 && callback) callback();
    };

    firstFrame.onerror = () => {
      console.error(`Failed to preload frame for ${key}`);
      loadedAnimations[key] = true;
      toLoad--;
      if (toLoad === 0 && callback) callback();
    };
  });
}

// Load anim1–anim3 before start
preloadFrames(['anim1', 'anim2', 'anim3'], () => {
  console.log("Initial animations loaded");
  startExperience();
});

// Background load anim4–anim10
let backgroundLoaded = false;
function startBackgroundLoad() {
  if (!backgroundLoaded) {
    console.log('Starting background load for anim4–anim10');
    preloadFrames(['anim4', 'anim5', 'anim6', 'anim7', 'anim8', 'anim9', 'anim10']);
    backgroundLoaded = true;
  }
}

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
    if (animator.interval && animator.subtitleElement) {
      animator.subtitleElement.innerText = translate(animations[key].subtitle);
    }
  }
});

function onAnimationComplete() {
  const currentAnimKey = animationKeys[currentAnimationIndex];
  const currentAnim = animations[currentAnimKey];
  console.log(`Animation ${currentAnimKey} completed`);

  if (currentAnim.requiresGesture) {
    animator.waitForGesture();
    instructionElement.innerText = translate("instructions_show_closed_fist");
  } else {
    if (currentAnimationIndex === 0) {
      startBackgroundLoad();
    }
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

  const nextAnimKey = animationKeys[currentAnimationIndex];
  const nextAnim = animations[nextAnimKey];
  loadingElement.style.display = 'block';

  const preload = new Image();
  preload.src = nextAnim.frames[0];

  preload.onload = () => {
    loadingElement.style.display = 'none';
    animator.setFrames(nextAnim, translate);
    animator.reset();
  };

  preload.onerror = () => {
    loadingElement.innerText = 'Error loading animation';
    console.error(`Failed to load frame: ${nextAnim.frames[0]}`);
  };
}

function pauseBeforePanel() {
  pauseInProgress = true;
  animator.stop();
  spriteImg.style.display = 'none';
  instructionElement.innerText = '';
  setTimeout(() => {
    showThankYouPanel();
  }, 2000);
}

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

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
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

  const baseSpriteSize = 100;
  const scaleX = 3;
  const scaleY = 4;

  const spriteWidth = baseSpriteSize * scaleX;
  const spriteHeight = baseSpriteSize * scaleY;

  const canvasRect = canvasElement.getBoundingClientRect();
  const pixelX = canvasRect.left + x * canvasRect.width;
  const pixelY = canvasRect.top + y * canvasRect.height;

  spriteImg.style.width = `${spriteWidth}px`;
  spriteImg.style.height = `${spriteHeight}px`;
  spriteImg.style.left = `${pixelX - spriteWidth / 2}px`;
  spriteImg.style.top = `${pixelY - spriteHeight / 2}px`;
  spriteImg.style.display = 'block';

  if (!animator.interval) {
    animator.start();
  }
}

function stopAnimation() {
  spriteImg.style.display = 'none';
  animator.stop();
}

function showThankYouPanel() {
  animationFinished = true;
  pauseInProgress = false;
  const panel = document.getElementById('thank-you-panel');
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';

  const button1 = document.getElementById('visit-link-button');
  button1.addEventListener('click', () => {
    window.open('https://www.handicapinternational.be/nl/petition/stopbombing', '_blank');
  }, { once: true });

  const button2 = document.getElementById('visit-link-button-2');
  button2.addEventListener('click', () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe15mp24kB68aT9eyer4Z8bhXlJxJ0qgkP9QeC4BAe4mJdZCg/viewform?usp=header', '_blank');
  }, { once: true });
}

const doubleTapPanel = document.getElementById('doubleTapInstructions');

function onUserDoubleTapStart() {
  doubleTapPanel.style.display = 'none';
  handPromptContainer.style.display = 'block';
  showHandPrompt = true;
}

function startExperience() {
  console.log('Starting experience, resetting to anim1');
  animationFinished = false;
  pauseInProgress = false;
  currentAnimationIndex = 0;
  animator.stop();
  animator.setFrames(animations[animationKeys[0]], translate);
  animator.reset();
}

window.addEventListener('touchstart', () => {
  const audio = new Audio();
  audio.play().catch(() => {});
}, { once: true });

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
