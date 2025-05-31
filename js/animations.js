export const animations = {
  anim1: {
    //Array of images for each frame
    frames: [
      //0 to 253
      ...Array.from({ length: 254 }, (_, i) => {
        const frameNumber = i.toString().padStart(5, '0');
        return `Assets/Images/render_24f_${frameNumber}.png`;
      })
    ],
    //Audio Clip to play during the animation
    audio: 'Assets/Audio/beep-boing.wav',
    //Subtitles to display during the animation
    subtitle: 'anim1_subtitle',
    //A check to see if a specific gesture is required to proceed
    requiresGesture: true
  },
  anim2: {
    frames: [
      'Assets/Images/frames_00000.png',
    ],
    audio: 'Assets/Audio/boop2.wav',
    subtitle: 'anim2_subtitle',
    requiresGesture: false
  }
};
