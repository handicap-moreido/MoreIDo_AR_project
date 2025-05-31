import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter, checkIfFist } from './handUtils.js';
import { Animator } from './animator.js';
import { animations } from './animations.js';
import { translate, onLanguageChange } from './language.js';

//Create and style the sprite image used for animations
const spriteImg = document.createElement('img');
spriteImg.className = 'sprite-animation';

spriteImg.style.position = 'fixed';
spriteImg.style.width = '100px';
spriteImg.style.height = '100px';
spriteImg.style.pointerEvents = 'none';
spriteImg.style.display = 'none';

document.body.appendChild(spriteImg);

//Get subtitle and instruction elements from the DOM
const subtitleElement = document.getElementById('subtitle');
const instructionElement = document.getElementById('instructions');

//Setup animation keys and tracking variables
const animationKeys = Object.keys(animations);
let currentAnimationIndex = 0;
let animationFinished = false;
let pauseInProgress = false;

//Create animator object to handle sprite animation
let animator = new Animator(
  spriteImg,
  animations[animationKeys[0]],
  12,
  onAnimationComplete,
  subtitleElement,
  translate
);

//Update subtitles and animation frames if language changes
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

//Called when current animation finishes playing
function onAnimationComplete() {
  const currentAnim = animations[animationKeys[currentAnimationIndex]];

  if (currentAnim.requiresGesture) {
    //Pause and wait for fist gesture
    animator.waitForGesture();
    instructionElement.innerText = translate("instructions_show_closed_fist");
  } else {
    //Go to next animation immediately
    advanceToNextAnimation();
  }
}

//Advances to the next animation in the sequence
function advanceToNextAnimation() {
  currentAnimationIndex++;

  if (currentAnimationIndex >= animationKeys.length) {
    pauseBeforePanel();
    return;
  }

  //Reset gesture pause state before starting new animation
  animator.isPausedForGesture = false;

  const nextAnim = animations[animationKeys[currentAnimationIndex]];
  animator.setFrames(nextAnim, translate);
  animator.reset();

  animator.start();

  instructionElement.innerText = ""; //Clear any instructions
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
    const landmarks = results.multiHandLandmarks[0];

    if (animator.isPausedForGesture) {
      //Waiting for fist gesture
      if (checkIfFist(landmarks)) {
        //Gesture detected, resume animation and advance
        animator.gestureDetected();
        instructionElement.innerText = "";
        advanceToNextAnimation();
      } else {
        //Still waiting for fist gesture
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

  const spriteWidth = 300;
  const spriteHeight = 250;

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
  //DO NOT reset currentAnimationIndex here so progress isn't lost
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
