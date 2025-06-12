import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter, checkIfFist } from './handUtils.js';
import { Animator } from './animator.js';
import { animations } from './animations.js';
import { translate, onLanguageChange } from './language.js';
import { playMusic, stopMusic } from './backgroundMusic.js';

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
const instructionElementCenter = document.getElementById('centered-instruction') || document.createElement('div');
instructionElementCenter.id = 'centered-instruction';
instructionElementCenter.className = 'centered-instruction';
instructionElementCenter.style.display = 'none'; // Ensure it's hidden by default
document.body.appendChild(instructionElementCenter); // Ensure it's in the DOM
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
let currentBackgroundTrack = 'default'; // Track open palm music ('default' or 'gesture')
let hasStartedTracking = false; // Control hand tracking start
const preloadStatus = {};
let totalAssets = 0;
let loadedAssets = 0;

let audioUnlocked = false; // Flag to unlock audio only once
let experienceStarted = false;

let countdownStartTime = null;
const countdownElement = document.getElementById('gestureCountdown');

const thankYouAudio = new Audio('Assets/Audio/anim11.mp3'); // Update path if needed
thankYouAudio.preload = 'auto';

// Calculate total assets to preload
animationKeys.forEach(key => {
  const anim = animations[key];
  totalAssets += anim.frames.length + 1; // Frames + audio
  if (anim.gestureSfx) {
    totalAssets++; // Count gesture SFX too
  }
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

    // Preload gesture sound effect if it exists
    if (anim.gestureSfx) {
      const gestureAudio = new Audio();
      gestureAudio.src = anim.gestureSfx;
      gestureAudio.preload = 'auto';
      gestureAudio.oncanplaythrough = () => updateProgress();
      gestureAudio.onerror = () => {
        //console.warn(`Failed to load gesture SFX: ${anim.gestureSfx}`);
        updateProgress();
      };
      anim.preloadedGestureSfx = gestureAudio;
    }

    // Preload main animation audio
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

  // Preload thank-you panel audio
  thankYouAudio.oncanplaythrough = () => updateProgress();
  thankYouAudio.onerror = () => {
    //console.warn(`Failed to load thank you audio`);
    updateProgress();
  };

  // Manually increase totalAssets count for thank-you audio
  totalAssets++;

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

// Unlock all audio on first user interaction
function unlockAllAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // Trigger loading of preloaded animation and gesture audio
  animationKeys.forEach(key => {
    const anim = animations[key];
    anim.preloadedAudio?.load();
    anim.preloadedGestureSfx?.load();
  });

  // Trigger loading of thank-you panel audio
  thankYouAudio.load();

  console.log('Audio unlocked and preloaded silently');
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
    playMusic(currentBackgroundTrack);
  }
});

