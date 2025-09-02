要

マイク + タブ（システム）音声を同時に録音し、Web Audio APIでミックス

発話区切り（VAD）: Harkで話し始め/終わりを検知し、**しきい値（例: 最低10秒）**で短すぎる断片を無視

区切りごとにOpenAI Transcribeへ送ってテキスト化（モデル: gpt-4o-mini-transcribe 推奨／代替 whisper-1）

画面にリアルタイム表示、**録音後まとめ（要約/アクション抽出）**も可能

（任意）DBへセグメントを保存できるようPrismaスキーマを同梱

2. かんたんセットアップ
# 1) プロジェクト作成
pnpm dlx create-next-app@latest rt-transcribe --typescript --eslint --app --src-dir --import-alias "@/*"
cd rt-transcribe


# 2) 依存パッケージ
pnpm add openai hark


# 3) 環境変数
cp .env.local.example .env.local
# .env.local に OpenAI API Key を設定

/.env.local.example

OPENAI_API_KEY=""
# （任意）要約などで使うモデル。空なら responses API で gpt-4o-mini を利用
OPENAI_TEXT_MODEL="gpt-4o-mini"
# （任意）音声→テキストモデル（空なら gpt-4o-mini-transcribe を優先、無ければ whisper-1）
OPENAI_STT_MODEL="gpt-4o-mini-transcribe"
3. 主要ファイル構成
rt-transcribe/
  app/
    api/
      transcribe/route.ts       # 音声セグメント→文字起こし
      summarize/route.ts        # 全テキストまとめ（要約/論点/Next Action）
    page.tsx                    # UI（録音・区切り・送信・表示）
  lib/
    openai.ts                   # OpenAI クライアント
  prisma/                       # （任意）DB
    schema.prisma
  .env.local
4. サーバ: OpenAIクライアント

/lib/openai.ts

import OpenAI from "openai";


export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});


export function chooseSttModel() {
  // gpt-4o-mini-transcribe を優先、無ければ whisper-1
  const envModel = process.env.OPENAI_STT_MODEL?.trim();
  if (envModel) return envModel;
  return "gpt-4o-mini-transcribe"; // フォールバックは route で実施
}


export function chooseTextModel() {
  return process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-4o-mini";
}
5. API: 文字起こし

/app/api/transcribe/route.ts

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
6. API: 要約/論点/アクション抽出

/app/api/summarize/route.ts

import { NextRequest, NextResponse } from "next/server";
import { openai, chooseTextModel } from "@/lib/openai";


export const runtime = "nodejs";


export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    const model = chooseTextModel();


    const prompt = `あなたは有能な秘書です。以下は会議の議事録の断片を時系列に結合した全文です。\n\n---\n${transcript}\n---\n\n出力フォーマット: \n- サマリー（5行以内）\n- 決定事項\n- 未決事項\n- 次のアクション（担当/期限つき）\n- キー引用（3件）`;


    const resp = await openai.responses.create({
      model,
      input: prompt,
    });


    const text = resp.output_text?.trim() || "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
7. フロント: 録音・区切り・送信 UI（App Router）

/app/page.tsx

"use client";
    mediaRecorderRef.current = null;
    setRecording(false);
    setLog((x) => ["録音ストップ", ...x]);
  };


  const sendChunk = async (blob: Blob) => {
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "content-type": blob.type || "audio/webm" },
        body: blob,
      });
      const json = await res.json();
      if (json.text) setSegments((s) => [...s, json.text]);
    } catch (e) {
      console.error(e);
      setLog((x) => ["送信失敗", ...x]);
    }
  };


  const summarize = async () => {
    const transcript = segments.join("\n");
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    const json = await res.json();
    if (json.text) setSegments((s) => [...s, "--- 要約 ---\n" + json.text]);
  };


  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">リアルタイム文字起こし（Zenn再現ミニ）</h1>
      <div className="flex gap-3">
        {!recording ? (
          <button onClick={startRecording} className="px-4 py-2 rounded-xl bg-black text-white">録音開始</button>
        ) : (
          <button onClick={stopRecording} className="px-4 py-2 rounded-xl bg-gray-200">停止</button>
        )}
        <button onClick={summarize} className="px-4 py-2 rounded-xl border">まとめ生成</button>
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold">セグメント</h2>
        <div className="rounded-xl border p-3 min-h-[180px] whitespace-pre-wrap">
          {segments.length === 0 ? "（まだありません）" : segments.map((t, i) => (
            <div key={i} className="mb-2">{t}</div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-semibold">ログ</h2>
        <ul className="text-sm text-gray-500 list-disc pl-5">
          {log.map((l, i) => (<li key={i}>{l}</li>))}
        </ul>
      </section>
      <p className="text-xs text-gray-500">※ 初回に「タブの音声を含める」ための共有ダイアログが表示されます。Chrome系推奨。</p>
    </main>
  );
}
8. （任意）DB保存: Prisma

/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}


datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}


model RealtimeTranscription {
  id        Int       @id @default(autoincrement())
  createdAt DateTime  @default(now())
  segments  Segment[]
}


model Segment {
  id         Int      @id @default(autoincrement())
  createdAt  DateTime @default(now())
  startMs    Int
  text       String
  blobType   String
  blobSize   Int
  durationMs Int
  contentB64 String
  parentId   Int
  parent     RealtimeTranscription @relation(fields: [parentId], references: [id])
}

実運用は S3/GCS などオブジェクトストレージ保存を推奨。ここでは Zenn 記事のテーブル例に合わせた最小モデルを提示。

9. 注意点・ブラウザ要件

Chrome系での動作を想定（getDisplayMedia の音声共有、MediaRecorder の MIME サポート差に注意）

権限プロンプト: マイク + タブ音声それぞれで許可が必要

短すぎる断片は誤認識しやすい → しきい値 thresholdMs を調整（会議なら 5–15 秒目安）

言語: 主に日本語/英語を想定。多言語はモデル側で自動判定

10. 動作確認
pnpm dev
# http://localhost:3000 を開いて、録音開始→ブラウザの「タブを選択」ダイアログで対象タブを指定
# 説明用の音声を入れて話す→一定長ごとに区切られテキスト化→「まとめ生成」
11. よくあるエラー

NotAllowedError: マイク/画面共有の許可が拒否されている

NotReadableError: 他アプリがマイクを専有

文字起こしが空: 極短断片や無音が多い → しきい値を上げる

TypeError: Failed to construct 'File': runtime が Edge だと失敗しやすい → route を Node で

12. 追加アイデア

Web Worker で VAD 前処理（無音検出）

波形/レベルメータ UI 追加

WebRTC で複数参加者のミックスを個別に処理

要約に役割/タイムスタンプ付与、Jira/Trello 自動登録

13. ライセンス

この再現テンプレは自由に改変OK（MIT相当）。商用で使うときは各APIのレート/費用を確認してください。

① 了解〜そのZenn記事の機能、まるっと再現したミニアプリをキャンバスに置いたよ。Next.js（App Router）+ Web Audio API + Harkで発話区切り、OpenAI Transcribe（gpt-4o-mini-transcribe→フォールバックwhisper-1）でリアルタイム文字起こし、要約APIもセット。記事の構成と同じノリで、マイク＋タブ音声をミックス→区切り→即文字起こし→画面表示。
Zenn
GitHub
MDNウェブドキュメント
DEV Community
OpenAI Platform

② 使い方（超シンプル）

リポジトリ作って、キャンバスの手順どおりに pnpm add openai hark → .env.local に OPENAI_API_KEY 入力 → pnpm dev。

「録音開始」→ Chromeの共有ダイアログで音声付きタブ選択 → しゃべる → 10秒超ごとに自動区切り＆即テキスト化。

「まとめ生成」でサマリ/決定/未決/Next Actionをワンパン生成。¡listo!

③ 実装の肝（ガチで大事だから押さえとこ）

タブ音＋マイク音の合流: createMediaStreamSource×2 → createMediaStreamDestination で1本化→MediaRecorderへ。これが一番ハマりやすいtrick。
DEV Community
addpipe.com

発話検知: Harkで speaking / stopped_speaking、さらに最小継続時間しきい値（10s初期値）でノイズ断片を弾く。
Zenn

API: audio.transcriptions.create() にBlob直投げ。まず gpt-4o-mini-transcribe、ダメなら whisper-1にフォールバック。
OpenAI Platform

ブラウザ要件: getDisplayMediaの音声共有はChrome系が堅い。権限プロンプト2種（マイク/タブ）に注意ね。
MDNウェブドキュメント

④ ここから伸ばす案（pro total）

波形/レベルメータ、会議タイムライン、Jira/Trello自動登録

Prisma＋S3保存（スキーマ雛形はキャンバスに書いた）

⑤ つまづき対処（rapid-fire）

文字起こしがスカる→断片が短い/無音。**しきい値↑**で回避。

TypeError: File系→APIをNodeランタイムに。

権限系→ブラウザ右上のマイク/画面共有チェック。

—
あたし的結論：即戦力。そのまま社内議事録の自動化にブチ込めるレベル。やるしか〜！ ánimo, vamos 💪🔥

コード＆手順は右のキャンバス「Zenn再現：リアルタイム文字起こしアプリ（Next.js/Whisper版）」に全部置いてあるから、そのままコピって走らせて。