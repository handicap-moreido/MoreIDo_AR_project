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
instructionElementCenter.style.display = 'none';
document.body.appendChild(instructionElementCenter);
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
let currentBackgroundTrack = 'default';
let hasStartedTracking = false;
let shouldPlayMusic = false; // New flag to control music playback
const preloadStatus = {};
let totalInitialAssets = 0;
let loadedInitialAssets = 0;
let totalBackgroundAssets = 0;
let loadedBackgroundAssets = 0;

let audioUnlocked = false;
let experienceStarted = false;

let countdownStartTime = null;
const countdownElement = document.getElementById('gestureCountdown');

const thankYouAudio = new Audio('Assets/Audio/anim11.mp3');
thankYouAudio.preload = 'auto';

// Calculate assets for initial and background batches
const initialBatchKeys = animationKeys.slice(0, 3); // anim1, anim2, anim3
const backgroundBatchKeys = animationKeys.slice(3); // anim4 to anim10

initialBatchKeys.forEach(key => {
  const anim = animations[key];
  totalInitialAssets += anim.frames.length + 1; // Frames + audio
  if (anim.gestureSfx) {
    totalInitialAssets++; // Gesture SFX
  }
});

backgroundBatchKeys.forEach(key => {
  const anim = animations[key];
  totalBackgroundAssets += anim.frames.length + 1; // Frames + audio
  if (anim.gestureSfx) {
    totalBackgroundAssets++; // Gesture SFX
  }
});

totalInitialAssets++; // Thank-you audio

// Preload initial batch (anim1, anim2, anim3)
function preloadInitialAssets(callback) {
  initialBatchKeys.forEach(key => {
    const anim = animations[key];
    if (preloadStatus[key]) return;

    // Preload images
    const images = anim.frames.map(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => updateInitialProgress();
      img.onerror = () => {
        console.warn(`Failed to load frame: ${src}`);
        updateInitialProgress();
      };
      return img;
    });

    // Preload gesture sound effect if it exists
    if (anim.gestureSfx) {
      const gestureAudio = new Audio();
      gestureAudio.src = anim.gestureSfx;
      gestureAudio.preload = 'auto';
      gestureAudio.oncanplaythrough = () => updateInitialProgress();
      gestureAudio.onerror = () => {
        console.warn(`Failed to load gesture SFX: ${anim.gestureSfx}`);
        updateInitialProgress();
      };
      anim.preloadedGestureSfx = gestureAudio;
    }

    // Preload main animation audio
    const audio = new Audio();
    audio.src = anim.audio;
    audio.preload = 'auto';
    audio.oncanplaythrough = () => updateInitialProgress();
    audio.onerror = () => {
      console.warn(`Failed to load audio: ${anim.audio}`);
      updateInitialProgress();
    };

    anim.preloadedImages = images;
    anim.preloadedAudio = audio;
    preloadStatus[key] = false;
  });

  // Preload thank-you panel audio
  thankYouAudio.oncanplaythrough = () => updateInitialProgress();
  thankYouAudio.onerror = () => {
    console.warn(`Failed to load thank you audio`);
    updateInitialProgress();
  };

  function updateInitialProgress() {
    loadedInitialAssets++;
    const progress = Math.round((loadedInitialAssets / totalInitialAssets) * 100);
    loadingElement.innerText = `Loading assets... ${progress}%`;
    if (loadedInitialAssets >= totalInitialAssets) {
      initialBatchKeys.forEach(k => preloadStatus[k] = true);
      loadingElement.style.display = 'none';
      if (callback) callback();
    }
  }
}

