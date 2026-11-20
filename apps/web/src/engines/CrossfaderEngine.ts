export class CrossfaderEngine {
  private static animationFrameId: number | null = null;

  /**
   * Calculate effective volume (0 - 1.0 linear) given deck's user volume (0 - 100) and crossfader position (-1 to +1)
   */
  public static calculateEffectiveVolumes(
    volA: number,
    volB: number,
    crossfader: number // -1 (A) to 0 (center) to +1 (B)
  ): { effectiveVolA: number; effectiveVolB: number } {
    const normVolA = Math.max(0, Math.min(100, volA)) / 100;
    const normVolB = Math.max(0, Math.min(100, volB)) / 100;
    const clampedCrossfader = Math.max(-1, Math.min(1, crossfader));

    let gainMultiplierA = 1.0;
    let gainMultiplierB = 1.0;

    if (clampedCrossfader < 0) {
      // Left side: Deck A full, Deck B attenuated
      gainMultiplierA = 1.0;
      gainMultiplierB = 1.0 + clampedCrossfader; // e.g. -1 => 0, -0.5 => 0.5
    } else {
      // Right side: Deck B full, Deck A attenuated
      gainMultiplierA = 1.0 - clampedCrossfader; // e.g. +1 => 0, +0.5 => 0.5
      gainMultiplierB = 1.0;
    }

    return {
      effectiveVolA: Math.round(normVolA * gainMultiplierA * 100),
      effectiveVolB: Math.round(normVolB * gainMultiplierB * 100)
    };
  }

  /**
   * Smoothly animates crossfader from current position to target position over specified duration
   */
  public static animateTransition(
    startPos: number,
    targetPos: number,
    durationSec: number,
    onProgress: (pos: number, progress: number) => void,
    onComplete: () => void
  ) {
    this.cancelTransition();

    const durationMs = durationSec * 1000;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Smooth ease-in-out easing
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentPos = startPos + (targetPos - startPos) * easedProgress;

      onProgress(currentPos, progress);

      if (progress < 1.0) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.animationFrameId = null;
        onProgress(targetPos, 1.0);
        onComplete();
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  public static cancelTransition() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
