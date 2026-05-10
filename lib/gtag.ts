export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type GtagCommand = "config" | "event";
declare function gtag(command: GtagCommand, ...args: unknown[]): void;

export function gtagEvent(name: string) {
  if (!GA_ID || typeof window === "undefined" || typeof gtag === "undefined") return;
  gtag("event", name);
}
