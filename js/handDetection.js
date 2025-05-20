import { canvasElement, canvasCtx, videoElement } from './camera.js';
import { checkIfPalmOpen, calculateHandCenter } from './handUtils.js';

export function onResults(results) {
  console.log('Hand detection results:', results);

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
      drawSquareAtPalm(handCenter.x, handCenter.y);
    } else {
      document.getElementById('instructions').innerText = "Show your palm!";
    }
  }
  canvasCtx.restore();
}

// Draw a square at the given coordinates
function drawSquareAtPalm(x, y) {
  const squareSize = 50;
  canvasCtx.fillStyle = 'rgba(0, 0, 255, 0.5)';
  canvasCtx.fillRect(x * canvasElement.width - squareSize / 2, y * canvasElement.height - squareSize / 2, squareSize, squareSize);
}
