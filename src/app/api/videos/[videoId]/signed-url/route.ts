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

export async function GET(request: Request, ctx: Ctx) {
  const { videoId } = await ctx.params;
  try {
    if (isMockBff()) {
      return jsonResponse(request, mockPlaybackSource(videoId));
    }
    const authHeader = request.headers.get("authorization");
    let accessToken = authHeader?.replace(/^Bearer\s+/i, "") || "";
    if (!accessToken) {
      accessToken = (await fetchProviderToken()).accessToken;
    }
    const source = await fetchProviderSignedUrl(videoId, accessToken);
    return jsonResponse(request, source);
  } catch (error) {
    return jsonResponse(
      request,
      {
        message:
          error instanceof Error ? error.message : "Signed URL failed",
      },
      { status: 502 },
    );
  }
}
