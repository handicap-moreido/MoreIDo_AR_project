export class Animator {
  constructor(imageElement, animationData, frameRate = 24, onComplete = null, subtitleElement = null, translateFunc = null) {
    this.imageElement = imageElement;
    this.frameRate = frameRate;
    this.onComplete = onComplete;
    this.subtitleElement = subtitleElement;
    this.translate = translateFunc || (key => key);
    this.isPausedForGesture = false;
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.setFrames(animationData);
    this.rafId = null;
  }

  setFrames(animationData) {
    this.stop();
    this.currentFrame = 0;
    this.lastFrameTime = null;
    this.frameInterval = 1000 / this.frameRate;
    this.subtitleKey = animationData.subtitle || '';
    this.requiresGesture = animationData.requiresGesture || false;
    this.audio.src = animationData.audio;
    this.preloadedFrames = animationData.frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  start() {
    if (this.rafId || !this.preloadedFrames.length) return;

    this.audio.currentTime = 0;
    this.audio.play().catch(e => console.warn('Audio play blocked:', e));

    if (this.subtitleElement) {
      this.subtitleElement.innerText = this.translate(this.subtitleKey);
      this.subtitleElement.style.display = 'block';
    }

    const animate = (timestamp) => {
      if (this.isPausedForGesture) return;

      if (!this.lastFrameTime) this.lastFrameTime = timestamp;
      const elapsed = timestamp - this.lastFrameTime;

      if (elapsed >= this.frameInterval) {
        this.lastFrameTime = timestamp;

        if (this.currentFrame >= this.preloadedFrames.length) {
          this.stop();
          if (this.onComplete) this.onComplete();
          return;
        }

        this.imageElement.src = this.preloadedFrames[this.currentFrame].src;
        this.currentFrame++;
      }

      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.subtitleElement) {
      this.subtitleElement.style.display = 'none';
    }
  }

  pause() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.audio) this.audio.pause();
  }

  resume() {
    if (this.rafId || !this.preloadedFrames.length) return;
    this.audio.play().catch(e => console.warn('Audio resume failed:', e));
    this.start();
  }

  reset() {
    this.stop();
    this.currentFrame = 0;
    this.imageElement.src = this.preloadedFrames[0]?.src || '';
  }

  waitForGesture() {
    this.isPausedForGesture = true;
    this.pause();
  }

  gestureDetected() {
    this.isPausedForGesture = false;
    this.resume();
  }
}
