// Get references to DOM elements
export const videoElement = document.getElementById('input_video');
export const canvasElement = document.getElementById('output_canvas');
export const canvasCtx = canvasElement.getContext('2d');

// Camera constraints, starting with the environment (back) camera
let constraints = {
  video: {
    facingMode: 'environment',
  }
};

let currentStream = null; // Holds the current video stream

// Start the camera with current constraints
export function startCamera() {
  // Stop existing camera stream if any
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      currentStream = stream;
      videoElement.srcObject = stream;

      videoElement.onloadedmetadata = () => {
        // Hide the video element since we display the canvas
        videoElement.style.display = 'none';

        // Set canvas resolution to video feed size for sharpness
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        // No need to set video element width/height because it's hidden

        // Hide loading screen once camera is ready
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.style.display = 'none';
      };
    })
    .catch((error) => {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions and try again.');
    });
}

// Toggle between front and back cameras
export function toggleCamera() {
  constraints.video.facingMode =
    constraints.video.facingMode === 'environment' ? 'user' : 'environment';
  startCamera();
}
