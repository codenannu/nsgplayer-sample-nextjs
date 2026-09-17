/**
 * Shared playground config contract — keep in sync across
 * nsgplayer-react / nsgplayer-nextjs / nsgplayer-angular `src/shared/`.
 *
 * Maps to @codenkay/video-nsgplayer-core PlayerConfig partials.
 */

export type PlayIconPreset = "triangle" | "circle" | "roundedSquare";

export type PlaygroundConfig = {
  autoplay: boolean;
  startMuted: boolean;
  skipSeconds: 5 | 10 | 15 | 30;
  speedOptionCount: number;
  showQuality: boolean;
  showSpeed: boolean;
  showCaptions: boolean;
  showVolume: boolean;
  showFullscreen: boolean;
  showLive: boolean;
  persistQualityPreference: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkDurationMs: number;
  watermarkIntervalMaxMs: number;
  seekProgressColor: string;
  controlIconColor: string;
  playIconPreset: PlayIconPreset;
  reducedMotion: boolean;
};

export const DEFAULT_PLAYGROUND_CONFIG: PlaygroundConfig = {
  autoplay: true,
  startMuted: true,
  skipSeconds: 10,
  speedOptionCount: 6,
  showQuality: true,
  showSpeed: true,
  showCaptions: true,
  showVolume: true,
  showFullscreen: true,
  showLive: true,
  persistQualityPreference: false,
  watermarkEnabled: true,
  watermarkText: "sample@nsgplayer",
  watermarkDurationMs: 10_000,
  watermarkIntervalMaxMs: 60_000,
  seekProgressColor: "#38bdf8",
  controlIconColor: "#f1f5f9",
  playIconPreset: "triangle",
  reducedMotion: false,
};

/** Shape accepted by mergePlayerConfig / VideoPlayer config prop. */
export type PlayerConfigPartial = {
  player: {
    autoplay: boolean;
    startMuted: boolean;
    skipSeconds: 5 | 10 | 15 | 30;
    speedOptionCount: number;
  };
  controls: {
    enabled: boolean;
    showQuality: boolean;
    showSpeed: boolean;
    showCaptions: boolean;
    showVolume: boolean;
    showFullscreen: boolean;
    showLive: boolean;
    persistQualityPreference: boolean;
  };
  watermark: {
    enabled: boolean;
    text: string;
    durationMs: number;
    intervalMaxMs: number;
  };
  theme: {
    seekProgressColor: string;
    controlIconColor: string;
    playIconPreset: PlayIconPreset;
  };
  accessibility: {
    reducedMotion: boolean;
  };
};

export function toPlayerConfigPartial(
  cfg: PlaygroundConfig,
): PlayerConfigPartial {
  return {
    player: {
      autoplay: cfg.autoplay,
      startMuted: cfg.startMuted,
      skipSeconds: cfg.skipSeconds,
      speedOptionCount: cfg.speedOptionCount,
    },
    controls: {
      enabled: true,
      showQuality: cfg.showQuality,
      showSpeed: cfg.showSpeed,
      showCaptions: cfg.showCaptions,
      showVolume: cfg.showVolume,
      showFullscreen: cfg.showFullscreen,
      showLive: cfg.showLive,
      persistQualityPreference: cfg.persistQualityPreference,
    },
    watermark: {
      enabled: cfg.watermarkEnabled,
      text: cfg.watermarkText,
      durationMs: cfg.watermarkDurationMs,
      intervalMaxMs: cfg.watermarkIntervalMaxMs,
    },
    theme: {
      seekProgressColor: cfg.seekProgressColor,
      controlIconColor: cfg.controlIconColor,
      playIconPreset: cfg.playIconPreset,
    },
    accessibility: {
      reducedMotion: cfg.reducedMotion,
    },
  };
}
