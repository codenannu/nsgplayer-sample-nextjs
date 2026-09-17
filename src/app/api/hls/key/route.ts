import {
  applyCors,
  isAllowedKeyUrl,
  isMockBff,
  jsonResponse,
  optionsResponse,
} from "@/lib/bff";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

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

  const url = new URL(request.url).searchParams.get("url");
  if (!url || !isAllowedKeyUrl(url)) {
    return jsonResponse(
      request,
      { message: "Key URL rejected by SSRF allowlist." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "*/*" },
      cache: "no-store",
    });
    const headers = new Headers();
    applyCors(request, headers);
    headers.set(
      "content-type",
      upstream.headers.get("content-type") || "application/octet-stream",
    );
    return new Response(upstream.body, {
      status: upstream.status,
      headers,
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
