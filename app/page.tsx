"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
const MagicCircle = dynamic(() => import("../components/MagicCircle"), { ssr: false });
import { getRandomChant, Chant, Difficulty } from "../data/chants";
import { calcScore, ScoreResult } from "../lib/scoring";
import { gtagEvent } from "../lib/gtag";

type Screen = "top" | "permission" | "countdown" | "recording" | "analyzing" | "result" | "error";

const RECORD_BUFFER_MS = 3000; // 想定秒数 + 3秒のバッファ（全難易度共通）
const SILENCE_THRESHOLD = 0.005;

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "EASY", normal: "NORMAL", hard: "HARD", expert: "EXPERT",
};
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "#4ade80", normal: "#6b21a8", hard: "#cc1a1a", expert: "#d4a017",
};

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
      style={{ border: `1px solid ${DIFFICULTY_COLOR[difficulty]}88`, color: DIFFICULTY_COLOR[difficulty] }}
    >
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("top");
  const [chant, setChant] = useState<Chant | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [recordMs, setRecordMs] = useState(0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioCtxRef       = useRef<AudioContext | null>(null);
  const recordTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef      = useRef<number>(0);
  const volumeSamplesRef  = useRef<number[]>([]);
  const pitchSamplesRef   = useRef<number[]>([]);
  const lastChantIdRef    = useRef<string | undefined>(undefined);
  const userCompletedRef  = useRef<boolean>(false);

  const stopRecording = (userCompleted = false) => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    const duration = (Date.now() - startTimeRef.current) / 1000;
    mr.stop();
    audioCtxRef.current?.close();
    setScreen("analyzing");

    setTimeout(() => {
      const vols    = volumeSamplesRef.current;
      const pitches = pitchSamplesRef.current;

      const avgVolume  = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0;
      const maxVolume  = vols.length ? Math.max(...vols) : 0;
      const silenceRatio = vols.length
        ? vols.filter((v) => v < SILENCE_THRESHOLD).length / vols.length
        : 1;

      // 無音区間を長さで分類（サンプリング間隔 100ms）
      // 2.0s未満は演技的な間として無視、2.0s以上(>=20frames)はveryLongSilence
      let longSilenceCount = 0;
      let veryLongSilenceCount = 0;
      let silenceRun = 0;

      const classifySilenceRun = (frames: number) => {
        if (frames >= 20) veryLongSilenceCount++;
        // 0.25〜2.0s は詠唱の演技的な間として無視
      };

      for (const v of vols) {
        if (v < SILENCE_THRESHOLD) {
          silenceRun++;
        } else {
          if (silenceRun > 0) { classifySilenceRun(silenceRun); silenceRun = 0; }
        }
      }
      if (silenceRun > 0) classifySilenceRun(silenceRun); // 末尾の無音

      const volumeVariance = vols.length > 1
        ? Math.sqrt(vols.reduce((s, v) => s + (v - avgVolume) ** 2, 0) / vols.length)
        : 0;

      void pitches; // pitchSamples は将来の拡張用

      const expectedSeconds = chant?.expectedSeconds ?? 8;
      const difficulty = chant?.difficulty ?? "normal";
      const score = calcScore({
        duration, expectedSeconds,
        avgVolume, maxVolume,
        volumeVariance, silenceRatio,
        longSilenceCount, veryLongSilenceCount,
        difficulty, userCompleted: userCompletedRef.current,
      });
      setResult(score);
      setScreen("result");
      gtagEvent("chant_result");
    }, 2200);
  };

  const startRecording = async (c: Chant, recordMax = c.expectedSeconds * 1000 + RECORD_BUFFER_MS) => {
    volumeSamplesRef.current  = [];
    pitchSamplesRef.current   = [];
    userCompletedRef.current  = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg("マイクへのアクセスが許可されていません。\nブラウザの設定を確認してください。");
      setScreen("error");
      return;
    }

    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source  = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start();

      startTimeRef.current = Date.now();
      setChant(c);
      setRecordMs(0);
      setScreen("recording");

      const buf     = new Float32Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);

      recordTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setRecordMs(elapsed);

        analyser.getFloatTimeDomainData(buf);
        let rms = 0;
        for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
        volumeSamplesRef.current.push(Math.sqrt(rms / buf.length));

        analyser.getByteFrequencyData(freqBuf);
        let sum = 0, count = 0;
        for (let i = 1; i < freqBuf.length; i++) {
          if (freqBuf[i] > 10) { sum += freqBuf[i]; count++; }
        }
        pitchSamplesRef.current.push(count > 0 ? sum / count : 0);

        if (elapsed >= recordMax) stopRecording(userCompletedRef.current);
      }, 100);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setErrorMsg("録音の開始に失敗しました。再度お試しください。");
      setScreen("error");
    }
  };

  const handleStart = () => setScreen("permission");

  const handlePermissionGranted = () => {
    const c = getRandomChant(lastChantIdRef.current);
    lastChantIdRef.current = c.id;
    setChant(c);
    setCountdown(3);
    setScreen("countdown");
    gtagEvent("chant_start");

    let count = 3;
    const iv = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(iv);
        startRecording(c);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const handleRetry = () => {
    setResult(null);
    setErrorMsg("");
    setScreen("top");
  };

  const [isXInAppBrowser, setIsXInAppBrowser] = useState(false);
  useEffect(() => {
    setIsXInAppBrowser(/Twitter/i.test(navigator.userAgent));
  }, []);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 60% at 50% 50%, #1a003388 0%, transparent 70%)",
      }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none magic-circle-bg">
        <MagicCircle size={700} />
      </div>

      {isXInAppBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "#0a000899", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 text-center" style={{ background: "#1a0028", border: "1px solid #6b21a8" }}>
            <p className="text-2xl">⚠️</p>
            <p className="font-bold text-base" style={{ color: "#d4a017" }}>ブラウザで開いてください</p>
            <p className="text-sm opacity-70 leading-relaxed">
              このままでは診断後に結果をXへシェアしたり、画像を保存することができません。
            </p>
            <div className="rounded-xl p-4 text-sm leading-relaxed space-y-1" style={{ background: "#0a0008", border: "1px solid #6b21a833" }}>
              <p className="font-bold mb-2" style={{ color: "#9333ea" }}>自動で開かない場合</p>
              <p>画面下部の <span className="font-bold text-white">「vercel.app」</span> をタップ</p>
              <p style={{ color: "#9333ea" }}>↓</p>
              <p><span className="font-bold text-white">「ブラウザで開く」</span> を選択</p>
            </div>
            <button
              onClick={() => setIsXInAppBrowser(false)}
              className="w-full py-2 rounded-full text-xs cursor-pointer"
              style={{ border: "1px solid #ffffff22", color: "#ffffff44" }}
            >
              このまま使う
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full">
        {screen === "top" && <TopScreen onStart={handleStart} />}
        {screen === "permission" && (
          <PermissionScreen
            onGranted={handlePermissionGranted}
            onDenied={(msg) => { setErrorMsg(msg); setScreen("error"); }}
          />
        )}
        {screen === "countdown" && chant && <CountdownScreen chant={chant} count={countdown} />}
        {screen === "recording" && chant && (
          <RecordingScreen chant={chant} elapsed={recordMs} recordMax={chant.expectedSeconds * 1000 + RECORD_BUFFER_MS} onStop={() => { userCompletedRef.current = true; stopRecording(true); }} />
        )}
        {screen === "analyzing" && <AnalyzingScreen />}
        {screen === "result" && result && chant && (
          <ResultScreen result={result} chant={chant} onRetry={handleRetry} />
        )}
        {screen === "error" && <ErrorScreen message={errorMsg} onRetry={handleRetry} />}
      </div>
    </main>
  );
}

