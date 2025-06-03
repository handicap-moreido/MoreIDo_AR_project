export class Animator {
  constructor(imageElement, animationData, frameRate = 24, onComplete = null, subtitleElement = null, translateFunc = null) {
    this.imageElement = imageElement;
    this.frameUrls = animationData.frames;
    this.frameRate = frameRate;
    this.currentFrame = 0;
    this.interval = null;
    this.onComplete = onComplete;
    this.audio = new Audio(animationData.audio);
    this.subtitleElement = subtitleElement || document.getElementById('subtitle');
    this.subtitleKey = animationData.subtitle || '';
    this.requiresGesture = animationData.requiresGesture || false;
    this.translate = translateFunc || ((key) => key);
    this.isPausedForGesture = false;
    this.isLoaded = false;
    this.imageElement.onload = () => { this.isLoaded = true; };
    this.imageElement.onerror = () => console.error(`Failed to load frame: ${this.frameUrls[this.currentFrame]}`);
    this.imageElement.src = this.frameUrls[0];
  }

  start() {
    if (this.interval || !this.isLoaded) return;

    console.log(`Starting animation with ${this.frameUrls.length} frames, audio: ${this.audio.src}`);

    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(err => console.error('Audio playback error:', err));
    }

    if (this.subtitleElement) {
      this.subtitleElement.innerText = this.translate(this.subtitleKey);
      this.subtitleElement.style.display = 'block';
    }

    this.imageElement.src = this.frameUrls[this.currentFrame];

    this.interval = setInterval(() => {
      if (this.isPausedForGesture) return;

      this.currentFrame++;

      if (this.currentFrame >= this.frameUrls.length) {
        this.stop();
        if (this.onComplete) this.onComplete();
        return;
      }

      this.imageElement.src = this.frameUrls[this.currentFrame];
    }, 1000 / this.frameRate);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.subtitleElement) {
      this.subtitleElement.style.display = 'none';
    }
  }

  pause() {
    clearInterval(this.interval);
    this.interval = null;
    if (this.audio) this.audio.pause();
  }

  resume() {
    if (this.interval) return;
    if (this.audio) this.audio.play().catch(err => console.error('Audio playback error:', err));
    this.start();
  }

  reset() {
    this.currentFrame = 0;
    this.isLoaded = false;
    this.imageElement.src = this.frameUrls[0];
  }

  setFrames(animationData, translateFunc = null) {
    this.stop();
    this.frameUrls = animationData.frames;
    this.audio = new Audio(animationData.audio);
    this.subtitleKey = animationData.subtitle || '';
    this.requiresGesture = animationData.requiresGesture || false;
    if (translateFunc) {
      this.translate = translateFunc;
    }
    this.reset();
  }

  setFrameRate(newRate) {
    this.frameRate = newRate;
    this.stop();
    this.start();
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