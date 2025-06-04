import { animations } from './animations.js';

// Audio objects
const audioTracks = {
  default: new Audio('Assets/Audio/Background1.mp3'),
  gesture: new Audio('Assets/Audio/BackgroundGesture.mp3')
};

// Configure audio
Object.values(audioTracks).forEach(audio => {
  audio.preload = 'auto';
  audio.loop = true;
  audio.volume = 0.3; // Lower volume to avoid overpowering animation audio
});

// Log loading status
audioTracks.default.addEventListener('canplaythrough', () => {
  console.log('Background track loaded: Assets/Audio/Background1.mp3');
});
audioTracks.default.addEventListener('error', (e) => {
  console.error('Failed to load background track: Assets/Audio/Background1.mp3, error:', e.message);
});
audioTracks.gesture.addEventListener('canplaythrough', () => {
  console.log('Gesture track loaded: Assets/Audio/BackgroundGesture.wav');
});
audioTracks.gesture.addEventListener('error', (e) => {
  console.error('Failed to load gesture track: Assets/Audio/BackgroundGesture.mp3, error:', e.message);
});

// Audio unlock for iOS
window.addEventListener('touchstart', () => {
  console.log('Attempting to unlock background audio');
  Promise.all(
    Object.values(audioTracks).map(audio =>
      audio.play().then(() => {
        console.log(`Audio unlocked for ${audio.src}`);
        audio.pause();
        audio.currentTime = 0;
      }).catch(e => console.warn(`Audio unlock failed for ${audio.src}:`, e.message))
    )
  ).then(() => {
    console.log('All background audio unlocked');
  });
}, { once: true });
window.addEventListener('click', () => {
  console.log('Attempting to unlock background audio (click)');
  Promise.all(
    Object.values(audioTracks).map(audio =>
      audio.play().then(() => {
        console.log(`Audio unlocked for ${audio.src} (click)`);
        audio.pause();
        audio.currentTime = 0;
      }).catch(e => console.warn(`Audio unlock failed for ${audio.src} (click):`, e.message))
    )
  ).then(() => {
    console.log('All background audio unlocked (click)');
  });
}, { once: true });

// Current playing track
let currentTrack = null;

// Play music by track name ('default' or 'gesture')
export function playMusic(trackName) {
  if (!audioTracks[trackName]) {
    console.error(`Invalid track name: ${trackName}`);
    return;
  }
  console.log(`Attempting to play background track: ${trackName}`);
  
  // Stop current track if playing
  if (currentTrack && currentTrack !== audioTracks[trackName]) {
    currentTrack.pause();
    currentTrack.currentTime = 0;
    console.log(`Stopped previous track: ${currentTrack.src}`);
  }
  
  // Play new track
  currentTrack = audioTracks[trackName];
  currentTrack.play().then(() => {
    console.log(`Playing background track: ${currentTrack.src}`);
  }).catch(e => console.error(`Failed to play background track ${trackName}:`, e.message));
}

// Stop all music
export function stopMusic() {
  console.log('Stopping all background music');
  Object.values(audioTracks).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  currentTrack = null;
}