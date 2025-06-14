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
spriteImg.style.width = '300px';
spriteImg.style.height = '400px';
spriteImg.style.pointerEvents = 'none';
spriteImg.style.visibility = 'hidden';
spriteImg.style.transform = 'translate(-50%, -50%)';
document.body.appendChild(spriteImg);

// UI elements
const subtitleElement = document.getElementById('subtitle');
const instructionElement = document.getElementById('instructions') || document.createElement('div');
instructionElement.id = 'instructions';
instructionElement.style.position = 'fixed';
instructionElement.style.bottom = '20px';
instructionElement.style.width = '100%';
instructionElement.style.textAlign = 'center';
instructionElement.style.color = 'white';
instructionElement.style.visibility = 'hidden';
document.body.appendChild(instructionElement);

const instructionElementCenter = document.getElementById('centered-instruction') || document.createElement('div');
instructionElementCenter.id = 'centered-instruction';
instructionElementCenter.className = 'centered-instruction';
instructionElementCenter.style.position = 'fixed';
instructionElementCenter.style.top = '50%';
instructionElementCenter.style.left = '50%';
instructionElementCenter.style.transform = 'translate(-50%, -50%)';
instructionElementCenter.style.width = '300px';
instructionElementCenter.style.textAlign = 'center';
instructionElementCenter.style.color = 'white';
instructionElementCenter.style.visibility = 'hidden';
document.body.appendChild(instructionElementCenter);

const handPromptContainer = document.getElementById('handPromptContainer') || document.createElement('div');
handPromptContainer.id = 'handPromptContainer';

const doubleTapPanel = document.getElementById('doubleTapInstructions') || document.createElement('div');
doubleTapPanel.id = 'doubleTapInstructions';
doubleTapPanel.style.position = 'fixed';
doubleTapPanel.style.width = '100%';
doubleTapPanel.style.height = '100%';
doubleTapPanel.style.visibility = 'hidden';
document.body.appendChild(doubleTapPanel);

const loadingElement = document.getElementById('loading') || document.createElement('div');
loadingElement.id = 'loading';
loadingElement.style.position = 'fixed';
loadingElement.style.top = '50%';
loadingElement.style.left = '50%';
loadingElement.style.transform = 'translate(-50%, -50%)';
loadingElement.style.width = '200px';
loadingElement.style.color = 'white';
loadingElement.style.fontSize = '24px';
loadingElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
loadingElement.style.padding = '20px';
loadingElement.style.borderRadius = '10px';
loadingElement.style.visibility = 'visible';
loadingElement.innerText = 'Loading assets... 0%';
document.body.appendChild(loadingElement);

// Animation control
const animationKeys = Object.keys(animations);
let currentAnimationIndex = 0;
let animationFinished = false;
let pauseInProgress = false;
let lastTapTime = 0;
let showHandPrompt = false;
let currentBackgroundTrack = 'default';
let hasStartedTracking = false;
let shouldPlayMusic = false;
let lastAdvanceTime = 0; // Debounce advanceToNextAnimation
const preloadStatus = {};
let totalAssets = 0;
let loadedAssets = 0;
let totalAudioAssets = 0;
let loadedAudioAssets = 0;
let totalFrameAssets = 0;
let loadedFrameAssets = 0;

let audioUnlocked = false;
let experienceStarted = false;

let countdownStartTime = null;
const countdownElement = document.getElementById('gestureCountdown');

const thankYouAudio = new Audio('Assets/Audio/anim11.mp3');
thankYouAudio.preload = 'auto';
let thankYouAudioLoaded = false;

// Calculate assets for all animations
animationKeys.forEach(key => {
  const anim = animations[key];
  totalFrameAssets += anim.frames.length;
  totalAudioAssets += 1;
  if (anim.gestureSfx) {
    totalAudioAssets++;
  }
});

totalAudioAssets++; // Thank-you audio
totalAssets = totalAudioAssets + totalFrameAssets;

