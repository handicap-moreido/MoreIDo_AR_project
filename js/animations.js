export const animations = {
  anim1: {
    frames: Array.from({ length: 144 }, (_, i) => {
      const frameNumber = i.toString().padStart(5, '0');
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part1.mp3',
    subtitle: 'anim1_subtitle',
    requiresGesture: false
  },
  anim2: {
    frames: Array.from({ length: 233 }, (_, i) => {
      const frameNumber = (i + 144).toString().padStart(5, '0'); // Start after anim1
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part2.mp3', // Replace with actual file
    subtitle: 'anim2_subtitle',
    requiresGesture: false
  },
  anim3: {
    frames: Array.from({ length: 63 }, (_, i) => {
      const frameNumber = (i + 377).toString().padStart(5, '0');
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part3.mp3',
    subtitle: 'anim3_subtitle',
    requiresGesture: true,
    gestureSfx: 'Assets/Audio/Explosion.mp3'
  },
  anim4: {
    frames: Array.from({ length: 98 }, (_, i) => {
      const frameNumber = (i + 440).toString().padStart(5, '0'); // Start after anim3
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part4.mp3',
    subtitle: 'anim4_subtitle',
    requiresGesture: false
  },
  anim5: {
    frames: Array.from({ length: 168 }, (_, i) => {
      const frameNumber = (i + 538).toString().padStart(5, '0'); // Start after anim4
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part5.mp3',
    subtitle: 'anim5_subtitle',
    requiresGesture: false
  },
  anim6: {
    frames: Array.from({ length: 150 }, (_, i) => {
      const frameNumber = (i + 706).toString().padStart(5, '0'); // Start after anim5
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part6.mp3',
    subtitle: 'anim6_subtitle',
    requiresGesture: false
  },
  anim7: {
    frames: Array.from({ length: 169 }, (_, i) => {
      const frameNumber = (i + 856).toString().padStart(5, '0'); // Start after anim6
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part7.mp3',
    subtitle: 'anim7_subtitle',
    requiresGesture: false
  },
  anim8: {
    frames: Array.from({ length: 193 }, (_, i) => {
      const frameNumber = (i + 1025).toString().padStart(5, '0'); // Start after anim7
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part8.mp3',
    subtitle: 'anim8_subtitle',
    requiresGesture: false
  },
  anim9: {
    frames: Array.from({ length: 203 }, (_, i) => {
      const frameNumber = (i + 1218).toString().padStart(5, '0'); // Start after anim8
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part9.mp3',
    subtitle: 'anim9_subtitle',
    requiresGesture: false
  },
  anim10: {
    frames: Array.from({ length: 122 }, (_, i) => {
      const frameNumber = (i + 1421).toString().padStart(5, '0'); // Start after anim9
      return `Assets/Images/final_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/English/Part10.mp3',
    requiresGesture: false
  },
};