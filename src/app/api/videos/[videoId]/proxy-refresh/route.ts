import {
  fetchProviderSignedUrl,
  fetchProviderToken,
  isMockBff,
  jsonResponse,
  mockPlaybackSource,
  optionsResponse,
} from "@/lib/bff";

type Ctx = { params: Promise<{ videoId: string }> };

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

/**
 * Sample refresh: mock re-mints; real mode re-fetches signed-url
 * (proxy-refresh body shape varies by provider — adapt for production).
 */
export async function POST(request: Request, ctx: Ctx) {
  const { videoId } = await ctx.params;
  try {
    if (isMockBff()) {
      return jsonResponse(request, mockPlaybackSource(videoId));
    }
    const accessToken = (await fetchProviderToken()).accessToken;
    const source = await fetchProviderSignedUrl(videoId, accessToken);
    return jsonResponse(request, source);
  } catch (error) {
    return jsonResponse(
      request,
      {
        message:
          error instanceof Error ? error.message : "Proxy refresh failed",
      },
      { status: 502 },
    );
  }
}
