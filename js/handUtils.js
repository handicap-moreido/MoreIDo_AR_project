// Check if palm is open
export function checkIfPalmOpen(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
  
    const thumbBase = landmarks[1];
    const indexBase = landmarks[5];
    const middleBase = landmarks[9];
    const ringBase = landmarks[13];
    const pinkyBase = landmarks[17];
  
    const thumbOpen = (thumbTip.y < thumbBase.y);
    const indexOpen = (indexTip.y < indexBase.y);
    const middleOpen = (middleTip.y < middleBase.y);
    const ringOpen = (ringTip.y < ringBase.y);
    const pinkyOpen = (pinkyTip.y < pinkyBase.y);
  
    const openFingers = [thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;
  
    return openFingers >= 4;
  }
  
  // Calculate hand center
  export function calculateHandCenter(landmarks) {
    const points = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
    let centerX = 0;
    let centerY = 0;
  
    points.forEach(point => {
      centerX += point.x;
      centerY += point.y;
    });
  
    centerX /= points.length;
    centerY /= points.length;
  
    return { x: centerX, y: centerY };
  }
  