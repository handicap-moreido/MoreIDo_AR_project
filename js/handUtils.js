// handUtils.js

//Check if palm is open (4 or more fingers open (can be modified to require less))
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

  const thumbOpen = thumbTip.y < thumbBase.y;
  const indexOpen = indexTip.y < indexBase.y;
  const middleOpen = middleTip.y < middleBase.y;
  const ringOpen = ringTip.y < ringBase.y;
  const pinkyOpen = pinkyTip.y < pinkyBase.y;

  const openFingers = [thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

  //If we want to check for less fingers we chnage it here
  return openFingers >= 4;
}

//Calculate center point of the hand (using wrist and finger bases(Average))
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

//Check if hand is closed (fist)
export function checkIfFist(landmarks) {
  //If most fingertips are below their bases
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

  const thumbClosed = thumbTip.y > thumbBase.y;
  const indexClosed = indexTip.y > indexBase.y;
  const middleClosed = middleTip.y > middleBase.y;
  const ringClosed = ringTip.y > ringBase.y;
  const pinkyClosed = pinkyTip.y > pinkyBase.y;

  const closedFingers = [thumbClosed, indexClosed, middleClosed, ringClosed, pinkyClosed].filter(Boolean).length;

  //This is like the opposite of the open hand we check if there position is closed rather than open (super simplified)
  return closedFingers >= 4;
}
