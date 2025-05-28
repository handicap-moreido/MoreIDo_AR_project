// camera.js
export const videoElement = document.getElementById('input_video');
export const canvasElement = document.getElementById('output_canvas');
export const canvasCtx = canvasElement.getContext('2d');

let currentStream = null;
let videoDevices = [];
let currentCameraIndex = 0;

// Request permission by temporarily getting any camera stream to reveal device labels
async function requestCameraAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    console.warn('Camera permission denied or error:', err);
  }
}

// Fetch list of video input devices with labels
async function getVideoDevices() {
  await requestCameraAccess(); // ensures labels are available
  const devices = await navigator.mediaDevices.enumerateDevices();
  videoDevices = devices.filter(device => device.kind === 'videoinput');

  // Sort devices so back cameras come first (if any)
  videoDevices.sort((a, b) => {
    const aLabel = a.label.toLowerCase();
    const bLabel = b.label.toLowerCase();

    const aIsBack = aLabel.includes('back') || aLabel.includes('rear') || aLabel.includes('environment');
    const bIsBack = bLabel.includes('back') || bLabel.includes('rear') || bLabel.includes('environment');

    if (aIsBack && !bIsBack) return -1;
    if (!aIsBack && bIsBack) return 1;
    return 0;
  });
}

// Start camera with specified index
export async function startCamera(index = 0) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  await getVideoDevices();

  if (videoDevices.length === 0) {
    alert("No video devices found.");
    return;
  }

  if (index >= videoDevices.length) index = 0; // fallback

  currentCameraIndex = index;
  const selectedDevice = videoDevices[currentCameraIndex];

  const constraints = {
    video: {
      deviceId: { exact: selectedDevice.deviceId }
    },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    videoElement.srcObject = stream;

    videoElement.onloadedmetadata = () => {
      videoElement.play();
      videoElement.style.display = 'none';

      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) loadingScreen.style.display = 'none';
    };
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Could not access camera. Please check permissions and try again.');
  }
}

// Toggle to the next camera
export function toggleCamera() {
  if (videoDevices.length <= 1) {
    console.warn("No other camera to switch to.");
    return;
  }

  currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
  startCamera(currentCameraIndex);
}
