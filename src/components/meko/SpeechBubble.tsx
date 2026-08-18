import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function SpeechBubble({
  text,
  quiet,
  id,
}: {
  text: string;
  quiet: boolean;
  id: number;
}) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const step = quiet ? 42 : 26;
    const t = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, step);
    return () => clearInterval(t);
  }, [text, id, quiet]);

  if (!text) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-4 z-20 max-w-[80%] -translate-x-1/2 rounded-2xl px-4 py-2 shadow-lg backdrop-blur",
        quiet
          ? "bg-card/70 text-sm italic text-muted-foreground"
          : "bg-card text-base font-medium text-card-foreground",
      )}
    >
      {shown}
      <span className="animate-pulse">|</span>
    </div>
  );
}
