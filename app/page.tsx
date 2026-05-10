"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
const MagicCircle = dynamic(() => import("../components/MagicCircle"), { ssr: false });
import { getRandomChant, Chant } from "../lib/chants";
import { calcScore, ScoreResult } from "../lib/scoring";

type Screen = "top" | "permission" | "countdown" | "recording" | "analyzing" | "result" | "error";

const RECORD_MAX = 10000;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("top");
  const [chant, setChant] = useState<Chant | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [recordMs, setRecordMs] = useState(0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const volumeSamplesRef = useRef<number[]>([]);
  const pitchSamplesRef = useRef<number[]>([]);

  const stopRecording = () => {
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
      const vols = volumeSamplesRef.current;
      const pitches = pitchSamplesRef.current;
      const avgVol = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0;
      const maxVol = vols.length ? Math.max(...vols) : 0;
      const avgPitch = pitches.length ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0;

      const volume = Math.min(100, Math.round(avgVol * 800 + maxVol * 200));
      const intonation = Math.min(100, Math.round(avgPitch * 0.8));
      const clarity = Math.min(100, Math.round((avgVol > 0.005 ? 70 : 30) + Math.random() * 30));

      const score = calcScore({ volume, intonation, clarity, duration });
      setResult(score);
      setScreen("result");
    }, 2200);
  };

  const startRecording = async (c: Chant) => {
    volumeSamplesRef.current = [];
    pitchSamplesRef.current = [];

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
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start();

      startTimeRef.current = Date.now();
      setChant(c);
      setRecordMs(0);
      setScreen("recording");

      const buf = new Float32Array(analyser.fftSize);
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

        if (elapsed >= RECORD_MAX) stopRecording();
      }, 100);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setErrorMsg("録音の開始に失敗しました。再度お試しください。");
      setScreen("error");
    }
  };

  const handleStart = () => {
    setScreen("permission");
  };

  const handlePermissionGranted = () => {
    const c = getRandomChant();
    setChant(c);
    setCountdown(3);
    setScreen("countdown");

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

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 60% at 50% 50%, #1a003388 0%, transparent 70%)",
      }} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none magic-circle-bg">
        <MagicCircle size={700} />
      </div>

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
          <RecordingScreen chant={chant} elapsed={recordMs} onStop={stopRecording} />
        )}
        {screen === "analyzing" && <AnalyzingScreen />}
        {screen === "result" && result && <ResultScreen result={result} onRetry={handleRetry} />}
        {screen === "error" && <ErrorScreen message={errorMsg} onRetry={handleRetry} />}
      </div>
    </main>
  );
}

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
          <p className="text-base font-bold" style={{ color: "#cc1a1a" }}>
            マイクが許可されていません
          </p>
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