// ─── TopScreen ───────────────────────────────────────────────────────────────

function TopScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center z-10">
      <div style={{ filter: "drop-shadow(0 0 18px #6b21a8aa) drop-shadow(0 0 40px #cc1a1a44)" }}>
        <MagicCircle size={240} />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-widest flicker" style={{ color: "#cc1a1a", textShadow: "0 0 30px #cc1a1acc, 0 0 60px #cc1a1a55" }}>
          詠唱力診断
        </h1>
        <p className="text-sm tracking-widest opacity-60">— 汝の魂の覚醒度を今こそ証明せよ —</p>
      </div>
      <div className="space-y-3 text-sm opacity-70 max-w-xs leading-relaxed">
        <p>画面に表示された呪文を、<br />声に出して詠唱せよ。</p>
        <p>魂の奥底から絞り出す声で<br />世界に刻め。</p>
      </div>
      <button
        onClick={onStart}
        className="mt-4 px-10 py-4 rounded-full text-lg font-bold tracking-widest cursor-pointer pulse-glow transition-all"
        style={{
          background: "linear-gradient(135deg, #6b21a8, #cc1a1a)",
          color: "#e8e0f0",
          border: "1px solid #6b21a888",
        }}
      >
        診断開始
      </button>
      <p className="text-xs opacity-40">マイクへのアクセス許可が必要です</p>

    </div>
  );
}

