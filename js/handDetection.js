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
handPromptContainer.style.position = 'fixed';
handPromptContainer.style.width = '100%';
handPromptContainer.style.height = '100%';
handPromptContainer.style.visibility = 'hidden';
document.body.appendChild(handPromptContainer);

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
loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
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
let isAdvancing = false; // Prevent reentrant advanceToNextAnimation
const preloadStatus = {};
let totalInitialAssets = 0;
let loadedInitialAssets = 0;
let totalInitialAudioAssets = 0;
let loadedInitialAudioAssets = 0;
let totalInitialFrameAssets = 0;
let loadedInitialFrameAssets = 0;
let totalBackgroundAssets = 0;
let loadedBackgroundAssets = 0;
let totalBackgroundAudioAssets = 0;
let loadedBackgroundAudioAssets = 0;
let totalBackgroundFrameAssets = 0;
let loadedBackgroundFrameAssets = 0;

let audioUnlocked = false;
let experienceStarted = false;

let countdownStartTime = null;
const countdownElement = document.getElementById('gestureCountdown');

const thankYouAudio = new Audio('Assets/Audio/anim11.mp3');
thankYouAudio.preload = 'auto';
let thankYouAudioLoaded = false;

// Calculate assets for initial and background batches
const initialBatchKeys = animationKeys.slice(0, 3); // anim1, anim2, anim3
const backgroundBatchKeys = animationKeys.slice(3); // anim4 to anim10

initialBatchKeys.forEach(key => {
  const anim = animations[key];
  totalInitialFrameAssets += anim.frames.length;
  totalInitialAudioAssets += 1;
  if (anim.gestureSfx) {
    totalInitialAudioAssets++;
  }
});

backgroundBatchKeys.forEach(key => {
  const anim = animations[key];
  totalBackgroundFrameAssets += anim.frames.length;
  totalBackgroundAudioAssets += 1;
  if (anim.gestureSfx) {
    totalBackgroundAudioAssets++;
  }
});

totalInitialAudioAssets++; // Thank-you audio
totalInitialAssets = totalInitialAudioAssets + totalInitialFrameAssets;
totalBackgroundAssets = totalBackgroundAudioAssets + totalBackgroundFrameAssets;

// Preload initial batch (anim1, anim2, anim3)
function preloadInitialAssets(callback) {
  // Phase 1: Load audio
  function preloadInitialAudio(onAudioComplete) {
    initialBatchKeys.forEach(key => {
      const anim = animations[key];
      if (preloadStatus[key]) return;

      // Preload gesture sound effect if it exists
      if (anim.gestureSfx) {
        const gestureAudio = new Audio();
        gestureAudio.src = anim.gestureSfx;
        gestureAudio.preload = 'auto';
        gestureAudio.oncanplaythrough = () => {
          anim.gestureSfxLoaded = true;
          console.log(`Loaded gesture SFX: ${anim.gestureSfx}`);
          updateInitialAudioProgress();
        };
        gestureAudio.onerror = () => {
          console.warn(`Failed to load gesture SFX: ${anim.gestureSfx}`);
          anim.gestureSfxLoaded = true;
          updateInitialAudioProgress();
        };
        anim.preloadedGestureSfx = gestureAudio;
      }

      // Preload main animation audio
      const audio = new Audio();
      audio.src = anim.audio;
      audio.preload = 'auto';
      audio.oncanplaythrough = () => {
        anim.audioLoaded = true;
        console.log(`Loaded audio: ${anim.audio}`);
        updateInitialAudioProgress();
      };
      audio.onerror = () => {
        console.warn(`Failed to load audio: ${anim.audio}`);
        anim.audioLoaded = true;
        updateInitialAudioProgress();
      };
      anim.preloadedAudio = audio;

      preloadStatus[key] = false;
    });

    // Preload thank-you panel audio
    thankYouAudio.oncanplaythrough = () => {
      thankYouAudioLoaded = true;
      console.log('Loaded thank-you audio');
      updateInitialAudioProgress();
    };
    thankYouAudio.onerror = () => {
      console.warn('Failed to load thank-you audio');
      thankYouAudioLoaded = true;
      updateInitialAudioProgress();
    };

    function updateInitialAudioProgress() {
      loadedInitialAudioAssets++;
      updateInitialProgress();
      if (loadedInitialAudioAssets >= totalInitialAudioAssets) {
        onAudioComplete();
      }
    }
  }

  // Phase 2: Load frames
  function preloadInitialFrames() {
    initialBatchKeys.forEach(key => {
      const anim = animations[key];
      if (preloadStatus[key]) return;

      // Preload images
      const images = anim.frames.map(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          console.log(`Loaded frame: ${src}`);
          updateInitialFrameProgress();
        };
        img.onerror = () => {
          console.warn(`Failed to load frame: ${src}`);
          updateInitialFrameProgress();
        };
        return img;
      });

      anim.preloadedImages = images;
    });

    function updateInitialFrameProgress() {
      loadedInitialFrameAssets++;
      updateInitialProgress();
    }
  }

  function updateInitialProgress() {
    loadedInitialAssets = loadedInitialAudioAssets + loadedInitialFrameAssets;
    const progress = Math.round((loadedInitialAssets / totalInitialAssets) * 100);
    loadingElement.innerText = `Loading assets... ${progress}%`;
    if (loadedInitialAssets >= totalInitialAssets) {
      initialBatchKeys.forEach(k => preloadStatus[k] = true);
      loadingElement.style.visibility = 'hidden';
      console.log('Initial assets fully loaded');
      if (callback) callback();
    }
  }

  // Start audio preloading, then frames
  preloadInitialAudio(() => preloadInitialFrames());
}