// Preload background batch (anim4 to anim10)
function preloadBackgroundAssets() {
  backgroundBatchKeys.forEach(key => {
    const anim = animations[key];
    if (preloadStatus[key]) return;

    // Preload images
    const images = anim.frames.map(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => updateBackgroundProgress();
      img.onerror = () => {
        console.warn(`Failed to load frame: ${src}`);
        updateBackgroundProgress();
      };
      return img;
    });

    // Preload gesture sound effect if it exists
    if (anim.gestureSfx) {
      const gestureAudio = new Audio();
      gestureAudio.src = anim.gestureSfx;
      gestureAudio.preload = 'auto';
      gestureAudio.oncanplaythrough = () => updateBackgroundProgress();
      gestureAudio.onerror = () => {
        console.warn(`Failed to load gesture SFX: ${anim.gestureSfx}`);
        updateBackgroundProgress();
      };
      anim.preloadedGestureSfx = gestureAudio;
    }

    // Preload main animation audio
    const audio = new Audio();
    audio.src = anim.audio;
    audio.preload = 'auto';
    audio.oncanplaythrough = () => updateBackgroundProgress();
    audio.onerror = () => {
      console.warn(`Failed to load audio: ${anim.audio}`);
      updateBackgroundProgress();
    };

    anim.preloadedImages = images;
    anim.preloadedAudio = audio;
    preloadStatus[key] = false;
  });

  function updateBackgroundProgress() {
    loadedBackgroundAssets++;
    if (loadedBackgroundAssets >= totalBackgroundAssets) {
      backgroundBatchKeys.forEach(k => preloadStatus[k] = true);
      console.log("Background assets preloaded");
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

// Start preloading initial assets
preloadInitialAssets(() => {
  console.log("Initial assets preloaded");
  startExperience();
  // Start background preloading after initial batch
  preloadBackgroundAssets();
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
  //console.log(`Animation ${currentKey} completed`);

  if (currentAnim.requiresGesture) {
    //console.log('Prompting for closed fist');
    animator.waitForGesture();
    instructionElementCenter.style.display = 'block';
    instructionElementCenter.innerText = translate("instructions_show_closed_fist");
    instructionElement.innerText = '';
    instructionElement.style.display = 'none';
    shouldPlayMusic = false;
    stopMusic();
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
  // Check if next animation is preloaded
  if (!preloadStatus[nextKey]) {
    console.warn(`Animation ${nextKey} not yet preloaded, delaying playback`);
    stopMusic(); // Ensure music is stopped during loading
    loadingElement.style.display = 'block';
    loadingElement.innerText = 'Loading next animation...';
    const checkPreload = setInterval(() => {
      if (preloadStatus[nextKey]) {
        clearInterval(checkPreload);
        loadingElement.style.display = 'none';
        animator.setFrames(nextAnim, translate);
        animator.reset();
        animator.start();
        shouldPlayMusic = true; // Enable music for the new animation
        // Set music track for anim4 and beyond
        if (currentAnimationIndex >= 3) {
          console.log(`Advancing to ${nextKey}, setting default background track`);
          currentBackgroundTrack = 'default';
          playMusic('default');
        }
      }
    }, 100);
  } else {
    animator.setFrames(nextAnim, translate);
    animator.reset();
    animator.start();
    shouldPlayMusic = true; // Enable music for the new animation
    // Set music track for anim4 and beyond
    if (currentAnimationIndex >= 3) {
      console.log(`Advancing to ${nextKey}, setting default background track`);
      currentBackgroundTrack = 'default';
      playMusic('default');
    }
  }
}

function pauseBeforePanel() {
  pauseInProgress = true;
  animator.stop();
  spriteImg.style.display = 'none';
  instructionElement.innerText = '';
  instructionElementCenter.style.display = 'none';
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
      handPromptContainer.style.display = 'none';
      showHandPrompt = false;
    }

    const landmarks = results.multiHandLandmarks[0];

    if (animator.isPausedForGesture) {
      if (animator.waitingForPalmOpenAfterFist) {
        if (checkIfPalmOpen(landmarks)) {
          animator.waitingForPalmOpenAfterFist = false;
          countdownStartTime = null;
          animator.gestureDetected();
          instructionElementCenter.style.display = 'none';
          instructionElement.innerText = '';
          //console.log('Palm opened after fist hold, advancing animation');
          currentBackgroundTrack = 'gesture';
          shouldPlayMusic = true;
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
          countdownElement.style.display = 'block';
          countdownElement.innerText = remaining.toString();
          spriteImg.style.display = 'none';
          instructionElementCenter.style.display = 'none';
          instructionElement.innerText = '';
        } else {
          countdownElement.style.display = 'none';
          spriteImg.style.display = 'none';
          instructionElementCenter.style.display = 'block';
          instructionElementCenter.innerText = translate("instructions_show_closed_fist");
          instructionElement.innerText = '';
        }

        if (elapsedSeconds >= 3) {
          countdownElement.style.display = 'none';
          instructionElement.innerText = translate("instructions_show_palm");
          instructionElement.style.display = 'block';
          instructionElementCenter.style.display = 'none';
          animator.waitingForPalmOpenAfterFist = true;
        }
      } else {
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
      const handCenter = calculateHandCenter(landmarks);
      drawSpriteAtPalm(handCenter.x, handCenter.y);
      instructionElement.innerText = '';
      instructionElementCenter.style.display = 'none';

      if (preloadStatus[animationKeys[currentAnimationIndex]] && shouldPlayMusic) {
        playMusic(currentBackgroundTrack); // Play music if animation is ready and should play
      }
      if (!animator.rafId && preloadStatus[animationKeys[currentAnimationIndex]]) {
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
    shouldPlayMusic = false;
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
    shouldPlayMusic = true; // Ensure music can play when animation starts
  }
}

function stopAnimation() {
  spriteImg.style.display = 'none';
  animator.pause();
  stopMusic();
  shouldPlayMusic = false;
  instructionElementCenter.style.display = 'none';
}

function showThankYouPanel() {
  animationFinished = true;
  pauseInProgress = false;

  const panel = document.getElementById('thank-you-panel');
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  panel.style.pointerEvents = 'auto';

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
}

export function onUserDoubleTapStart() {
  //console.log('Double-tap/click detected, starting hand tracking');
  doubleTapPanel.style.display = 'none';
  handPromptContainer.style.display = 'block';
  showHandPrompt = true;
  hasStartedTracking = true;
  shouldPlayMusic = true; // Enable music on double-tap
}

export function startExperience() {
  if (experienceStarted) return;
  experienceStarted = true;
  console.log('Starting experience');
  animationFinished = false;
  pauseInProgress = false;
  currentAnimationIndex = 0;
  currentBackgroundTrack = 'default';
  hasStartedTracking = false;
  shouldPlayMusic = false; // Music off until double-tap
  animator.stop();
  animator.setFrames(animations[animationKeys[0]], translate);
  animator.reset();
  doubleTapPanel.style.display = 'block';
  handPromptContainer.style.display = 'none';
  instructionElement.innerText = translate("instructions_double_tap");
  instructionElementCenter.style.display = 'none';
  const transitionPanel = document.getElementById('transition-loading-panel');
  if (transitionPanel) {
    transitionPanel.style.visibility = 'hidden';
    transitionPanel.style.opacity = '0';
    console.log('Transition panel hidden in startExperience');
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