function CountdownScreen({ chant, count }: { chant: Chant; count: number }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center z-10 max-w-sm">
      <p className="text-xs tracking-widest opacity-50">詠唱文を読み上げよ</p>
      <h2 className="text-xl font-bold" style={{ color: "#d4a017" }}>{chant.title}</h2>
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

function RecordingScreen({ chant, elapsed, onStop }: { chant: Chant; elapsed: number; onStop: () => void }) {
  const pct = Math.min(100, (elapsed / RECORD_MAX) * 100);
  const remaining = Math.max(0, Math.ceil((RECORD_MAX - elapsed) / 1000));

  return (
    <div className="flex flex-col items-center gap-6 text-center z-10 max-w-sm w-full">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse inline-block" />
        <span className="text-xs tracking-widest opacity-70">REC</span>
        <span className="text-xs opacity-50 ml-2">{remaining}秒</span>
      </div>
      <h2 className="text-lg font-bold" style={{ color: "#d4a017" }}>{chant.title}</h2>
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

const SCORE_LABELS: { key: keyof ScoreResult; label: string; color: string }[] = [
  { key: "volume",     label: "声量",    color: "#6b21a8" },
  { key: "intonation", label: "抑揚",    color: "#9333ea" },
  { key: "clarity",   label: "明瞭度",  color: "#7c3aed" },
  { key: "soul",      label: "魂の奔流", color: "#cc1a1a" },
  { key: "chuuni",    label: "厨二力",  color: "#d4a017" },
];

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs w-16 text-right opacity-70 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#2a0020" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: color, transition: "width 0.8s ease-out" }}
        />
      </div>
      <span className="text-xs w-8 opacity-70 shrink-0">{value}</span>
    </div>
  );
}

function ResultScreen({ result, onRetry }: { result: ScoreResult; onRetry: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rankColor =
    result.rank === "EX" || result.rank === "SS" ? "#d4a017" :
    result.rank === "S"  || result.rank === "A"  ? "#cc1a1a" : "#6b21a8";

  const shareText = `【詠唱力診断】\n称号：${result.title}\nランク：${result.rank}　総合：${result.total}点\n${result.comment}\n#詠唱力診断`;

  const handleShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawResultCanvas(canvas, result);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "詠唱力診断結果.png";
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center z-10 w-full max-w-sm">
      <canvas ref={canvasRef} width={600} height={400} className="hidden" />

      <div className="text-5xl font-bold count-pop" style={{ color: rankColor, textShadow: `0 0 30px ${rankColor}` }}>
        {result.rank}
      </div>
      <div className="space-y-1">
        <p className="text-base font-bold tracking-widest" style={{ color: "#d4a017" }}>{result.title}</p>
        <p className="text-2xl font-bold" style={{ color: rankColor }}>
          {result.total} <span className="text-sm opacity-60">/ 100</span>
        </p>
      </div>
      <p className="text-sm opacity-70 leading-relaxed italic">「{result.comment}」</p>

      <div className="w-full space-y-2 py-2">
        {SCORE_LABELS.map(({ key, label, color }) => (
          <ScoreBar key={key} label={label} value={result[key] as number} color={color} />
        ))}
      </div>

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
          className="w-full py-3 rounded-full font-bold tracking-widest cursor-pointer text-sm opacity-60"
          style={{ border: "1px solid #ffffff22", color: "#e8e0f0" }}
        >
          もう一度詠唱する
        </button>
      </div>
    </div>
  );
}

function drawResultCanvas(canvas: HTMLCanvasElement, result: ScoreResult) {
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

  ctx.strokeStyle = "#6b21a844";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 180, 0, Math.PI * 2);
  ctx.stroke();

  const rankColor =
    result.rank === "EX" || result.rank === "SS" ? "#d4a017" :
    result.rank === "S"  || result.rank === "A"  ? "#cc1a1a" : "#6b21a8";

  ctx.save();
  ctx.shadowColor = rankColor;
  ctx.shadowBlur = 30;
  ctx.fillStyle = rankColor;
  ctx.font = "bold 80px serif";
  ctx.textAlign = "center";
  ctx.fillText(result.rank, w / 2, 110);
  ctx.restore();

  ctx.fillStyle = "#d4a017";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(result.title, w / 2, 150);

  ctx.fillStyle = "#e8e0f0";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText(`${result.total} / 100`, w / 2, 200);

  ctx.fillStyle = "#e8e0f088";
  ctx.font = "14px sans-serif";
  ctx.fillText(`「${result.comment}」`, w / 2, 235);

  const bars = [
    { label: "声量",    value: result.volume,     color: "#6b21a8" },
    { label: "抑揚",    value: result.intonation,  color: "#9333ea" },
    { label: "明瞭度",  value: result.clarity,     color: "#7c3aed" },
    { label: "魂の奔流", value: result.soul,        color: "#cc1a1a" },
    { label: "厨二力",  value: result.chuuni,      color: "#d4a017" },
  ];

  const barX = 80, barW = w - 160, barH = 10;
  let y = 270;
  ctx.font = "12px sans-serif";
  for (const bar of bars) {
    ctx.fillStyle = "#e8e0f055";
    ctx.fillRect(barX, y, barW, barH);
    ctx.fillStyle = bar.color;
    ctx.fillRect(barX, y, (barW * bar.value) / 100, barH);
    ctx.fillStyle = "#e8e0f088";
    ctx.textAlign = "right";
    ctx.fillText(bar.label, barX - 8, y + 9);
    ctx.textAlign = "left";
    ctx.fillText(String(bar.value), barX + (barW * bar.value) / 100 + 4, y + 9);
    y += 22;
  }

  ctx.fillStyle = "#e8e0f033";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("#詠唱力診断", w / 2, h - 16);
}