// Preload background batch (anim4 to anim10) with prioritized anim4
function preloadBackgroundAssets() {
  let currentAudioIndex = 0;

  // Load one audio file at a time, prioritizing anim4
  function loadNextBackgroundAudio(onComplete) {
    if (currentAudioIndex >= backgroundBatchKeys.length) {
      console.log('All background audio preloaded');
      onComplete();
      return;
    }

    const key = backgroundBatchKeys[currentAudioIndex];
    const anim = animations[key];
    if (preloadStatus[key] || (anim.audioLoaded && (!anim.gestureSfx || anim.gestureSfxLoaded))) {
      currentAudioIndex++;
      loadNextBackgroundAudio(onComplete);
      return;
    }

    let audioFilesToLoad = 0;
    let audioFilesLoaded = 0;

    // Preload gesture sound effect if it exists
    if (anim.gestureSfx && !anim.gestureSfxLoaded) {
      audioFilesToLoad++;
      const gestureAudio = new Audio();
      gestureAudio.src = anim.gestureSfx;
      gestureAudio.preload = 'auto';
      gestureAudio.oncanplaythrough = () => {
        anim.gestureSfxLoaded = true;
        console.log(`Loaded gesture SFX: ${anim.gestureSfx}`);
        audioFilesLoaded++;
        checkAudioComplete();
      };
      audioFiles.onerror = () => {
        console.warn(`Failed to load gesture SFX: ${anim.gestureSfx}`);
        anim.gestureSfxLoaded = true;
        audioFilesLoaded++;
        checkAudioComplete();
      };
      anim.preloadedGestureSfx = gestureAudio;
    }

    // Preload main animation audio
    if (!anim.audioLoaded) {
      audioFilesToLoad++;
      const audio = new Audio();
      audio.src = anim.audio;
      audio.preload = 'auto';
      audio.oncanplaythrough = () => {
        anim.audioLoaded = true;
        console.log(`Loaded audio: ${anim.audio}`);
        audioFilesLoaded++;
        checkAudioComplete();
      };
      audio.onerror = () => {
        console.warn(`Failed to load audio: ${anim.audio}`);
        anim.audioLoaded = true;
        audioFilesLoaded++;
        checkAudioComplete();
      };
      anim.preloadedAudio = audio;
    }

    function checkAudioComplete() {
      if (audioFilesLoaded >= audioFilesToLoad) {
        loadedBackgroundAudioAssets++;
        updateBackgroundProgress();
        currentAudioIndex++;
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => loadNextBackgroundAudio(onComplete));
        } else {
          setTimeout(() => loadNextBackgroundAudio(onComplete), 100);
        }
      }
    }

    if (audioFilesToLoad === 0) {
      currentAudioIndex++;
      loadNextBackgroundAudio(onComplete);
    }
  }

  // Load frames after audio
  function preloadBackgroundFrames() {
    backgroundBatchKeys.forEach(key => {
      const anim = animations[key];
      if (preloadStatus[key]) return;

      // Preload images
      const images = anim.frames.map(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          console.log(`Loaded background frame: ${src}`);
          updateBackgroundFrameProgress();
        };
        img.onerror = () => {
          console.warn(`Failed to load background frame: ${src}`);
          updateBackgroundFrameProgress();
        };
        return img;
      });

      anim.preloadedImages = images;
    });

    function updateBackgroundFrameProgress() {
      loadedBackgroundFrameAssets++;
      updateBackgroundProgress();
    }
  }

  function updateBackgroundProgress() {
    loadedBackgroundAssets = loadedBackgroundAudioAssets + loadedBackgroundFrameAssets;
    if (loadedBackgroundAssets >= totalBackgroundAssets) {
      backgroundBatchKeys.forEach(k => preloadStatus[k] = true);
      console.log("Background assets preloaded");
    }
  }

  // Start audio loading, then frames
  loadNextBackgroundAudio(() => {
    console.log('Starting background frame preload');
    preloadBackgroundFrames();
  });
}

