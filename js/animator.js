export class Animator {
  constructor(imageElement, animationData, frameRate = 12, onComplete = null, subtitleElement = null) {
    this.imageElement = imageElement;
    this.frameUrls = animationData.frames;
    this.frameRate = frameRate;
    this.currentFrame = 0;
    this.interval = null;
    this.onComplete = onComplete;

    this.audio = new Audio(animationData.audio);
    this.subtitleElement = subtitleElement || document.getElementById('subtitle');
    this.subtitleText = animationData.subtitle || '';
  }

  start() {
    if (this.interval) return;

    // Play audio once at start
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play();
    }

    // Show subtitle text
    if (this.subtitleElement) {
      this.subtitleElement.innerText = this.subtitleText;
      this.subtitleElement.style.display = 'block';
    }

    this.imageElement.src = this.frameUrls[this.currentFrame];

    this.interval = setInterval(() => {
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

    // Stop audio if playing
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    // Hide subtitle
    if (this.subtitleElement) {
      this.subtitleElement.style.display = 'none';
    }
  }

  reset() {
    this.currentFrame = 0;
  }

  setFrames(animationData) {
    this.frameUrls = animationData.frames;
    this.audio = new Audio(animationData.audio);
    this.subtitleText = animationData.subtitle || '';
    this.reset();
  }

  setFrameRate(newRate) {
    this.frameRate = newRate;
    this.stop();
    this.start();
  }
}
