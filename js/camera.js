// export const videoElement = document.getElementById('input_video');
// export const canvasElement = document.getElementById('output_canvas');
// export const canvasCtx = canvasElement.getContext('2d');

// // Camera constraints
// const constraints = {
//   video: {
//     facingMode: { ideal: 'environment' }
//   },
//   audio: false
// };

// // Start the camera stream
// export function startCamera() {
//   navigator.mediaDevices.getUserMedia(constraints)
//     .then((stream) => {
//       videoElement.srcObject = stream;
//       videoElement.onloadedmetadata = () => {
//         canvasElement.width = videoElement.videoWidth;
//         canvasElement.height = videoElement.videoHeight;
//         resolve();
//       };
//     });
//   } catch (error) {
//     console.error('Error accessing back camera:', error);
//     alert('Unable to access back camera. Please check permissions or device support.');
//   }