// ─── PermissionScreen ─────────────────────────────────────────────────────────

function PermissionScreen({
  onGranted,
  onDenied,
}: {
  onGranted: () => void;
  onDenied: (msg: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "waiting" | "denied">("idle");

  const requestMic = async () => {
    setStatus("waiting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      onGranted();
    } catch {
      setStatus("denied");
    }
  };

  const isIOS = typeof navigator !== "undefined" &&
    /iP(hone|ad|od)/.test(navigator.userAgent);
  const isSafari = typeof navigator !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="flex flex-col items-center gap-6 text-center z-10 max-w-xs w-full">
      {status !== "denied" ? (
        <>
          <div className="text-6xl" style={{ filter: "drop-shadow(0 0 16px #cc1a1a88)" }}>🎙️</div>
          <div className="space-y-2">
            <p className="text-base font-bold tracking-wide" style={{ color: "#d4a017" }}>
              マイクの使用を許可してください
            </p>
            <p className="text-xs opacity-60 leading-relaxed">
              詠唱を録音するためにマイクへの<br />アクセスが必要です。
            </p>
          </div>
          <div className="w-full rounded-xl p-4 space-y-2 text-left text-xs opacity-60 leading-relaxed"
            style={{ background: "#1a0028", border: "1px solid #6b21a833" }}>
            <p className="font-bold opacity-80">📋 許可の手順</p>
            {isIOS || isSafari ? (
              <>
                <p>① 下のボタンを押す</p>
                <p>② ブラウザが「マイクを使用しますか？」と聞いてきたら<span className="text-purple-300">「許可」</span>をタップ</p>
                <p className="opacity-40 text-xs pt-1">※ 一度「拒否」した場合は設定アプリ → Safari → マイクをオンにしてください</p>
              </>
            ) : (
              <>
                <p>① 下のボタンを押す</p>
                <p>② ブラウザ上部に「マイクを許可しますか？」が表示されたら<span className="text-purple-300">「許可」</span>をタップ</p>
                <p className="opacity-40 text-xs pt-1">※ 一度「拒否」した場合はアドレスバーの🔒アイコンからマイクをオンにしてください</p>
              </>
            )}
          </div>
          <button
            onClick={requestMic}
            disabled={status === "waiting"}
            className="w-full py-4 rounded-full font-bold tracking-widest cursor-pointer pulse-glow transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #6b21a8, #cc1a1a)",
              color: "#e8e0f0",
              border: "1px solid #6b21a888",
            }}
          >
            {status === "waiting" ? "確認中…" : "マイクを有効にして診断開始"}
          </button>
        </>
      ) : (
        <>
          <div className="text-5xl">🚫</div>
          <p className="text-base font-bold" style={{ color: "#cc1a1a" }}>マイクが許可されていません</p>
          <div className="w-full rounded-xl p-4 space-y-2 text-left text-xs leading-relaxed"
            style={{ background: "#1a0028", border: "1px solid #cc1a1a44" }}>
            <p className="font-bold opacity-80">🔧 再度許可する方法</p>
            {isIOS ? (
              <>
                <p>設定アプリ → <span className="text-purple-300">Safari</span> → マイク → オン</p>
                <p className="opacity-50">または: 設定 → プライバシーとセキュリティ → マイク → ブラウザをオン</p>
              </>
            ) : (
              <>
                <p>アドレスバー左の <span className="text-purple-300">🔒 または ⓘ</span> をタップ</p>
                <p>→「マイク」を「許可」に変更</p>
                <p>→ ページをリロード</p>
              </>
            )}
          </div>
          <button
            onClick={() => setStatus("idle")}
            className="w-full py-3 rounded-full text-sm font-bold tracking-widest cursor-pointer"
            style={{ border: "1px solid #6b21a888", color: "#9333ea" }}
          >
            もう一度試す
          </button>
        </>
      )}
    </div>
  );
}

