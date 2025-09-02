import { NextRequest, NextResponse } from "next/server";
import { openai, chooseSttModel } from "@/lib/openai";

export const runtime = "nodejs"; // Edge だと FormData の file が厳しいので Node で

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Blob をそのまま受ける（audio/webm, audio/mp4 など）
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 拡張子の推定（最低限）
    const ext = contentType.includes("webm")
      ? "webm"
      : contentType.includes("mp4") || contentType.includes("mp4a")
      ? "m4a"
      : contentType.includes("mpeg")
      ? "mp3"
      : contentType.includes("wav")
      ? "wav"
      : "webm";

    const file = new File([buffer], `chunk.${ext}`, { type: contentType || "audio/webm" });

    // まず gpt-4o-mini-transcribe を試し、失敗時 whisper-1 にフォールバック
    const model = chooseSttModel();

    let text = "";
    try {
      const resp = await openai.audio.transcriptions.create({
        file,
        model,
        // language: "ja", // 必須ではないが日/英中心なら指定可
        // temperature: 0,
      });
      text = resp.text?.trim() ?? "";
    } catch (e) {
      // whisper-1 にフォールバック
      const resp = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
      });
      text = resp.text?.trim() ?? "";
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
