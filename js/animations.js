export const animations = {
  anim1: {
    //Array of images for each frame
    frames: [
      'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/RedNinja.1.png?v=1747774160273',
      'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/RedNinja.2.png?v=1747774170775',
      'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/RedNinja.3.png?v=1747774192945',
      'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/RedNinja.4.png?v=1747774149906',
      'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/RedNinja.5.png?v=1747774224893',
    ],
    //Audio Clip to play during the animation (it should match the animation in terms of time)
    audio: 'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/339132__indigoray__beep-boing.wav?v=1747782682784',
    //Subtitles to display during the animation
    subtitle: 'anim1_subtitle',
    //A check to see if a specific gesture is required to proceed (the closed fist for the explosion)
    requiresGesture: true
  },
  anim2: {
    frames: [
      'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/frames_00000.png?v=1747948779762',
    ],
    audio: 'https://cdn.glitch.global/595c562f-872a-44d6-acf9-bd70e99e9dce/99219__mtadder__boop2.wav?v=1747782682958',
    subtitle: 'anim2_subtitle',
    requiresGesture: false
  }
};