// Preload all assets (anim1 to anim10)
function preloadAllAssets(callback) {
  function preloadAudio(onAudioComplete) {
    animationKeys.forEach(key => {
      const anim = animations[key];
      if (preloadStatus[key]) return;

      if (anim.gestureSfx) {
        const gestureAudio = new Audio();
        gestureAudio.src = anim.gestureSfx;
        gestureAudio.preload = 'auto';
        gestureAudio.oncanplaythrough = () => {
          anim.gestureSfxLoaded = true;
          updateAudioProgress();
        };
        gestureAudio.onerror = () => {
          anim.gestureSfxLoaded = true;
          updateAudioProgress();
        };
        anim.preloadedGestureSfx = gestureAudio;
      }

      const audio = new Audio();
      audio.src = anim.audio;
      audio.preload = 'auto';
      audio.oncanplaythrough = () => {
        anim.audioLoaded = true;
        updateAudioProgress();
      };
      audio.onerror = () => {
        anim.audioLoaded = true;
        updateAudioProgress();
      };
      anim.preloadedAudio = audio;

      preloadStatus[key] = false;
    });

    thankYouAudio.oncanplaythrough = () => {
      thankYouAudioLoaded = true;
      updateAudioProgress();
    };
    thankYouAudio.onerror = () => {
      thankYouAudioLoaded = true;
      updateAudioProgress();
    };

    function updateAudioProgress() {
      loadedAudioAssets++;
      updateProgress();
      if (loadedAudioAssets >= totalAudioAssets) {
        onAudioComplete();
      }
    }
  }

  function preloadFrames() {
    animationKeys.forEach(key => {
      const anim = animations[key];
      if (preloadStatus[key]) return;

      const images = anim.frames.map(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          updateFrameProgress();
        };
        img.onerror = () => {
          updateFrameProgress();
        };
        return img;
      });

      anim.preloadedImages = images;
    });

    function updateFrameProgress() {
      loadedFrameAssets++;
      updateProgress();
    }
  }

  function updateProgress() {
    loadedAssets = loadedAudioAssets + loadedFrameAssets;
    const progress = Math.round((loadedAssets / totalAssets) * 100);
    loadingElement.innerText = `Loading assets... ${progress}%`;
    if (loadedAssets >= totalAssets) {
      animationKeys.forEach(k => preloadStatus[k] = true);
      loadingElement.style.visibility = 'hidden';
      if (callback) callback();
    }
  }

  preloadAudio(() => preloadFrames());
}

// Unlock all audio on first user interaction
function unlockAllAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  animationKeys.forEach(key => {
    const anim = animations[key];
    if (anim.preloadedAudio && !anim.audioLoaded) {
      anim.preloadedAudio.load();
    }
    if (anim.preloadedGestureSfx && !anim.gestureSfxLoaded) {
      anim.preloadedGestureSfx.load();
    }
  });

  if (!thankYouAudioLoaded) {
    thankYouAudio.load();
  }

  console.log('Audio unlocked');
}

