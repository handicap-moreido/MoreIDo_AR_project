export class Animator {
  constructor(imageElement, animationData, frameRate = 24, onComplete = null, subtitleElement = null, translateFunc = null) {
    this.imageElement = imageElement;
    this.frameRate = frameRate;
    this.onComplete = onComplete;
    this.subtitleElement = subtitleElement;
    this.translate = translateFunc || (key => key);
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.isPausedForGesture = false;

    this.setFrames(animationData);
    this.rafId = null;
    this.currentFrame = 0;
    this.lastFrameTime = null;
    this.frameInterval = 1000 / this.frameRate;
    this.isPlaying = false;
    this.gestureSfxPlayed = false;
  }

  setFrames(animationData) {
    this.stop();
    this.currentFrame = 0;
    this.lastFrameTime = null;
    this.subtitleKey = animationData.subtitle || '';
    this.requiresGesture = animationData.requiresGesture || false;
    this.audio.src = animationData.audio;
    this.gestureSfxPlayed = false;
    this.preloadedFrames = animationData.frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  start() {
    if (this.isPlaying || !this.preloadedFrames.length) return;

    this.isPlaying = true;
    this.audio.play().catch(e => console.warn("Audio play blocked:", e));

    if (this.subtitleElement) {
      this.subtitleElement.innerText = this.translate(this.subtitleKey);
      this.subtitleElement.style.display = 'block';
    }

    this.rafId = requestAnimationFrame(this._animate.bind(this));
  }

  _animate(timestamp) {
    if (!this.isPlaying || this.isPausedForGesture) return;

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

    this.rafId = requestAnimationFrame(this._animate.bind(this));
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.audio.pause();
    this.isPlaying = false;
    if (this.subtitleElement) {
      this.subtitleElement.style.display = 'none';
    }
  }

  pause() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.audio.pause();
    this.isPlaying = false;
  }

  resume() {
    if (this.isPlaying || !this.preloadedFrames.length) return;
    this.isPlaying = true;
    this.audio.play().catch(e => console.warn("Audio resume failed:", e));
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this._animate.bind(this));
  }

  reset() {
    this.stop();
    this.currentFrame = 0;
    this.imageElement.src = this.preloadedFrames[0]?.src || '';
    this.gestureSfxPlayed = false;
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