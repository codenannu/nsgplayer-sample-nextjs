import { SAMPLE_HLS_URL } from "@/shared/sampleMedia";

export function isMockBff(): boolean {
  if (process.env.MOCK_BFF === "1") return true;
  if (process.env.MOCK_BFF === "0") return false;
  return !(
    process.env.VIDEO_API_CLIENT_ID &&
    process.env.VIDEO_API_SECRET &&
    process.env.VIDEO_API_BASE_URL
  );
}

export function corsOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ||
    "http://localhost:5173,http://localhost:4200";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function applyCors(request: Request, headers: Headers): void {
  const origin = request.headers.get("origin");
  const allowed = corsOrigins();
  if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Playback-Session-Id",
    );
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
}

export function jsonResponse(
  request: Request,
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  applyCors(request, headers);
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function optionsResponse(request: Request): Response {
  const headers = new Headers();
  applyCors(request, headers);
  return new Response(null, { status: 204, headers });
}

export type TokenResponse = {
  accessToken: string;
  expiresAt: number;
};

export type PlaybackSourceResponse = {
  url: string;
  expiresAt: number;
  token?: string;
  live?: boolean;
  authParams?: Record<string, string>;
};

export function mockToken(): TokenResponse {
  return {
    accessToken: "mock-access-token",
    expiresAt: Date.now() + 55 * 60_000,
  };
}

export function mockPlaybackSource(videoId: string): PlaybackSourceResponse {
  return {
    url: SAMPLE_HLS_URL,
    expiresAt: Date.now() + 30 * 60_000,
    token: "mock-playback-token",
    live: false,
    authParams: {
      token: "mock-playback-token",
      expires: String(Math.floor(Date.now() / 1000) + 1800),
      videoId,
    },
  };
}

export async function fetchProviderToken(): Promise<TokenResponse> {
  const base = process.env.VIDEO_API_BASE_URL!.replace(/\/$/, "");
  const id = process.env.VIDEO_API_CLIENT_ID!;
  const secret = process.env.VIDEO_API_SECRET!;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${base}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Provider auth failed (${res.status})`);
  }
  const data = (await res.json()) as {
    accessToken?: string;
    access_token?: string;
    expiresAt?: number;
    expires_at?: number;
  };
  const accessToken = data.accessToken || data.access_token;
  const expiresAt =
    data.expiresAt ||
    data.expires_at ||
    Date.now() + 55 * 60_000;
  if (!accessToken) throw new Error("Provider auth missing accessToken");
  return { accessToken, expiresAt };
}

export async function fetchProviderSignedUrl(
  videoId: string,
  accessToken: string,
): Promise<PlaybackSourceResponse> {
  const base = process.env.VIDEO_API_BASE_URL!.replace(/\/$/, "");
  const res = await fetch(`${base}/media/${encodeURIComponent(videoId)}/signed-url`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Signed URL failed (${res.status})`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const url =
    (data.signedUrl as string) ||
    (data.url as string) ||
    (data.playbackUrl as string);
  if (!url) throw new Error("Signed URL response missing url");
  const expiresAt =
    typeof data.expiresAt === "number"
      ? data.expiresAt
      : Date.now() + 30 * 60_000;
  return {
    url,
    expiresAt,
    token: typeof data.token === "string" ? data.token : undefined,
    live: Boolean(data.live),
    authParams:
      data.authParams && typeof data.authParams === "object"
        ? (data.authParams as Record<string, string>)
        : undefined,
  };
}

export function keyAllowedOrigins(): string[] {
  const fromEnv = (process.env.HLS_KEY_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const api = process.env.VIDEO_API_BASE_URL
    ? [new URL(process.env.VIDEO_API_BASE_URL).origin]
    : [];
  return [...new Set([...fromEnv, ...api])];
}

export function isAllowedKeyUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const allowed = keyAllowedOrigins();
    if (allowed.length === 0) return false;
    if (!allowed.includes(u.origin)) return false;
    return /enc\.key$/i.test(u.pathname) || /\/(video|web-vod|hls-key)\//i.test(u.pathname);
  } catch {
    return false;
  }
}
