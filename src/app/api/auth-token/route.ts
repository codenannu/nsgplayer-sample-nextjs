import {
  fetchProviderToken,
  isMockBff,
  jsonResponse,
  mockToken,
  optionsResponse,
} from "@/lib/bff";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  try {
    if (isMockBff()) {
      return jsonResponse(request, mockToken());
    }
    const token = await fetchProviderToken();
    return jsonResponse(request, token);
  } catch (error) {
    return jsonResponse(
      request,
      {
        message:
          error instanceof Error ? error.message : "Auth token failed",
      },
      { status: 502 },
    );
  }
}
