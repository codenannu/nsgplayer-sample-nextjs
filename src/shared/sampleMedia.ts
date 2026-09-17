/**
 * Public sample HLS for zero-setup demos (no BFF / no secrets).
 * Keep in sync across nsgplayer-react / nsgplayer-nextjs / nsgplayer-angular.
 */
export const SAMPLE_HLS_URL =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

/** SDK version matrix — update when bumping package.json dependencies. */
export const SDK_VERSION_MATRIX = {
  core: "^5.0.0",
  react: "^5.0.0",
  ui: "^5.0.0",
  angular: "^5.0.0",
} as const;
