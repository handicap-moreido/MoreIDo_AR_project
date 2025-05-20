import { startCamera, toggleCamera, videoElement } from './camera.js';
import { onResults } from './handDetection.js';

// Initialize everything
startCamera();

let lastTap = 0;

document.addEventListener('touchend', function (event) {
  const currentTime = new Date().getTime();
  if (currentTime - lastTap < 300) {
    // Double tap detected
    toggleCamera();
    event.preventDefault(); // Prevent double-tap zoom
  }
  lastTap = currentTime;
}, false);

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

/*
// Get the button and add the click event listener
const button = document.getElementById('action_button');
button.addEventListener('click', () => {
  //console.log('Button clicked!');
  const uiElement = document.getElementById('ui');
  //uiElement.innerText = 'Switching Camera...';

  // Toggle between front and back camera
  toggleCamera();
});
*/

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();

window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const actionButton = document.getElementById('action_button');

  // Hide the loading screen after everything's ready
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      //actionButton.disabled = false;
    }, 500);
  }, 3000);
});
