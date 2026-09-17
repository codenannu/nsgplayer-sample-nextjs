# NSG Player — Next.js BFF sample

Thin App Router BFF + `@codenkay/video-nsgplayer-ui` playground.

| | |
|--|--|
| Port | **3001** |
| SDK | `@codenkay/video-nsgplayer-*` **^3.0.4** |
| Modes | **Mock** (default) · **Real** with `VIDEO_API_*` |

## Quick start (mock — no secrets)

```bash
git clone <this-repo> nsgplayer-nextjs
cd nsgplayer-nextjs
npm install
npm run dev
```

Open http://localhost:3001 — enter any video ID → **Play**. Mock BFF returns a public Mux HLS playlist.

## Real provider mode

```bash
cp .env.example .env.local
# set VIDEO_API_CLIENT_ID, VIDEO_API_SECRET, VIDEO_API_BASE_URL
# optional: HLS_KEY_ALLOWED_ORIGINS, CORS_ORIGINS
npm run dev
```

## BFF routes

- `POST /api/auth-token`
- `GET /api/videos/:videoId/signed-url`
- `POST /api/videos/:videoId/proxy-refresh`
- `GET /api/hls/key?url=...` (SSRF allowlist; 501 in mock)

CORS allowlist (default): `http://localhost:5173`, `http://localhost:4200` for the React/Angular samples.

## Version matrix

Tested with `@codenkay/video-nsgplayer-core|react|ui@^3.0.4`.

## Lift into your app

Copy `src/app/api/**` and the `auth` / `playback` / `keyProxyUrlBuilder` wiring from `Playground.tsx`. Never put `clientSecret` in the browser.