// Start preloading all assets
preloadAllAssets(() => {
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
  if (!animationFinished && !pauseInProgress && hasStartedTracking && shouldPlayMusic) {
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

  if (currentAnim.requiresGesture) {
    animator.waitForGesture();
    instructionElementCenter.style.visibility = 'visible';
    instructionElementCenter.innerText = translate("instructions_show_closed_fist");
    instructionElement.innerText = '';
    instructionElement.style.visibility = 'hidden';
    shouldPlayMusic = false;
    stopMusic();
  } else {
    advanceToNextAnimation();
    animator.start();
    instructionElement.innerText = '';
    instructionElementCenter.style.visibility = 'hidden';
  }
}

function advanceToNextAnimation() {
  const now = Date.now();
  if (now - lastAdvanceTime < 500) {
    return;
  }
  lastAdvanceTime = now;

  if (animationKeys[currentAnimationIndex] === 'anim10') {
    pauseBeforePanel();
    return;
  }

  if (currentAnimationIndex >= animationKeys.length - 1) {
    return;
  }

  currentAnimationIndex++;
  const nextKey = animationKeys[currentAnimationIndex];
  const nextAnim = animations[nextKey];

  // Reset animator state
  animator.isPausedForGesture = false;
  animator.waitingForPalmOpenAfterFist = false;
  clearTimeout(animator.gestureTimeout);
  animator.gestureTimeout = null;

  if (!preloadStatus[nextKey]) {
    const fallbackAnim = { ...nextAnim, frames: [nextAnim.frames[0] || ''], preloadedImages: [nextAnim.preloadedImages?.[0] || new Image()] };
    startNextAnimation(fallbackAnim, nextKey);
  } else {
    startNextAnimation(nextAnim, nextKey);
  }
}

function startNextAnimation(nextAnim, nextKey) {
  animator.setFrames(nextAnim);
  animator.reset();
  animator.start();
  shouldPlayMusic = true;
  if (currentAnimationIndex >= 3) {
    currentBackgroundTrack = 'default';
    playMusic('default');
  }

  // Watchdog to ensure animation starts
  setTimeout(() => {
    if (animationKeys[currentAnimationIndex] === nextKey && !animator.isPlaying) {
      animator.start();
    }
  }, 2000);
}

function pauseBeforePanel() {
  if (animationKeys[currentAnimationIndex] !== 'anim10' || currentAnimationIndex !== 9) {
    return;
  }
  pauseInProgress = true;
  animator.stop();
  spriteImg.style.visibility = 'hidden';
  instructionElement.innerText = '';
  instructionElementCenter.style.visibility = 'hidden';
  stopMusic();
  shouldPlayMusic = false;
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
      handPromptContainer.style.visibility = 'hidden';
      showHandPrompt = false;
    }

    const landmarks = results.multiHandLandmarks[0];

    if (animator.isPausedForGesture) {
      if (animator.waitingForPalmOpenAfterFist) {
        if (checkIfPalmOpen(landmarks)) {
          animator.waitingForPalmOpenAfterFist = false;
          animator.isPausedForGesture = false;
          countdownStartTime = null;
          animator.gestureDetected();
          instructionElementCenter.style.visibility = 'hidden';
          instructionElement.innerText = '';
          clearTimeout(animator.gestureTimeout);
          animator.gestureTimeout = null;
          console.log('Mobile: Palm opened after fist hold, advancing animation');
          currentBackgroundTrack = 'gesture';
          shouldPlayMusic = true;
          advanceToNextAnimation();
        } else {
          instructionElement.innerText = translate("instructions_show_palm");
          instructionElement.style.visibility = 'visible';
          instructionElementCenter.style.visibility = 'hidden';
          countdownElement.style.visibility = 'hidden';
          spriteImg.style.visibility = 'hidden';

          if (!animator.gestureTimeout) {
            animator.gestureTimeout = setTimeout(() => {
              animator.waitingForPalmOpenAfterFist = false;
              animator.isPausedForGesture = false;
              countdownStartTime = null;
              animator.gestureDetected();
              instructionElementCenter.style.visibility = 'hidden';
              instructionElement.innerText = '';
              clearTimeout(animator.gestureTimeout);
              animator.gestureTimeout = null;
              currentBackgroundTrack = 'gesture';
              shouldPlayMusic = true;
              advanceToNextAnimation();
            }, 5000);
          }
        }
        canvasCtx.restore();
        return;
      }

      const fistDetected = checkIfFist(landmarks);

      if (!countdownStartTime && fistDetected) {
        countdownStartTime = Date.now();

        const currentKey = animationKeys[currentAnimationIndex];
        const currentAnim = animations[currentKey];

        if (currentAnim.gestureSfx && !animator.gestureSfxPlayed) {
          const sfx = currentAnim.preloadedGestureSfx;
          if (sfx) {
            sfx.currentTime = 0;
            sfx.play().catch(err => console.warn("Mobile: Failed to play gesture SFX:", err));
          }
          animator.gestureSfxPlayed = true;
        }
      }

      if (countdownStartTime) {
        const elapsedSeconds = (Date.now() - countdownStartTime) / 1000;
        const remaining = Math.max(0, Math.ceil(3 - elapsedSeconds));

        if (fistDetected) {
          countdownElement.style.visibility = 'visible';
          countdownElement.innerText = remaining.toString();
          spriteImg.style.visibility = 'hidden';
          instructionElementCenter.style.visibility = 'hidden';
          instructionElement.innerText = '';
        } else {
          countdownElement.style.visibility = 'hidden';
          spriteImg.style.visibility = 'hidden';
          instructionElementCenter.style.visibility = 'visible';
          instructionElementCenter.innerText = translate("instructions_show_closed_fist");
          instructionElement.innerText = '';
        }

        if (elapsedSeconds >= 3) {
          countdownElement.style.visibility = 'hidden';
          instructionElement.innerText = translate("instructions_show_palm");
          instructionElement.style.visibility = 'visible';
          instructionElementCenter.style.visibility = 'hidden';
          animator.waitingForPalmOpenAfterFist = true;
          clearTimeout(animator.gestureTimeout);
          animator.gestureTimeout = null;
        }
      } else {
        instructionElementCenter.style.visibility = 'visible';
        instructionElementCenter.innerText = translate("instructions_show_closed_fist");
        instructionElement.innerText = '';
        countdownElement.style.visibility = 'hidden';
        spriteImg.style.visibility = 'hidden';
      }

      canvasCtx.restore();
      return;
    }

    if (checkIfPalmOpen(landmarks)) {
      const handCenter = calculateHandCenter(landmarks);
      drawSpriteAtPalm(handCenter.x, handCenter.y);
      instructionElement.innerText = '';
      instructionElementCenter.style.visibility = 'hidden';

      if (preloadStatus[animationKeys[currentAnimationIndex]] && shouldPlayMusic) {
        playMusic(currentBackgroundTrack);
      }
      if (!animator.rafId && preloadStatus[animationKeys[currentAnimationIndex]]) {
        animator.resume();
      }
    } else {
      stopAnimation();
      if (hasStartedTracking) {
        instructionElement.style.visibility = 'visible';
        instructionElement.innerText = translate("instructions_show_palm");
        instructionElementCenter.style.visibility = 'hidden';
      }
    }
  } else {
    stopAnimation();
    if (hasStartedTracking) {
      instructionElement.style.visibility = 'visible';
      instructionElement.innerText = translate("instructions_start");
      instructionElementCenter.style.visibility = 'hidden';
    }
    stopMusic();
    shouldPlayMusic = false;
    currentBackgroundTrack = 'default';
  }

  canvasCtx.restore();
}

