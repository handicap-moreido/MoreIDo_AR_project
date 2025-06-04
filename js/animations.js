export const animations = {
  anim1: {
    frames: Array.from({ length: 144 }, (_, i) => {
      const frameNumber = i.toString().padStart(5, '0');
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim1.mp3',
    subtitle: 'anim1_subtitle',
    requiresGesture: false
  },
  anim2: {
    frames: Array.from({ length: 233 }, (_, i) => {
      const frameNumber = (i + 144).toString().padStart(5, '0'); // Start after anim1
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim2.mp3', // Replace with actual file
    subtitle: 'anim2_subtitle',
    requiresGesture: false
  },
  anim3: {
    frames: Array.from({ length: 63 }, (_, i) => {
      const frameNumber = (i + 377).toString().padStart(5, '0');
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim3.mp3',
    subtitle: 'anim3_subtitle',
    requiresGesture: true,
    gestureSfx: 'Assets/Audio/Explosion.mp3'
  },
  anim4: {
    frames: Array.from({ length: 98 }, (_, i) => {
      const frameNumber = (i + 440).toString().padStart(5, '0'); // Start after anim3
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim4.mp3',
    subtitle: 'anim4_subtitle',
    requiresGesture: false
  },
  anim5: {
    frames: Array.from({ length: 168 }, (_, i) => {
      const frameNumber = (i + 538).toString().padStart(5, '0'); // Start after anim4
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim5.mp3',
    subtitle: 'anim5_subtitle',
    requiresGesture: false
  },
  anim6: {
    frames: Array.from({ length: 150 }, (_, i) => {
      const frameNumber = (i + 706).toString().padStart(5, '0'); // Start after anim5
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim6.mp3',
    subtitle: 'anim6_subtitle',
    requiresGesture: false
  },
  anim7: {
    frames: Array.from({ length: 169 }, (_, i) => {
      const frameNumber = (i + 856).toString().padStart(5, '0'); // Start after anim6
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim7.mp3',
    subtitle: 'anim7_subtitle',
    requiresGesture: false
  },
  anim8: {
    frames: Array.from({ length: 193 }, (_, i) => {
      const frameNumber = (i + 1025).toString().padStart(5, '0'); // Start after anim7
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim8.mp3',
    subtitle: 'anim8_subtitle',
    requiresGesture: false
  },
  anim9: {
    frames: Array.from({ length: 203 }, (_, i) => {
      const frameNumber = (i + 1218).toString().padStart(5, '0'); // Start after anim8
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim9.mp3',
    subtitle: 'anim9_subtitle',
    requiresGesture: false
  },
  anim10: {
    frames: Array.from({ length: 183 }, (_, i) => {
      const frameNumber = (i + 1421).toString().padStart(5, '0'); // Start after anim9
      return `Assets/Images/finalrender_ema_${frameNumber}.webp`;
    }),
    audio: 'Assets/Audio/anim10.mp3',
    subtitle: 'anim10_subtitle',
    requiresGesture: false
  },
};