import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter } from './handUtils.js';
import { Animator } from './animator.js';
import { animations } from './animations.js';
import { translate, onLanguageChange } from './language.js';

const spriteImg = document.createElement('img');
spriteImg.className = 'sprite-animation';

// Set styles for sprite image
spriteImg.style.position = 'fixed';
spriteImg.style.width = '100px';
spriteImg.style.height = '100px';
spriteImg.style.pointerEvents = 'none';
spriteImg.style.display = 'none';

document.body.appendChild(spriteImg);

const subtitleElement = document.getElementById('subtitle');
const instructionElement = document.getElementById('instructions');

const animationKeys = Object.keys(animations);
let currentAnimationIndex = 0;
let animationFinished = false;
let pauseInProgress = false;

let animator = new Animator(
  spriteImg,
  animations[animationKeys[0]],
  12,
  onAnimationComplete,
  subtitleElement,
  translate
);

// Subscribe to language changes to update subtitle live
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

function onAnimationComplete() {
  currentAnimationIndex++;
  if (currentAnimationIndex >= animationKeys.length) {
    pauseBeforePanel();
  } else {
    animator.setFrames(animations[animationKeys[currentAnimationIndex]], translate);
    animator.reset();
    animator.start();
  }
}

function pauseBeforePanel() {
  pauseInProgress = true;
  animator.stop();
  spriteImg.style.display = 'none';
  instructionElement.innerText = '';
  setTimeout(() => {
    showThankYouPanel();
  }, 2000); // 2 second pause before showing panel
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
    const landmarks = results.multiHandLandmarks[0];
    const isPalmOpen = checkIfPalmOpen(landmarks);

    if (isPalmOpen) {
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

  const spriteWidth = 100;
  const spriteHeight = 100;

  spriteImg.style.left = `${x * window.innerWidth - spriteWidth / 2}px`;
  spriteImg.style.top = `${y * window.innerHeight - spriteHeight / 2}px`;
  spriteImg.style.display = 'block';

  if (!animator.interval) {
    animator.start();
  }
}

function stopAnimation() {
  spriteImg.style.display = 'none';
  animator.stop();
  animator.reset();
  currentAnimationIndex = 0;
}

function showThankYouPanel() {
  animationFinished = true;
  pauseInProgress = false;
  const panel = document.getElementById('thank-you-panel');
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';

  const button = document.getElementById('visit-link-button');
  button.addEventListener('click', () => {
    window.open('https://www.handicapinternational.be/', '_blank');
  }, { once: true });
}