function onAnimationComplete() {
  const currentKey = animationKeys[currentAnimationIndex];
  const currentAnim = animations[currentKey];
  //console.log(`Animation ${currentKey} completed`);

  if (currentAnim.requiresGesture) {
    //console.log('Prompting for closed fist');
    animator.waitForGesture();
    instructionElementCenter.style.display = 'block';
    instructionElementCenter.innerText = translate("instructions_show_closed_fist");
    instructionElement.innerText = ''; // Clear other instruction element
    instructionElement.style.display = 'none';
  } else {
    advanceToNextAnimation();
    animator.start();
    instructionElement.innerText = '';
    instructionElementCenter.style.display = 'none';
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
  // Reset to default music for anim4 and beyond
  if (currentAnimationIndex >= 3) { // After anim3
    console.log(`Advancing to ${nextKey}, setting default background track`);
    currentBackgroundTrack = 'default';
    playMusic('default');
  }
}

function pauseBeforePanel() {
  pauseInProgress = true;
  animator.stop();
  spriteImg.style.display = 'none';
  instructionElement.innerText = '';
  instructionElementCenter.style.display = 'none';
  stopMusic();
  currentBackgroundTrack = 'default';
  setTimeout(() => showThankYouPanel(), 10);
}

export function onResults(results) {
  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (!hasStartedTracking || pauseInProgress || animationFinished) {
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
      // If waiting for palm open after fist hold completed
      if (animator.waitingForPalmOpenAfterFist) {
        if (checkIfPalmOpen(landmarks)) {
          animator.waitingForPalmOpenAfterFist = false;
          countdownStartTime = null;
          animator.gestureDetected();
          instructionElementCenter.style.display = 'none';
          instructionElement.innerText = '';
          //console.log('Palm opened after fist hold, advancing animation');
          currentBackgroundTrack = 'gesture';
          advanceToNextAnimation();
          animator.start();
        } else {
          instructionElement.innerText = translate("instructions_show_palm");
          instructionElement.style.display = 'block';
          instructionElementCenter.style.display = 'none';
          countdownElement.style.display = 'none';
          spriteImg.style.display = 'none';
        }
        canvasCtx.restore();
        return;
      }

      const fistDetected = checkIfFist(landmarks);

      if (!countdownStartTime && fistDetected) {
        // First time fist detected — start countdown timer and play SFX
        countdownStartTime = Date.now();

        const currentKey = animationKeys[currentAnimationIndex];
        const currentAnim = animations[currentKey];

        if (currentAnim.gestureSfx && !animator.gestureSfxPlayed) {
          const sfx = currentAnim.preloadedGestureSfx;
          if (sfx) {
            sfx.currentTime = 0;
            sfx.play().catch(err => console.warn("Failed to play gesture SFX:", err));
          }
          animator.gestureSfxPlayed = true;
        }
      }

      if (countdownStartTime) {
        const elapsedSeconds = (Date.now() - countdownStartTime) / 1000;
        const remaining = Math.max(0, Math.ceil(3 - elapsedSeconds));

        if (fistDetected) {
          // Show countdown and hide sprite while holding fist
          countdownElement.style.display = 'block';
          countdownElement.innerText = remaining.toString();
          spriteImg.style.display = 'none';
          instructionElementCenter.style.display = 'none';
          instructionElement.innerText = '';
        } else {
          // Fist opened early, hide countdown and sprite, but don't reset countdown timer
          countdownElement.style.display = 'none';
          spriteImg.style.display = 'none';
          instructionElementCenter.style.display = 'block';
          instructionElementCenter.innerText = translate("instructions_show_closed_fist");
          instructionElement.innerText = '';
        }

        if (elapsedSeconds >= 3) {
          // Countdown done, but wait for palm open before continuing
          countdownElement.style.display = 'none';
          instructionElement.innerText = translate("instructions_show_palm");
          instructionElement.style.display = 'block';
          instructionElementCenter.style.display = 'none';
          animator.waitingForPalmOpenAfterFist = true;
        }
      } else {
        // No fist detected yet, just prompt user
        instructionElementCenter.style.display = 'block';
        instructionElementCenter.innerText = translate("instructions_show_closed_fist");
        instructionElement.innerText = '';
        countdownElement.style.display = 'none';
        spriteImg.style.display = 'none';
      }

      canvasCtx.restore();
      return;
    }

    if (checkIfPalmOpen(landmarks)) {
      playMusic(currentBackgroundTrack);
      const handCenter = calculateHandCenter(landmarks);
      drawSpriteAtPalm(handCenter.x, handCenter.y);
      instructionElement.innerText = '';
      instructionElementCenter.style.display = 'none';

      if (!animator.rafId && loadedAssets >= totalAssets) {
        //console.log('Palm detected, resuming animation');
        animator.resume();
      }
    } else {
      stopAnimation();
      if (hasStartedTracking) {
        instructionElement.style.display = 'block';
        instructionElement.innerText = translate("instructions_show_palm");
        instructionElementCenter.style.display = 'none';
      }
    }
  } else {
    stopAnimation();
    if (hasStartedTracking) {
      instructionElement.style.display = 'block';
      instructionElement.innerText = translate("instructions_start");
      instructionElementCenter.style.display = 'none';
    }
    stopMusic();
    currentBackgroundTrack = 'default';
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
  stopMusic();
  currentBackgroundTrack = 'default';
  instructionElementCenter.style.display = 'none'; // Ensure centered instruction is hidden
}

function showThankYouPanel() {
  animationFinished = true;
  pauseInProgress = false;

  const panel = document.getElementById('thank-you-panel');
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';

  // Play thank you audio
  if (thankYouAudio) {
    thankYouAudio.currentTime = 0;
    // thankYouAudio.play().catch(err => {
    //   console.warn('Failed to play thank you audio:', err);
    // });
  }

  document.getElementById('visit-link-button')?.addEventListener('click', () => {
    window.open('https://www.handicapinternational.be/nl/petition/stopbombing', '_blank');
  }, { once: true });

  document.getElementById('visit-link-button-2')?.addEventListener('click', () => {
    window.open('https://donate.handicapinternational.be/make-a-gift/~mijn-donatie?_gl=1%2Ali1rln%2A_gcl_au%2AMTczNzkxMjY0OC4xNzQ2NDYwNzM2%2A_ga%2AMTk2MjcyMTE0MC4xNzE0NjQ4OTMy%2A_ga_875BW6Q4LX%2AczE3NDkyMjI4NzgkbzI4NSRnMCR0MTc0OTIyMjg3OCRqNjAkbDAkaDA.', '_blank');
  }, { once: true });

  document.getElementById('visit-link-button-3')?.addEventListener('click', () => {
    window.open('https://www.handicapinternational.be/nl/revalidatiezorg', '_blank');
  }, { once: true });
}

function onUserDoubleTapStart() {
  //console.log('Double-tap/click detected, starting hand tracking');
  doubleTapPanel.style.display = 'none'; // Hide double tap panel immediately
  handPromptContainer.style.display = 'block';
  showHandPrompt = true;
  hasStartedTracking = true;
}

function startExperience() {
  if (experienceStarted) return;
  experienceStarted = true;
  animationFinished = false;
  pauseInProgress = false;
  currentAnimationIndex = 0;
  currentBackgroundTrack = 'default';
  hasStartedTracking = false;
  animator.stop();
  animator.setFrames(animations[animationKeys[0]], translate);
  animator.reset();
  doubleTapPanel.style.display = 'block';
  handPromptContainer.style.display = 'none';
  instructionElement.innerText = translate("instructions_double_tap");
  instructionElementCenter.style.display = 'none';
}

// Unlock audio on first user interaction (touch or mouse)
window.addEventListener('touchstart', () => {
  unlockAllAudio();
}, { once: true });

window.addEventListener('mousedown', () => {
  unlockAllAudio();
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