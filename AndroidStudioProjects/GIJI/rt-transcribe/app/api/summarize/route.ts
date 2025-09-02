import { NextRequest, NextResponse } from "next/server";
import { openai, chooseTextModel } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    const model = chooseTextModel();

    const prompt = `あなたは有能な秘書です。以下は会議の議事録の断片を時系列に結合した全文です。\n\n---\n${transcript}\n---\n\n出力フォーマット: \n- サマリー（5行以内）\n- 決定事項\n- 未決事項\n- 次のアクション（担当/期限つき）\n- キー引用（3件）`;

    const resp = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes meeting notes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const text = resp.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
