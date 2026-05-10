import Script from "next/script";

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";
const IS_PROD = process.env.NODE_ENV === "production";

export default function GoogleAdSense() {
  if (!IS_PROD || !ADSENSE_ID) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