// ─── CountdownScreen ──────────────────────────────────────────────────────────

function CountdownScreen({ chant, count }: { chant: Chant; count: number }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center z-10 max-w-sm">
      <p className="text-xs tracking-widest opacity-50">詠唱文を読み上げよ</p>
      <div className="flex flex-col items-center gap-2">
        <DifficultyBadge difficulty={chant.difficulty} />
        <h2 className="text-xl font-bold" style={{ color: "#d4a017" }}>{chant.title}</h2>
      </div>
      <p className="text-sm leading-loose opacity-70 px-4">{chant.text}</p>
      <div
        key={count}
        className="text-8xl font-bold count-pop"
        style={{ color: "#cc1a1a", textShadow: "0 0 40px #cc1a1a" }}
      >
        {count}
      </div>
      <p className="text-sm opacity-50 tracking-widest">準備せよ……</p>
    </div>
  );
}

// ─── RecordingScreen ──────────────────────────────────────────────────────────

function RecordingScreen({ chant, elapsed, recordMax, onStop }: { chant: Chant; elapsed: number; recordMax: number; onStop: () => void }) {
  const pct       = Math.min(100, (elapsed / recordMax) * 100);
  const remaining = Math.max(0, Math.ceil((recordMax - elapsed) / 1000));

  return (
    <div className="flex flex-col items-center gap-6 text-center z-10 max-w-sm w-full">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse inline-block" />
        <span className="text-xs tracking-widest opacity-70">REC</span>
        <span className="text-xs opacity-50 ml-2">{remaining}秒</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <DifficultyBadge difficulty={chant.difficulty} />
        <h2 className="text-lg font-bold" style={{ color: "#d4a017" }}>{chant.title}</h2>
      </div>
      <p className="text-base leading-loose opacity-90 px-2">{chant.text}</p>
      <div className="w-full h-2 rounded-full overflow-hidden mt-2" style={{ background: "#2a0020" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #6b21a8, #cc1a1a)" }}
        />
      </div>
      <button
        onClick={onStop}
        className="px-8 py-3 rounded-full text-sm font-bold tracking-widest cursor-pointer transition-all mt-2"
        style={{ border: "1px solid #cc1a1a88", color: "#cc1a1a" }}
      >
        詠唱完了
      </button>
    </div>
  );
}

// ─── AnalyzingScreen ──────────────────────────────────────────────────────────

function AnalyzingScreen() {
  return (
    <div className="flex flex-col items-center gap-6 text-center z-10">
      <div style={{ filter: "drop-shadow(0 0 20px #cc1a1acc) drop-shadow(0 0 50px #cc1a1a66)" }}>
        <MagicCircle size={200} color="#cc1a1a" />
      </div>
      <p className="text-sm tracking-widest flicker opacity-80">魂を解析中……</p>
      <p className="text-xs opacity-40">汝の詠唱力を計測しております</p>
    </div>
  );
}

// ─── ErrorScreen ──────────────────────────────────────────────────────────────

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center z-10 max-w-sm">
      <p className="text-3xl">⚠</p>
      <p className="text-sm opacity-80 leading-relaxed whitespace-pre-line">{message}</p>
      <button
        onClick={onRetry}
        className="px-8 py-3 rounded-full text-sm font-bold tracking-widest cursor-pointer"
        style={{ border: "1px solid #6b21a888", color: "#9333ea" }}
      >
        戻る
      </button>
    </div>
  );
}


// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({
  label, value, color, comment,
}: {
  label: string; value: number; color: string; comment?: string | null;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <span className="text-xs w-14 text-right opacity-70 shrink-0">{label}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#2a0020" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${width}%`, background: color, transition: "width 0.8s ease-out" }}
          />
        </div>
        <span className="text-xs w-8 opacity-70 shrink-0 text-left">{value}</span>
      </div>
      {comment && (
        <p className="text-xs opacity-40 mt-0.5 leading-tight text-right pr-10">{comment}</p>
      )}
    </div>
  );
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

const TAUNT_MESSAGES = [
  "次の詠唱者、出でよ",
  "貴様もこの禁術を扱えるか",
  "我が詠唱を超えてみせよ",
  "この契約に応えられる者はいるか",
  "次なる契約者を待つ",
  "この魔導に耐えられるか",
  "我に続く者、現れよ",
  "真の詠唱者を見せてもらおう",
  "この程度で震えてはいまいな",
  "まだ口が回るなら挑んでみよ",
  "魔力なき者は立ち去るがいい",
  "噛まずに唱えられる者だけ来い",
  "この詠唱、最後まで耐えられるか",
  "我が禁術の前で膝をつくか",
  "舌を噛んでも責任は負わぬ",
  "途中で息切れしても泣くな",
  "詠唱事故報告、待っている",
  "魔導士の実力を見せつけよ",
  "封印解除には肺活量が必要だ",
  "近隣への配慮は各自で頼む",
];