// Unlock all audio on first user interaction
function unlockAllAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // Trigger loading only for audio that hasn't been loaded
  animationKeys.forEach(key => {
    const anim = animations[key];
    if (anim.preloadedAudio && !anim.audioLoaded) {
      console.log(`Loading audio for ${key}`);
      anim.preloadedAudio.load();
    }
    if (anim.preloadedGestureSfx && !anim.gestureSfxLoaded) {
      console.log(`Loading gesture SFX for ${key}`);
      anim.preloadedGestureSfx.load();
    }
  });

  // Trigger loading of thank-you panel audio if not loaded
  if (!thankYouAudioLoaded) {
    console.log('Loading thank-you audio');
    thankYouAudio.load();
  }

  console.log('Audio unlocked');
}

// Start preloading initial assets
preloadInitialAssets(() => {
  console.log("Initial assets preloaded");
  startExperience();
  // Delay background preloading to stabilize UI, but prioritize anim4
  setTimeout(() => preloadBackgroundAssets(), 1000);
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
  console.log(`Mobile: Animation ${currentKey} completed, index: ${currentAnimationIndex}, isPlaying: ${animator.isPlaying}`);

  if (currentAnim.requiresGesture) {
    console.log('Mobile: Prompting for closed fist');
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
  if (isAdvancing) {
    console.log(`Mobile: Blocked reentrant advanceToNextAnimation, index: ${currentAnimationIndex}`);
    return;
  }
  isAdvancing = true;

  console.log(`Mobile: Advancing from index ${currentAnimationIndex}, isPlaying: ${animator.isPlaying}`);
  if (currentAnimationIndex >= animationKeys.length - 1) {
    console.log('Mobile: Reached end of animations, pausing before panel');
    pauseBeforePanel();
    isAdvancing = false;
    return;
  }

  currentAnimationIndex = Math.min(currentAnimationIndex + 1, animationKeys.length - 1);
  const nextKey = animationKeys[currentAnimationIndex];
  const nextAnim = animations[nextKey];
  console.log(`Mobile: Advancing to ${nextKey}, index: ${currentAnimationIndex}`);

  // Reset animator state
  animator.isPausedForGesture = false;
  animator.waitingForPalmOpenAfterFist = false;
  clearTimeout(animator.gestureTimeout);
  animator.gestureTimeout = null;

  // Check if next animation is preloaded
  if (!preloadStatus[nextKey]) {
    console.warn(`Mobile: Animation ${nextKey} not yet preloaded, delaying playback`);
    stopMusic();
    loadingElement.style.visibility = 'visible';
    loadingElement.innerText = 'Loading next animation...';
    const checkPreload = setInterval(() => {
      if (preloadStatus[nextKey]) {
        clearInterval(checkPreload);
        loadingElement.style.visibility = 'hidden';
        animator.setFrames(nextAnim, translate);
        animator.reset();
        animator.start();
        console.log(`Mobile: Started ${nextKey}, rafId: ${animator.rafId}`);
        shouldPlayMusic = true;
        // Set music track for anim4 and beyond
        if (currentAnimationIndex >= 3) {
          console.log(`Mobile: Advancing to ${nextKey}, setting default background track`);
          currentBackgroundTrack = 'default';
          playMusic('default');
        }
        isAdvancing = false;
      } else {
        // Fallback: Start with placeholder if preload takes too long
        if (Date.now() - checkPreload.startTime > 10000) {
          console.warn(`Mobile: Preload timeout for ${nextKey}, using placeholder`);
          clearInterval(checkPreload);
          loadingElement.style.visibility = 'hidden';
          animator.setFrames({ ...nextAnim, frames: [nextAnim.frames[0] || ''] }, translate);
          animator.reset();
          animator.start();
          console.log(`Mobile: Started ${nextKey} with placeholder, rafId: ${animator.rafId}`);
          shouldPlayMusic = true;
          if (currentAnimationIndex >= 3) {
            currentBackgroundTrack = 'default';
            playMusic('default');
          }
          isAdvancing = false;
        }
      }
    }, 100);
    checkPreload.startTime = Date.now();
  } else {
    animator.setFrames(nextAnim, translate);
    animator.reset();
    animator.start();
    console.log(`Mobile: Started ${nextKey}, rafId: ${animator.rafId}`);
    shouldPlayMusic = true;
    // Set music track for anim4 and beyond
    if (currentAnimationIndex >= 3) {
      console.log(`Mobile: Advancing to ${nextKey}, setting default background track`);
      currentBackgroundTrack = 'default';
      playMusic('default');
    }
    isAdvancing = false;
  }
}

function pauseBeforePanel() {
  pauseInProgress = true;
  animator.stop();
  spriteImg.style.visibility = 'hidden';
  instructionElement.innerText = '';
  instructionElementCenter.style.visibility = 'hidden';
  stopMusic();
  shouldPlayMusic = false;
  currentBackgroundTrack = 'default';
  console.log(`Mobile: Pausing before thank-you panel, index: ${currentAnimationIndex}`);
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
    console.log(`Mobile: Hand detected, landmarks count: ${landmarks.length}, index: ${currentAnimationIndex}, isPausedForGesture: ${animator.isPausedForGesture}`);

    if (animator.isPausedForGesture) {
      if (animator.waitingForPalmOpenAfterFist) {
        const palmDetected = checkIfPalmOpen(landmarks);
        console.log(`Mobile: Waiting for palm open, detected: ${palmDetected}, index: ${currentAnimationIndex}`);

        if (palmDetected) {
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
          if (animator.isPlaying) {
            animator.resume();
          } else {
            animator.start();
          }
        } else {
          instructionElement.innerText = translate("instructions_show_palm");
          instructionElement.style.visibility = 'visible';
          instructionElementCenter.style.visibility = 'hidden';
          countdownElement.style.visibility = 'hidden';
          spriteImg.style.visibility = 'hidden';

          // Timeout to prevent gesture stall on mobile
          if (!animator.gestureTimeout) {
            animator.gestureTimeout = setTimeout(() => {
              console.log(`Mobile: Gesture timeout, advancing anyway, index: ${currentAnimationIndex}`);
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
              if (animator.isPlaying) {
                animator.resume();
              } else {
                animator.start();
              }
            }, 5000); // 5s timeout
          }
        }
        canvasCtx.restore();
        return;
      }

      const fistDetected = checkIfFist(landmarks);
      console.log(`Mobile: Checking for fist, detected: ${fistDetected}, index: ${currentAnimationIndex}`);

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
        console.log(`Mobile: Palm detected, resuming animation, index: ${currentAnimationIndex}`);
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

  // Center sprite at hand using transform
  spriteImg.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
  spriteImg.style.visibility = 'visible';
  console.log(`Mobile: Sprite positioned at x=${x}, y=${y}, px=${px}, py=${py}, index: ${currentAnimationIndex}`);

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
  animationFinished = true;
  pauseInProgress = false;
  console.log(`Mobile: Showing thank-you panel, index: ${currentAnimationIndex}`);

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
  console.log(`Mobile: Double-tap/click detected, starting hand tracking, index: ${currentAnimationIndex}`);
  doubleTapPanel.style.visibility = 'hidden';
  handPromptContainer.style.visibility = 'visible';
  showHandPrompt = true;
  hasStartedTracking = true;
  shouldPlayMusic = true;
}

export function startExperience() {
  if (experienceStarted) return;
  experienceStarted = true;
  console.log('Mobile: Starting experience, resetting index to 0');
  animationFinished = false;
  pauseInProgress = false;
  currentAnimationIndex = 0;
  currentBackgroundTrack = 'default';
  hasStartedTracking = false;
  shouldPlayMusic = false;
  isAdvancing = false;
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
    console.log('Mobile: Transition panel hidden in startExperience');
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