/**
 * Music Manager — drop-in background music system.
 *
 * Place audio files in  public/audio/  with these names:
 *   • menu-music.mp3   — plays on the lobby / main menu screen
 *   • game-music.mp3   — plays during gameplay
 *
 * Supported format: MP3 (broad compatibility + good quality/size ratio).
 * To swap a track, just replace the file keeping the same name.
 *
 * Features:
 *   - Crossfade between tracks (500 ms default)
 *   - Loops automatically
 *   - Respects a single shared volume level
 *   - Gracefully handles missing files (no crash, just silence)
 */

const FADE_MS = 500;
const DEFAULT_VOLUME = 0.35;

type Track = 'menu' | 'game';

const TRACK_PATHS: Record<Track, string> = {
  menu: '/audio/menu-music.mp3',
  game: '/audio/game-music.mp3',
};

class MusicManager {
  private current: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private volume = DEFAULT_VOLUME;
  private fadeTimer: number | null = null;

  /** Start or crossfade to the given track. No-op if already playing it. */
  play(track: Track) {
    if (this.currentTrack === track && this.current && !this.current.paused) return;

    const next = new Audio(TRACK_PATHS[track]);
    next.loop = true;
    next.volume = 0;

    // Attempt to play — may fail if browser blocks autoplay before interaction
    const playPromise = next.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked — we'll retry on next user interaction
        const resume = () => {
          next.play().catch(() => {});
          document.removeEventListener('click', resume);
          document.removeEventListener('keydown', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
      });
    }

    // Fade out old track, fade in new one
    this.crossfade(this.current, next);
    this.current = next;
    this.currentTrack = track;
  }

  /** Stop all music with a short fade-out. */
  stop() {
    if (!this.current) return;
    this.fadeOut(this.current);
    this.current = null;
    this.currentTrack = null;
  }

  /** Set master volume (0-1). Applies immediately to the active track. */
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.current && !this.current.paused) {
      this.current.volume = this.volume;
    }
  }

  getVolume() {
    return this.volume;
  }

  private crossfade(old: HTMLAudioElement | null, next: HTMLAudioElement) {
    if (this.fadeTimer !== null) cancelAnimationFrame(this.fadeTimer);

    const start = performance.now();
    const oldStartVol = old ? old.volume : 0;

    const step = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / FADE_MS, 1);

      if (old) old.volume = oldStartVol * (1 - t);
      next.volume = this.volume * t;

      if (t < 1) {
        this.fadeTimer = requestAnimationFrame(step);
      } else {
        this.fadeTimer = null;
        if (old) {
          old.pause();
          old.src = '';
        }
      }
    };

    this.fadeTimer = requestAnimationFrame(step);
  }

  private fadeOut(el: HTMLAudioElement) {
    if (this.fadeTimer !== null) cancelAnimationFrame(this.fadeTimer);

    const start = performance.now();
    const startVol = el.volume;

    const step = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / FADE_MS, 1);
      el.volume = startVol * (1 - t);

      if (t < 1) {
        this.fadeTimer = requestAnimationFrame(step);
      } else {
        this.fadeTimer = null;
        el.pause();
        el.src = '';
      }
    };

    this.fadeTimer = requestAnimationFrame(step);
  }
}

/** Singleton — import and use directly */
export const music = new MusicManager();
