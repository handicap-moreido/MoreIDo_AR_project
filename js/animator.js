export class Animator {
  //Constructor (most importantly defines the frame rate!)
  constructor(imageElement, animationData, frameRate = 48, onComplete = null, subtitleElement = null, translateFunc = null) {
    //Image element to show animation frames
    this.imageElement = imageElement;
    this.frameUrls = animationData.frames;
    this.frameRate = frameRate;
    this.currentFrame = 0;
    this.interval = null;
    this.onComplete = onComplete;

    //Loads the audio clip
    this.audio = new Audio(animationData.audio);
    this.subtitleElement = subtitleElement || document.getElementById('subtitle');

    //Info about subtitles and gesture requirments
    this.subtitleKey = animationData.subtitle || '';
    this.requiresGesture = animationData.requiresGesture || false;
    this.translate = translateFunc || ((key) => key);

    //Pause bool to wait for gesture (if needed)
    this.isPausedForGesture = false;
  }

  //Start playing the animation
  start() {
    if (this.interval) return;

    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play();
    }

    if (this.subtitleElement) {
      this.subtitleElement.innerText = this.translate(this.subtitleKey);
      this.subtitleElement.style.display = 'block';
    }

    this.imageElement.src = this.frameUrls[this.currentFrame];

    //Plays the images at the specified frame rate
    this.interval = setInterval(() => {
      if (this.isPausedForGesture) return;

      this.currentFrame++;

      //Stops if all frames are shown
      if (this.currentFrame >= this.frameUrls.length) {
        this.stop();
        if (this.onComplete) this.onComplete();
        return;
      }

      this.imageElement.src = this.frameUrls[this.currentFrame];
    }, 1000 / this.frameRate);
  }

  //Stop the anim and reset
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

  //Pause without resetting (important for gesture usage!!!)
  pause() {
    clearInterval(this.interval);
    this.interval = null;
    if (this.audio) this.audio.pause();
  }

  //Resume from where it was paused (important for gesture usage!!!)
  resume() {
    if (this.interval) return;
    if (this.audio) this.audio.play();
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

  //Reset animation to first frame
  reset() {
    this.currentFrame = 0;
  }

  //Update animation content
  setFrames(animationData, translateFunc = null) {
    this.frameUrls = animationData.frames;
    this.audio = new Audio(animationData.audio);
    this.subtitleKey = animationData.subtitle || '';
    this.requiresGesture = animationData.requiresGesture || false;
    if (translateFunc) {
      this.translate = translateFunc;
    }
    this.reset();
  }
 
  //Change speed of animation
  setFrameRate(newRate) {
    this.frameRate = newRate;
    this.stop();
    this.start();
  }

  //Pause when waiting for gesture
  waitForGesture() {
    // Pause animation and audio while waiting for gesture
    this.isPausedForGesture = true;
    if (this.audio) this.audio.pause();
  }

  //Resume after gesture detected
  gestureDetected() {
    this.isPausedForGesture = false;
    if (this.audio) this.audio.play();
  }
}