function pickTaunt(exclude: string): string {
  const pool = TAUNT_MESSAGES.filter((m) => m !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

function ResultScreen({
  result, chant, onRetry,
}: {
  result: ScoreResult; chant: Chant; onRetry: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTauntRef = useRef<string>("");

  const rankColor =
    result.rank === "EX" ? "#d4a017" :
    result.rank === "SS" ? "#ffcc00" :
    result.rank === "S"  ? "#ff6a00" :
    result.rank === "A"  ? "#cc1a1a" :
    result.rank === "B"  ? "#9333ea" :
    result.rank === "C"  ? "#6b21a8" :
    result.rank === "D"  ? "#66ccaa" : "#aaaaaa";

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://webapp-6bdo.vercel.app";
  const buildResultUrl = () =>
    `${siteUrl}/result?r=${result.rank}&s=${result.score}&cn=${chant.id}&v=${result.volume}&i=${result.intonation}&c=${result.clarity}&so=${result.soul}&ch=${result.chuni}`;
  const buildShareText = () => {
    const taunt = pickTaunt(lastTauntRef.current);
    lastTauntRef.current = taunt;
    return `【詠唱力診断】\n\n詠唱：${chant.title}\n我が称号は『${result.title}』\n魔導ランク：${result.rank}\n総合詠唱力：${result.score}点\n\n声量 ${result.volume} / 抑揚 ${result.intonation} / 詠唱安定度 ${result.clarity} / 魂 ${result.soul} / 厨二力 ${result.chuni}\n\n${taunt}\n\n${buildResultUrl()}\n#詠唱力診断`;
  };

  // 結果表示と同時にキャンバスを事前描画（ボタン押下時に非同期処理が不要になりポップアップブロックを回避）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawResultCanvas(canvas, result, chant.title);
  }, []);

  const handleShare = () => {
    gtagEvent("share_click");
    const shareText = buildShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, "_blank", "noreferrer");
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // キャンバスは事前描画済みなので同期的に保存できる
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "詠唱力診断結果.png";
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center z-10 w-full max-w-sm pb-4">
      <canvas ref={canvasRef} width={600} height={560} className="hidden" />

      {/* 使用した詠唱名 */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs opacity-40 tracking-widest">使用した詠唱</p>
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={chant.difficulty} />
          <p className="text-sm font-bold" style={{ color: "#d4a017" }}>{chant.title}</p>
        </div>
      </div>

      {/* 魔法陣 */}
      <div style={{ filter: `drop-shadow(0 0 24px ${rankColor}cc)` }}>
        <MagicCircle size={160} color={rankColor} />
      </div>

      {/* ランク + スコア */}
      <div className="space-y-1">
        <div
          className="text-5xl font-bold count-pop"
          style={{ color: rankColor, textShadow: `0 0 30px ${rankColor}` }}
        >
          {result.rank}
        </div>
        <p className="text-2xl font-bold" style={{ color: rankColor }}>
          {result.score} <span className="text-sm opacity-60">/ 100</span>
        </p>
      </div>

      {/* 称号 */}
      <div>
        <p className="text-xs opacity-40 tracking-widest mb-1">称号</p>
        <p className="text-base font-bold tracking-widest" style={{ color: "#d4a017" }}>
          {result.title}
        </p>
      </div>

      {/* 結果コメント */}
      <p className="text-sm opacity-75 leading-relaxed italic px-2">
        「{result.comment}」
      </p>

      {/* タイムアウト警告 */}
      {result.timeoutWarning && (
        <div className="w-full text-center text-sm text-yellow-400 opacity-80 py-1">
          ⚠ 完了ボタンを押下してください。
        </div>
      )}

      {/* スコアバー */}
      <div className="w-full space-y-3 py-1">
        <ScoreBar label="声量"   value={result.volume}     color="#6b21a8" comment={result.volumeComment} />
        <ScoreBar label="抑揚"   value={result.intonation} color="#9333ea" comment={result.intonationComment} />
        <ScoreBar label="詠唱安定度" value={result.clarity}    color="#7c3aed" comment={result.clarityComment} />
        <ScoreBar label="魂"     value={result.soul}       color="#cc1a1a" comment={result.soulComment} />
        <ScoreBar label="厨二力" value={result.chuni}      color="#d4a017" comment={result.chuniComment} />
      </div>

      {/* 次のランクへの昇格条件チェックリスト（EX以外） */}
      {result.rank !== "EX" && (() => {
        const nextRankConfig: Record<string, { label: string; color: string; items: { label: string; met: boolean }[] }> = {
          E: {
            label: "D昇格条件", color: "#66ccaa",
            items: [
              { label: `総合スコア 22以上（現在 ${result.score}）`, met: result.score >= 22 },
              { label: `声量 40以上（現在 ${result.volume}）`, met: result.volume >= 40 },
            ],
          },
          D: {
            label: "C昇格条件", color: "#6b21a8",
            items: [
              { label: `総合スコア 35以上（現在 ${result.score}）`, met: result.score >= 35 },
              { label: `声量 50以上（現在 ${result.volume}）`, met: result.volume >= 50 },
            ],
          },
          C: {
            label: "B昇格条件", color: "#9333ea",
            items: [
              { label: `総合スコア 50以上（現在 ${result.score}）`, met: result.score >= 50 },
              { label: `声量 60以上（現在 ${result.volume}）`, met: result.volume >= 60 },
            ],
          },
          B: {
            label: "A昇格条件", color: "#cc1a1a",
            items: [
              { label: `総合スコア 68以上（現在 ${result.score}）`, met: result.score >= 68 },
              { label: `抑揚 55以上（現在 ${result.intonation}）`, met: result.intonation >= 55 },
              { label: `尺 70以上（現在 ${result.duration}）`, met: result.duration >= 70 },
              { label: `詠唱安定度 70以上（現在 ${result.clarity}）`, met: result.clarity >= 70 },
              { label: `声量 70以上（現在 ${result.volume}）`, met: result.volume >= 70 },
            ],
          },
          A: {
            label: "S昇格条件", color: "#ff6a00",
            items: [
              { label: `総合スコア 78以上（現在 ${result.score}）`, met: result.score >= 78 },
              { label: `抑揚 65以上（現在 ${result.intonation}）`, met: result.intonation >= 65 },
              { label: `尺 80以上（現在 ${result.duration}）`, met: result.duration >= 80 },
              { label: `詠唱安定度 80以上（現在 ${result.clarity}）`, met: result.clarity >= 80 },
              { label: `声量 80以上（現在 ${result.volume}）`, met: result.volume >= 80 },
              { label: "詠唱完了ボタンで終了", met: result.userCompleted },
            ],
          },
          S: {
            label: "SS昇格条件", color: "#ffcc00",
            items: [
              { label: `総合スコア 86以上（現在 ${result.score}）`, met: result.score >= 86 },
              { label: `抑揚 80以上（現在 ${result.intonation}）`, met: result.intonation >= 80 },
              { label: `尺 85以上（現在 ${result.duration}）`, met: result.duration >= 85 },
              { label: `詠唱安定度 85以上（現在 ${result.clarity}）`, met: result.clarity >= 85 },
              { label: `声量 90以上（現在 ${result.volume}）`, met: result.volume >= 90 },
              { label: "詠唱完了ボタンで終了", met: result.userCompleted },
            ],
          },
          SS: {
            label: "EX昇格条件", color: "#d4a017",
            items: [
              { label: `総合スコア 93以上（現在 ${result.score}）`, met: result.score >= 93 },
              { label: `抑揚 88以上（現在 ${result.intonation}）`, met: result.intonation >= 88 },
              { label: `尺 90以上（現在 ${result.duration}）`, met: result.duration >= 90 },
              { label: `詠唱安定度 88以上（現在 ${result.clarity}）`, met: result.clarity >= 88 },
              { label: `声量 100（現在 ${result.volume}）`, met: result.volume >= 100 },
              { label: "詠唱完了ボタンで終了", met: result.userCompleted },
            ],
          },
        };
        const cfg = nextRankConfig[result.rank];
        if (!cfg) return null;
        return (
          <div className="w-full rounded-xl p-4 space-y-2" style={{ border: `1px solid ${cfg.color}44`, background: "#1a002266" }}>
            <p className="text-xs font-bold tracking-widest text-center mb-3" style={{ color: cfg.color }}>
              ── {cfg.label} ──
            </p>
            {cfg.items.map(({ label, met }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span style={{ color: met ? "#22c55e" : "#ef4444", fontSize: "1rem" }}>{met ? "✓" : "✗"}</span>
                <span style={{ color: met ? "#86efac" : "#fca5a5" }}>{label}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ボタン */}
      <div className="flex flex-col gap-3 w-full mt-2">
        <button
          onClick={handleShare}
          className="w-full py-3 rounded-full font-bold tracking-widest cursor-pointer text-sm"
          style={{ background: "#000", color: "#fff", border: "1px solid #333" }}
        >
          𝕏 で結果をシェア
        </button>
        <button
          onClick={handleSaveImage}
          className="w-full py-3 rounded-full font-bold tracking-widest cursor-pointer text-sm"
          style={{ border: "1px solid #6b21a888", color: "#9333ea" }}
        >
          画像を保存
        </button>
        <button
          onClick={onRetry}
          className="w-full py-3 rounded-full font-bold tracking-widest cursor-pointer text-sm"
          style={{ border: "1px solid #ffffff22", color: "#e8e0f0" }}
        >
          もう一度詠唱する
        </button>
      </div>

    </div>
  );
}

// ─── Canvas 結果画像生成 ───────────────────────────────────────────────────────

async function drawResultCanvas(
  canvas: HTMLCanvasElement,
  result: ScoreResult,
  chantTitle: string,
) {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#0a0008";
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 280);
  grad.addColorStop(0, "#1a001888");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 魔法陣背景（ランダムで紫・赤）
  await new Promise<void>((resolve) => {
    const circleImg = new Image();
    const timeout = setTimeout(resolve, 3000); // タイムアウト保険
    circleImg.onload = () => {
      clearTimeout(timeout);
      ctx.save();
      ctx.globalAlpha = 0.22;
      const size = 460;
      ctx.drawImage(circleImg, (w - size) / 2, (h - size) / 2, size, size);
      ctx.restore();
      resolve();
    };
    circleImg.onerror = () => { clearTimeout(timeout); resolve(); };
    circleImg.src = Math.random() > 0.5 ? "/circle-purple.png" : "/circle-red.png"; // ハンドラ設定後にsrcをセット
  });

  ctx.strokeStyle = "#6b21a844";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 185, 0, Math.PI * 2);
  ctx.stroke();

  const rankColor =
    result.rank === "EX" ? "#d4a017" :
    result.rank === "SS" ? "#ffcc00" :
    result.rank === "S"  ? "#ff6a00" :
    result.rank === "A"  ? "#cc1a1a" :
    result.rank === "B"  ? "#9333ea" :
    result.rank === "C"  ? "#6b21a8" :
    result.rank === "D"  ? "#66ccaa" : "#aaaaaa";

  // 詠唱名
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`詠唱：${chantTitle}`, w / 2, 34);

  // ランク
  ctx.save();
  ctx.shadowColor = rankColor;
  ctx.shadowBlur = 40;
  ctx.fillStyle = rankColor;
  ctx.font = "bold 96px serif";
  ctx.textAlign = "center";
  ctx.fillText(result.rank, w / 2, 122);
  ctx.restore();

  // 称号
  ctx.fillStyle = "#d4a017";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(result.title, w / 2, 162);

  // スコア
  ctx.fillStyle = "#e8e0f0";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(`${result.score} / 100`, w / 2, 210);

  // コメント（長い場合は折り返し）
  ctx.fillStyle = "#e8e0f099";
  ctx.font = "15px sans-serif";
  ctx.textAlign = "center";
  const commentText = `「${result.comment}」`;
  const maxW = w - 80;
  let line = "";
  let commentY = 246;
  for (const char of commentText) {
    const test = line + char;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, w / 2, commentY);
      commentY += 20;
      line = char;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, w / 2, commentY);

  // スコアバー
  const bars = [
    { label: "声量",   value: result.volume,     color: "#6b21a8" },
    { label: "抑揚",   value: result.intonation, color: "#9333ea" },
    { label: "詠唱安定度", value: result.clarity,    color: "#7c3aed" },
    { label: "魂",     value: result.soul,        color: "#cc1a1a" },
    { label: "厨二力", value: result.chuni,       color: "#d4a017" },
  ];

  const barX = 130, barW = w - barX - 70, barH = 13;
  let y = commentY + 24;
  ctx.font = "bold 14px sans-serif";
  for (const bar of bars) {
    ctx.fillStyle = "#e8e0f022";
    ctx.fillRect(barX, y, barW, barH);
    ctx.fillStyle = bar.color;
    ctx.fillRect(barX, y, (barW * bar.value) / 100, barH);
    ctx.fillStyle = "#e8e0f0cc";
    ctx.textAlign = "right";
    ctx.fillText(bar.label, barX - 8, y + barH - 1);
    ctx.textAlign = "left";
    ctx.fillText(String(bar.value), barX + (barW * bar.value) / 100 + 6, y + barH - 1);
    y += 26;
  }

  // ハッシュタグ
  ctx.fillStyle = "#e8e0f044";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("#詠唱力診断", w / 2, h - 14);

  // ロゴ
  await new Promise<void>((resolve) => {
    const logo = new window.Image();
    logo.onload = () => {
      const logoSize = 110;
      ctx.globalAlpha = 0.88;
      ctx.drawImage(logo, w / 2 - logoSize / 2, y + 6, logoSize, logoSize);
      ctx.globalAlpha = 1;
      resolve();
    };
    logo.onerror = () => resolve();
    logo.src = "/icon.png";
  });
}
