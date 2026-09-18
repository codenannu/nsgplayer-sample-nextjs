/**
 * Thin browser client for the Next.js BFF sample (nsgplayer-nextjs :3001).
 * Keep identical across nsgplayer-react / nsgplayer-angular `src/shared/`.
 *
 * Contract (no secrets in the browser):
 *   POST /api/auth-token
 *   GET  /api/videos/:videoId/signed-url
 *   POST /api/videos/:videoId/proxy-refresh
 *   GET  /api/hls/key?url=&videoId=&token=&expires=&username=&mobile=
 */

import type {
  AuthConfig,
  AuthToken,
  PlaybackCredentialConfig,
  PlaybackSource,
  StreamingConfig,
} from "@codenkay/video-nsgplayer-core";

export const DEFAULT_BFF_ORIGIN = "http://localhost:3001";

export function normalizeBffOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

async function readJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `BFF request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Auth adapter pointing at an absolute BFF origin. */
export function createBffAuth(origin: string): AuthConfig {
  const base = normalizeBffOrigin(origin);
  return {
    getToken: async (ctx) =>
      readJsonOrThrow<AuthToken>(
        await fetch(`${base}/api/auth-token`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(ctx ?? {}),
        }),
      ),
  };
}

/** Playback adapters pointing at an absolute BFF origin. */
export function createBffPlayback(origin: string): PlaybackCredentialConfig {
  const base = normalizeBffOrigin(origin);
  return {
    getSource: async ({ videoId }) =>
      readJsonOrThrow<PlaybackSource>(
        await fetch(
          `${base}/api/videos/${encodeURIComponent(videoId)}/signed-url`,
        ),
      ),
    refreshSource: async ({ videoId }) =>
      readJsonOrThrow<PlaybackSource>(
        await fetch(
          `${base}/api/videos/${encodeURIComponent(videoId)}/proxy-refresh`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}",
          },
        ),
      ),
  };
}

/** AES enc.key proxy builder + circuit breaker for BFF mode. */
export function createBffStreamingConfig(origin: string): StreamingConfig {
  const base = normalizeBffOrigin(origin);
  return {
    keyProxyMaxFailures: 2,
    keyProxyUrlBuilder: ({
      videoId,
      keyUrl,
      token,
      expires,
      username,
      mobile,
    }) => {
      const params = new URLSearchParams({ url: keyUrl, videoId });
      if (token) params.set("token", token);
      if (expires) params.set("expires", expires);
      if (username) params.set("username", username);
      if (mobile) params.set("mobile", mobile);
      return `${base}/api/hls/key?${params.toString()}`;
    },
  };
}

export type BffAdapters = {
  auth: AuthConfig;
  playback: PlaybackCredentialConfig;
  streaming: StreamingConfig;
};

/** Full BFF client bundle used by React / Angular playgrounds. */
export function createBffAdapters(origin: string): BffAdapters {
  return {
    auth: createBffAuth(origin),
    playback: createBffPlayback(origin),
    streaming: createBffStreamingConfig(origin),
  };
}
