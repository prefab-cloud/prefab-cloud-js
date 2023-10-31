export class ExponentialBackoff {
  private initialDelay: number;

  private maxDelay: number;

  private multiplier: number;

  private delay: number;

  // arguments are in seconds
  constructor(maxDelay: number, initialDelay = 2, multiplier = 2) {
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.multiplier = multiplier;
    this.delay = initialDelay;
  }

  call(): number {
    const delayValue = this.delay;
    this.delay = Math.min(this.delay * this.multiplier, this.maxDelay);
    return delayValue * 1000;
  }
}
