import { NextRequest, NextResponse } from "next/server";
import {
  GEMINI_IMAGE_DEFAULT_MODEL,
  GEMINI_IMAGE_SIZE,
  GEMINI_TIMEOUT_MS,
  REALISTIC_TRY_ON_PROMPT,
  SUPPORTED_ASPECT_RATIOS,
  TRY_ON_AI_MESSAGES,
  type AspectRatio,
} from "../../config/tryOnPrompts";

interface TryOnRequestBody {
  faceImage?: string;
  glassesImage?: string;
  aspectRatio?: string;
}

interface InlineDataPart {
  inlineData: { mimeType: string; data: string };
}

type GeminiPart = { text: string } | InlineDataPart;

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/;

/** Razones de bloqueo del modelo que mapeamos a un mensaje amigable. */
const BLOCKED_REASONS = new Set([
  "SAFETY",
  "IMAGE_SAFETY",
  "PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
]);

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = DATA_URL_PATTERN.exec(dataUrl.trim());
  if (!match) return null;
  return { mimeType: match[1], base64: match[2].replace(/\s/g, "") };
}

function normalizeAspectRatio(value: string | undefined): AspectRatio | undefined {
  if (!value) return undefined;
  return (SUPPORTED_ASPECT_RATIOS as readonly string[]).includes(value)
    ? (value as AspectRatio)
    : undefined;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: TRY_ON_AI_MESSAGES.notConfigured }, { status: 503 });
  }

  let body: TryOnRequestBody;
  try {
    body = (await request.json()) as TryOnRequestBody;
  } catch {
    return NextResponse.json({ error: TRY_ON_AI_MESSAGES.badRequest }, { status: 400 });
  }

  const face = body.faceImage ? parseDataUrl(body.faceImage) : null;
  const glasses = body.glassesImage ? parseDataUrl(body.glassesImage) : null;
  if (!face || !glasses) {
    return NextResponse.json({ error: TRY_ON_AI_MESSAGES.badRequest }, { status: 400 });
  }

  const model = process.env.GEMINI_IMAGE_MODEL || GEMINI_IMAGE_DEFAULT_MODEL;
  const aspectRatio = normalizeAspectRatio(body.aspectRatio);

  const parts: GeminiPart[] = [
    { text: REALISTIC_TRY_ON_PROMPT },
    { inlineData: { mimeType: face.mimeType, data: face.base64 } },
    { inlineData: { mimeType: glasses.mimeType, data: glasses.base64 } },
  ];

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              imageSize: GEMINI_IMAGE_SIZE,
              ...(aspectRatio ? { aspectRatio } : {}),
            },
          },
        }),
      },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("[try-on] Error llamando a Gemini:", error);
    return NextResponse.json(
      { error: timedOut ? TRY_ON_AI_MESSAGES.timeout : TRY_ON_AI_MESSAGES.upstream },
      { status: timedOut ? 504 : 502 },
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[try-on] Gemini respondió ${response.status}:`, detail.slice(0, 500));
    return NextResponse.json(
      {
        error:
          response.status === 400
            ? TRY_ON_AI_MESSAGES.badRequest
            : TRY_ON_AI_MESSAGES.upstream,
      },
      { status: 502 },
    );
  }

  let payload: {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
    }>;
    promptFeedback?: { blockReason?: string };
  };
  try {
    payload = await response.json();
  } catch {
    return NextResponse.json({ error: TRY_ON_AI_MESSAGES.upstream }, { status: 502 });
  }

  const blockReason =
    payload.promptFeedback?.blockReason ?? payload.candidates?.[0]?.finishReason;
  const candidate = payload.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData) {
    if ((blockReason && BLOCKED_REASONS.has(blockReason)) || !candidate) {
      return NextResponse.json({ error: TRY_ON_AI_MESSAGES.blocked }, { status: 422 });
    }
    const textPart = candidate?.content?.parts?.find((part) => part.text)?.text;
    console.error("[try-on] Respuesta sin imagen:", textPart?.slice(0, 300) ?? blockReason);
    return NextResponse.json({ error: TRY_ON_AI_MESSAGES.upstream }, { status: 502 });
  }

  const { mimeType, data } = imagePart.inlineData;
  return NextResponse.json({
    image: `data:${mimeType || "image/png"};base64,${data}`,
  });
}
