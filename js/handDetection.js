import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter, checkIfFist } from './handUtils.js';
import { Animator } from './animator.js';
import { animations } from './animations.js';
import { translate, onLanguageChange } from './language.js';

//Preload all animation frames to prevent lag
Object.values(animations).forEach(anim => {
  anim.frames.forEach(url => {
    const img = new Image();
    img.src = url;
  });
});

// Create and style the sprite image used for animations
const spriteImg = document.createElement('img');
spriteImg.className = 'sprite-animation';

spriteImg.style.position = 'fixed';
spriteImg.style.width = '100px';
spriteImg.style.height = '100px';
spriteImg.style.pointerEvents = 'none';
spriteImg.style.display = 'none';

document.body.appendChild(spriteImg);

// Get subtitle and instruction elements from the DOM
const subtitleElement = document.getElementById('subtitle');
const instructionElement = document.getElementById('instructions');

// Setup animation keys and tracking variables
const animationKeys = Object.keys(animations);
let currentAnimationIndex = 0;
let animationFinished = false;
let pauseInProgress = false;

let lastTapTime = 0;

const handPromptContainer = document.getElementById('handPromptContainer');
let showHandPrompt = false;

// Create animator object to handle sprite animation
let animator = new Animator(
  spriteImg,
  animations[animationKeys[0]],
  24,
  onAnimationComplete,
  subtitleElement,
  translate
);

// Update subtitles and animation frames if language changes
onLanguageChange(() => {
  if (!animationFinished && !pauseInProgress) {
    const key = animationKeys[currentAnimationIndex];
    if (key) {
      animator.setFrames(animations[key], translate);
      if (animator.interval && animator.subtitleElement) {
        animator.subtitleElement.innerText = translate(animations[key].subtitle);
      }
    }
  }
});

// Called when current animation finishes playing
function onAnimationComplete() {
  const currentAnim = animations[animationKeys[currentAnimationIndex]];

  if (currentAnim.requiresGesture) {
    // Pause and wait for fist gesture
    animator.waitForGesture();
    instructionElement.innerText = translate("instructions_show_closed_fist");
  } else {
    // Go to next animation immediately
    advanceToNextAnimation();
  }
}

// Advances to the next animation in the sequence
function advanceToNextAnimation() {
  currentAnimationIndex++;

  if (currentAnimationIndex >= animationKeys.length) {
    pauseBeforePanel();
    return;
  }

  // Reset gesture pause state before starting new animation
  animator.isPausedForGesture = false;

  const nextAnim = animations[animationKeys[currentAnimationIndex]];
  animator.setFrames(nextAnim, translate);
  animator.reset(); // This reset is okay here for new animation
  animator.start();

  instructionElement.innerText = ""; // Clear any instructions
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
      // Waiting for fist gesture
      if (checkIfFist(landmarks)) {
        // Gesture detected, resume animation and advance
        animator.gestureDetected();
        instructionElement.innerText = "";
        advanceToNextAnimation();
      } else {
        // Still waiting for fist gesture
        instructionElement.innerText = translate("instructions_show_closed_fist");
      }
      canvasCtx.restore();
      return;
    }

    if (checkIfPalmOpen(landmarks)) {
      const handCenter = calculateHandCenter(landmarks);
      drawSpriteAtPalm(handCenter.x, handCenter.y);
      instructionElement.innerText = "";
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

  // Convert normalized (x,y) to canvas pixel coords
  const canvasRect = canvasElement.getBoundingClientRect();

  const pixelX = canvasRect.left + x * canvasRect.width;
  const pixelY = canvasRect.top + y * canvasRect.height;

  // Center the sprite on the hand center point
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
  animator.stop(); // Only stop, don't reset
  // animator.reset();
}

function showThankYouPanel() {
  animationFinished = true;
  pauseInProgress = false;
  const panel = document.getElementById('thank-you-panel');
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';

  // Existing button event
  const button1 = document.getElementById('visit-link-button');
  button1.addEventListener('click', () => {
    window.open('https://www.handicapinternational.be/nl/petition/stopbombing', '_blank');
  }, { once: true });

  // New button event
  const button2 = document.getElementById('visit-link-button-2');
  button2.addEventListener('click', () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe15mp24kB68aT9eyer4Z8bhXlJxJ0qgkP9QeC4BAe4mJdZCg/viewform?usp=header', '_blank');
  }, { once: true });
}

const doubleTapPanel = document.getElementById('doubleTapInstructions');

function onUserDoubleTapStart() {
  doubleTapPanel.style.display = 'none';

  // Show hand detection prompt GIF
  handPromptContainer.style.display = 'block';
  showHandPrompt = true;

  startExperience(); // just clears pause states
}

function startExperience() {
  // Only show animation when a palm is detected in onResults
  animationFinished = false;
  pauseInProgress = false;
}

//detect double tap
window.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTapTime < 300) {
    onUserDoubleTapStart();
  }
  lastTapTime = now;
});

// Desktop: detect double click
window.addEventListener('dblclick', () => {
  onUserDoubleTapStart();
});