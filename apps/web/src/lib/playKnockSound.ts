/** Short knock/click via Web Audio (no asset file). */
export function playKnockSound(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const playTap = (start: number, frequency: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(frequency, start);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, start + 0.04);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.08);
    };

    playTap(now, 220);
    playTap(now + 0.09, 160);

    window.setTimeout(() => void ctx.close(), 300);
  } catch {
    // Autoplay or AudioContext may be blocked — ignore.
  }
}
