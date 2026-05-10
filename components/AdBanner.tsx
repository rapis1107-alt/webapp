"use client";

import { useEffect } from "react";

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";
const IS_PROD = process.env.NODE_ENV === "production";

interface Props {
  slot: string;
  format?: string;
}

export default function AdBanner({ slot, format = "auto" }: Props) {
  useEffect(() => {
    if (!IS_PROD || !ADSENSE_ID) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense初期化済みの場合など無視
    }
  }, []);

  if (!IS_PROD || !ADSENSE_ID) return null;

  return (
    <div className="w-full overflow-hidden" style={{ minHeight: 60 }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
