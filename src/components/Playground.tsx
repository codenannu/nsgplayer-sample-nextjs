"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  AuthConfig,
  PlaybackCredentialConfig,
  VideoPlayer as CorePlayer,
} from "@codenkay/video-nsgplayer-core";
import { NsgVideoPlayerWithControls } from "@codenkay/video-nsgplayer-ui";
import { RuntimeSettingsPanel } from "@/components/RuntimeSettingsPanel";
import {
  DEFAULT_PLAYGROUND_CONFIG,
  toPlayerConfigPartial,
  type PlaygroundConfig,
} from "@/shared/playgroundConfig";
import { SDK_VERSION_MATRIX } from "@/shared/sampleMedia";

type AnalyticsEvent = { type: string; at: number };

export function Playground() {
  const [videoIdDraft, setVideoIdDraft] = useState("demo-video");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_PLAYGROUND_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const playerRef = useRef<CorePlayer | null>(null);

  const playerConfig = useMemo(() => {
    const base = toPlayerConfigPartial(config);
    return {
      ...base,
      streaming: {
        keyProxyMaxFailures: 2,
        keyProxyUrlBuilder: ({
          videoId,
          keyUrl,
          token,
          expires,
          username,
          mobile,
        }: {
          videoId: string;
          keyUrl: string;
          token?: string;
          expires?: string;
          username?: string;
          mobile?: string;
        }) => {
          const params = new URLSearchParams({ url: keyUrl, videoId });
          if (token) params.set("token", token);
          if (expires) params.set("expires", expires);
          if (username) params.set("username", username);
          if (mobile) params.set("mobile", mobile);
          return `/api/hls/key?${params.toString()}`;
        },
      },
    };
  }, [config]);

  const auth = useMemo<AuthConfig>(
    () => ({
      getToken: async (ctx) =>
        fetch("/api/auth-token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(ctx),
        }).then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        }),
    }),
    [],
  );

  const playback = useMemo<PlaybackCredentialConfig>(
    () => ({
      getSource: async ({ videoId }) =>
        fetch(`/api/videos/${encodeURIComponent(videoId)}/signed-url`).then(
          async (r) => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          },
        ),
      refreshSource: async ({ videoId }) =>
        fetch(`/api/videos/${encodeURIComponent(videoId)}/proxy-refresh`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }).then(async (r) => {
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        }),
    }),
    [],
  );

  const analytics = useMemo(
    () => ({
      onEvent: (event: { type: string }) => {
        setEvents((prev) =>
          [{ type: event.type, at: Date.now() }, ...prev].slice(0, 12),
        );
      },
    }),
    [],
  );

  const onPlay = () => {
    const id = videoIdDraft.trim();
    if (!id) {
      setError("Enter a video ID.");
      return;
    }
    setError(null);
    setEvents([]);
    setSessionId(id);
  };

  const onStop = () => {
    playerRef.current?.destroy();
    playerRef.current = null;
    setSessionId(null);
    setError(null);
  };

  const onConfigChange = useCallback(
    (next: PlaygroundConfig) => {
      setConfig(next);
      const base = toPlayerConfigPartial(next);
      playerRef.current?.updateConfig({
        ...base,
        streaming: {
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
            return `/api/hls/key?${params.toString()}`;
          },
        },
      });
    },
    [],
  );

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>NSG Player — Next.js BFF sample</h1>
          <p className="muted">
            Thin BFF (mock by default) · SDK{" "}
            <code>ui@{SDK_VERSION_MATRIX.ui}</code> · port <strong>3001</strong>
          </p>
        </div>
        <p className="banner">
          Without <code>VIDEO_API_*</code> secrets the API returns a public Mux
          sample playlist (MOCK_BFF). Set env from <code>.env.example</code> for
          real provider calls. CORS allows localhost:5173 and :4200.
        </p>
      </header>

      <section className="controls" aria-label="Playback source">
        <label>
          Video ID
          <input
            value={videoIdDraft}
            onChange={(e) => setVideoIdDraft(e.target.value)}
            placeholder="demo-video"
          />
        </label>
        <div className="actions">
          <button type="button" className="primary" onClick={onPlay}>
            Play
          </button>
          <button type="button" onClick={onStop} disabled={!sessionId}>
            Stop
          </button>
        </div>
      </section>

      <div className="layout">
        <main className="player-pane">
          {!sessionId ? (
            <div className="placeholder" role="status">
              Enter a video ID and click <strong>Play</strong>. In mock mode any
              ID returns the sample HLS stream.
            </div>
          ) : (
            <div className="player-shell">
              <NsgVideoPlayerWithControls
                ref={playerRef}
                videoId={sessionId}
                auth={auth}
                playback={playback}
                analytics={analytics}
                config={playerConfig}
                className="player"
                onError={(err) => setError(err.message)}
                onAuthError={(err) => setError(err.message)}
              />
            </div>
          )}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {events.length > 0 ? (
            <div className="events" aria-label="Analytics events">
              <h3>Analytics</h3>
              <ul>
                {events.map((e) => (
                  <li key={`${e.type}-${e.at}`}>
                    <code>{e.type}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </main>
        <aside className="settings-pane">
          <RuntimeSettingsPanel value={config} onChange={onConfigChange} />
        </aside>
      </div>
    </div>
  );
}