function drawSpriteAtPalm(x, y) {
  if (animationFinished || pauseInProgress) return;

  const rect = canvasElement.getBoundingClientRect();
  const px = rect.left + x * rect.width;
  const py = rect.top + y * rect.height;

  spriteImg.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
  spriteImg.style.visibility = 'visible';

  if (!animator.rafId) {
    animator.start();
    shouldPlayMusic = true;
  }
}

function stopAnimation() {
  spriteImg.style.visibility = 'hidden';
  animator.pause();
  stopMusic();
  shouldPlayMusic = false;
  instructionElementCenter.style.visibility = 'hidden';
  clearTimeout(animator.gestureTimeout);
  animator.gestureTimeout = null;
}

function showThankYouPanel() {
  if (animationKeys[currentAnimationIndex] !== 'anim10' || currentAnimationIndex !== 9) {
    console.error(`Attempted to show thank-you panel at wrong index: ${currentAnimationIndex}, key: ${animationKeys[currentAnimationIndex]}`);
    return;
  }
  animationFinished = true;
  pauseInProgress = false;

  const panel = document.getElementById('thank-you-panel');
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';

  if (thankYouAudio && thankYouAudioLoaded) {
    thankYouAudio.currentTime = 0;
    thankYouAudio.play().catch(err => console.warn('Failed to play thank you audio:', err));
  }

  document.getElementById('visit-link-button')?.addEventListener('click', () => {
    window.open('https://www.handicapinternational.be/nl/petition/stopbombing', '_blank');
  }, { once: true });

  document.getElementById('visit-link-button-2')?.addEventListener('click', () => {
    window.open('https://donate.handicapinternational.be/make-a-gift/~mijn-donatie?_gl=1%2Ali1rln%2A_gcl_au%2AMTczNzkxMjY0OC4xNzQ2NDYwNzM2%2A_ga%2AMTk2MjcyMTE0MC4xNzE0NjQ4OTMy%2A_ga_875BW6Q4LX%2AczE3NDkyMjI4NzgkbzI4NSRnMCR0MTc0OTIyMjg3OCRqNjAkbDAkaDA.', '_blank');
  }, { once: true });
}

export function onUserDoubleTapStart() {
  doubleTapPanel.style.visibility = 'hidden';
  handPromptContainer.style.visibility = 'visible';
  showHandPrompt = true;
  hasStartedTracking = true;
  shouldPlayMusic = true;
}

export function startExperience() {
  if (experienceStarted) return;
  experienceStarted = true;
  animationFinished = false;
  pauseInProgress = false;
  currentAnimationIndex = 0;
  currentBackgroundTrack = 'default';
  hasStartedTracking = false;
  shouldPlayMusic = false;
  animator.stop();
  animator.setFrames(animations[animationKeys[0]], translate);
  animator.reset();
  doubleTapPanel.style.visibility = 'visible';
  handPromptContainer.style.visibility = 'hidden';
  instructionElement.innerText = translate("instructions_double_tap");
  instructionElementCenter.style.visibility = 'hidden';
  const transitionPanel = document.getElementById('transition-loading-panel');
  if (transitionPanel) {
    transitionPanel.style.visibility = 'hidden';
    transitionPanel.style.opacity = '0';
  }
}

window.addEventListener('touchstart', () => {
  unlockAllAudio();
}, { once: true });

window.addEventListener('mousedown', () => {
  unlockAllAudio();
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