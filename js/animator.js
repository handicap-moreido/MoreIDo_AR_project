// animator.js

// The Animator class controls the playback of a sprite animation by cycling through image URLs and updating the image element at a set frame rate.
export class Animator {
  /**
   * Constructor to initialize the Animator.
   * @param {HTMLElement} imageElement - The <img> element to animate.
   * @param {string[]} frameUrls - An array of image URLs representing animation frames.
   * @param {number} frameRate - Number of frames per second. Default is 12.
   * @param {Function|null} onComplete - Optional callback called when the animation finishes.
   *
   * !!!!!!once this is ported OUT of glitch, The ANIMATIONS will have to be reformatted from https links to a local folder path
   */
  constructor(imageElement, frameUrls, frameRate = 12, onComplete = null) {
    this.imageElement = imageElement;   // The image element on the page where frames will be shown
    this.frameUrls = frameUrls;         // Array of image sources (frames of the animation)
    this.frameRate = frameRate;         // How fast the animation plays (frames per second)
    this.currentFrame = 0;              // Index of the current frame being displayed
    this.interval = null;               // Reference to the setInterval controlling the animation loop
    this.onComplete = onComplete;       // Callback to call when animation finishes
  }

  /**
   * Starts the animation loop.
   * If it's already running, it does nothing.
   */
  start() {
    if (this.interval) return; // Prevent starting multiple loops at the same time

    this.interval = setInterval(() => {
      // Update the image's source to the current frame
      this.imageElement.src = this.frameUrls[this.currentFrame];

      // If this is the last frame, trigger onComplete and stop animation
      if (this.currentFrame === this.frameUrls.length - 1) {
        if (this.onComplete) this.onComplete();
        this.stop();
      } else {
        // Otherwise, advance to the next frame
        this.currentFrame++;
      }
    }, 1000 / this.frameRate); // Run every X milliseconds, based on the frame rate
  }

  /**
   * Stops the animation loop.
   */
  stop() {
    clearInterval(this.interval); // Stop the loop
    this.interval = null;         // Reset the interval reference
  }

  /**
   * Resets the animation back to the first frame.
   * This does not stop or start the animation.
   */
  reset() {
    this.currentFrame = 0; // Go back to the first frame
  }

  /**
   * Allows you to change the frames used in the animation.
   * It also resets the animation to the beginning.
   * @param {string[]} newFrames - New array of frame image URLs.
   */
  setFrames(newFrames) {
    this.frameUrls = newFrames;
    this.reset(); // Start from the beginning of the new frames
  }

  /**
   * Allows you to change the frame rate of the animation.
   * It restarts the animation with the new speed.
   * @param {number} newRate - The new frame rate (frames per second).
   */
  setFrameRate(newRate) {
    this.frameRate = newRate; // Update the frame rate
    this.stop();              // Stop the current animation loop
    this.start();             // Start a new one with the new timing
  }
}
