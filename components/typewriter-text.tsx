"use client";

import { useEffect, useState } from "react";

export function TypewriterText({ text }: { text: string }) {
  const [visible, setVisible] = useState("");

  useEffect(() => {
    setVisible("");
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setVisible(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, 14);
    return () => clearInterval(timer);
  }, [text]);

  return <p className="text-sm leading-7 text-slate-300">{visible}</p>;
}
