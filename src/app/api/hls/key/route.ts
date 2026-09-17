import {
  applyCors,
  buildKeyProxyUpstreamUrl,
  fetchProviderToken,
  isAllowedKeyUrl,
  isMockBff,
  jsonResponse,
  optionsResponse,
  shouldAttachApiBearerForKeyUrl,
} from "@/lib/bff";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

/**
 * GET /api/hls/key?videoId=&url=&token=&expires=&username=&mobile=
 * SSRF-safe proxy for HLS encryption keys. Mock mode returns 501.
 */
export async function GET(request: Request) {
  if (isMockBff()) {
    return jsonResponse(
      request,
      {
        message:
          "Key proxy is unavailable in MOCK_BFF mode (sample stream has no enc.key).",
      },
      { status: 501 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const url = searchParams.get("url");
  const token = searchParams.get("token")?.trim() || undefined;
  const expires = searchParams.get("expires")?.trim() || undefined;
  const username = searchParams.get("username")?.trim() || undefined;
  const mobile = searchParams.get("mobile")?.trim() || undefined;

  if (!url || !isAllowedKeyUrl(url)) {
    return jsonResponse(
      request,
      { message: "Key URL rejected by SSRF allowlist." },
      { status: 400 },
    );
  }

  const upstreamUrl = buildKeyProxyUpstreamUrl(url, {
    token,
    expires,
    username,
    mobile,
  });

  try {
    const headers: Record<string, string> = { Accept: "*/*" };
    if (shouldAttachApiBearerForKeyUrl(url)) {
      const { accessToken } = await fetchProviderToken();
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const upstream = await fetch(upstreamUrl, {
      headers,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    applyCors(request, responseHeaders);
    responseHeaders.set(
      "content-type",
      upstream.headers.get("content-type") || "application/octet-stream",
    );
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return jsonResponse(
      request,
      {
        message:
          error instanceof Error ? error.message : "Key proxy failed",
      },
      { status: 502 },
    );
  }
}
