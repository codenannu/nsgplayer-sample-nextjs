# NSG Player — Next.js BFF sample

Public playground with a **thin App Router BFF** + full React control chrome for signed / authenticated NSG HLS playback.

| | |
|--|--|
| Port | **3001** |
| Repo | [nsgplayer-sample-nextjs](https://github.com/codenannu/nsgplayer-sample-nextjs) |
| SDK (pinned) | `@codenkay/video-nsgplayer-core` / `react` / `ui` **^3.0.4** |
| Modes | **Mock** (default, no secrets) · **Real** with `VIDEO_API_*` |

> This sample is **standalone**. It does **not** require cloning the private SDK monorepo ([`nsgplayer-video`](https://github.com/codenannu/nsgplayer-video)). It installs packages from **npm** only. The private repo’s `apps/demo` is the full product demo — this sample is the customer-facing BFF lab.

## SDK packages

| Package | Role | Used here |
|---------|------|-----------|
| [`@codenkay/video-nsgplayer-core`](https://www.npmjs.com/package/@codenkay/video-nsgplayer-core) | Framework-agnostic HLS engine | Yes |
| [`@codenkay/video-nsgplayer-react`](https://www.npmjs.com/package/@codenkay/video-nsgplayer-react) | React shell / headless player | Yes |
| [`@codenkay/video-nsgplayer-ui`](https://www.npmjs.com/package/@codenkay/video-nsgplayer-ui) | Control chrome | **Primary UI** |
| [`@codenkay/video-nsgplayer-angular`](https://www.npmjs.com/package/@codenkay/video-nsgplayer-angular) | Angular headless | No — see [Angular sample](https://github.com/codenannu/nsgplayer-sample-angular) (can call this BFF) |

## Related samples

| Sample | Repository | Port | Purpose |
|--------|------------|------|---------|
| React (no BFF) | [nsgplayer-sample-react](https://github.com/codenannu/nsgplayer-sample-react) | **5173** | Public `sourceUrl` only |
| **This repo** | [nsgplayer-sample-nextjs](https://github.com/codenannu/nsgplayer-sample-nextjs) | **3001** | Thin BFF + UI playground |
| Angular | [nsgplayer-sample-angular](https://github.com/codenannu/nsgplayer-sample-angular) | **4200** | Headless; BFF mode targets this origin |

CORS allowlist (default): `http://localhost:5173`, `http://localhost:4200`.

## Quick start (mock — no secrets)

```bash
git clone https://github.com/codenannu/nsgplayer-sample-nextjs.git
cd nsgplayer-sample-nextjs
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

**Never** put `VIDEO_API_SECRET` / `clientSecret` in browser or `NEXT_PUBLIC_*` vars.

## BFF routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth-token` | Short-lived playback token |
| `GET` | `/api/videos/:videoId/signed-url` | Signed HLS source |
| `POST` | `/api/videos/:videoId/proxy-refresh` | Refresh / rotate source |
| `GET` | `/api/hls/key?url=…` | Key proxy (SSRF allowlist; **501** in mock) |

## Install peers (into your own app)

```bash
npm install @codenkay/video-nsgplayer-ui @codenkay/video-nsgplayer-react @codenkay/video-nsgplayer-core hls.js react react-dom
```

Wire `auth.getToken`, `playback.getSource` / `refreshSource`, and optional `keyProxyUrlBuilder` to **your** BFF (copy patterns from `src/app/api/**` and `Playground.tsx`).

## Shared contract

`src/shared/` is vendored identically in the React and Angular samples. Keep them in sync when editing playground fields.

## Version matrix

| Package | Tested |
|---------|--------|
| `@codenkay/video-nsgplayer-core` | ^3.0.4 |
| `@codenkay/video-nsgplayer-react` | ^3.0.4 |
| `@codenkay/video-nsgplayer-ui` | ^3.0.4 |

## Troubleshooting

- **CI / local without secrets** — leave mock mode (default); do not require `VIDEO_API_*`.
- **CORS from Angular/React samples** — ensure this app is on **3001** and origins are allowlisted.
- **Styles** — `import "@codenkay/video-nsgplayer-ui/styles.css"` from JS/TS (not Tailwind CSS `@import`).

## License

MIT
