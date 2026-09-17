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

  const token = typeof data.token === "string" ? data.token : undefined;
  const username =
    (typeof data.username === "string" && data.username) ||
    (typeof data.userName === "string" && data.userName) ||
    undefined;
  const mobile = typeof data.mobile === "string" ? data.mobile : undefined;

  const authParams: Record<string, string> = {
    ...(data.authParams && typeof data.authParams === "object"
      ? (data.authParams as Record<string, string>)
      : {}),
  };
  if (token && !authParams.token) authParams.token = token;
  if (!authParams.expires) {
    const expires =
      typeof data.expires === "string" || typeof data.expires === "number"
        ? String(data.expires)
        : String(Math.floor(expiresAt / 1000));
    authParams.expires = expires;
  }
  if (username && !authParams.username) authParams.username = username;
  if (mobile && !authParams.mobile) authParams.mobile = mobile;

  return {
    url,
    expiresAt,
    token,
    live: Boolean(data.live),
    authParams: Object.keys(authParams).length > 0 ? authParams : undefined,
  };
}

/** Attach playback session auth onto an allowlisted upstream enc.key URL. */
export function buildKeyProxyUpstreamUrl(
  allowedUrl: string,
  auth: {
    token?: string;
    expires?: string;
    username?: string;
    mobile?: string;
  },
): string {
  const parsed = new URL(allowedUrl);
  parsed.searchParams.delete("token");
  parsed.searchParams.delete("expires");
  parsed.searchParams.delete("username");
  parsed.searchParams.delete("mobile");
  if (auth.token) parsed.searchParams.set("token", auth.token);
  if (auth.expires) parsed.searchParams.set("expires", auth.expires);
  if (auth.username?.trim()) {
    parsed.searchParams.set("username", auth.username.trim());
  }
  if (auth.mobile?.trim()) {
    parsed.searchParams.set("mobile", auth.mobile.trim());
  }
  return parsed.toString();
}

/** API-origin keys may need Bearer; CDN hosts use query auth only. */
export function shouldAttachApiBearerForKeyUrl(candidateUrl: string): boolean {
  const apiBase = process.env.VIDEO_API_BASE_URL;
  if (!apiBase) return false;
  try {
    return new URL(candidateUrl).origin === new URL(apiBase).origin;
  } catch {
    return false;
  }
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
