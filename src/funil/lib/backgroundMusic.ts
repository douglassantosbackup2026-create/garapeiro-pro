type MusicController = {
  start: () => Promise<void>;
  stop: () => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => boolean;
  isMuted: () => boolean;
  isPlaying: () => boolean;
};

let audio: HTMLAudioElement | null = null;
/** Default muted — música só com opt-in (MusicToggle). */
let muted = true;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio("/bg-ambient.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.25;
  }
  return audio;
}

export const backgroundMusic: MusicController = {
  async start() {
    const el = getAudio();
    el.muted = muted;
    el.volume = muted ? 0 : 0.25;
    try {
      await el.play();
    } catch {
      /* browser may still block; mute toggle will retry */
    }
  },

  stop() {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  },

  setMuted(next) {
    muted = next;
    if (!audio) return;
    audio.muted = next;
    audio.volume = next ? 0 : 0.25;
  },

  toggleMuted() {
    const next = !muted;
    backgroundMusic.setMuted(next);
    return next;
  },

  isMuted() {
    return muted;
  },

  isPlaying() {
    return !!audio && !audio.paused;
  },
};
