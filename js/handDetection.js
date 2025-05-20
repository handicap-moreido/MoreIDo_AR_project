import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter } from './handUtils.js';
import { Animator } from './animator.js';
import { animations } from './animations.js';

const spriteImg = document.createElement('img');
spriteImg.className = 'sprite-animation';
document.body.appendChild(spriteImg);

const animationKeys = Object.keys(animations);
let currentAnimationIndex = 0;
let animator = new Animator(spriteImg, animations[animationKeys[0]], 12, onAnimationComplete);

function onAnimationComplete() {
  currentAnimationIndex++;
  if (currentAnimationIndex >= animationKeys.length) {
    // Restart from first animation or stop playing - your choice
    currentAnimationIndex = 0;
  }
  animator.setFrames(animations[animationKeys[currentAnimationIndex]]);
  animator.reset();
  animator.start();
}

export function onResults(results) {
  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const isPalmOpen = checkIfPalmOpen(landmarks);

    if (isPalmOpen) {
      const handCenter = calculateHandCenter(landmarks);
      drawSpriteAtPalm(handCenter.x, handCenter.y);
      document.getElementById('instructions').innerText = "";
    } else {
      stopAnimation();
      document.getElementById('instructions').innerText = "Show your palm!";
    }
  } else {
    stopAnimation();
    document.getElementById('instructions').innerText = "Show your hand to start!";
  }

  canvasCtx.restore();
}

function drawSpriteAtPalm(x, y) {
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
  currentAnimationIndex = 0; // reset to start from first animation next time
}
