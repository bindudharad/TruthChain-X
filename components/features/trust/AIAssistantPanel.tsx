"use client";

import { FormEvent, memo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

function AIAssistantPanelBase({
  hash,
  score,
  explanation,
  creatorName,
  risk
}: {
  hash: string;
  score: number;
  explanation: string;
  creatorName: string;
  risk: string;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask why the score changed, what signals matter most, or whether this content should be trusted."
    }
  ]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const data = await api.post<{ answer: string }>("/api/assistant", {
        hash,
        question,
        score,
        explanation,
        creatorName,
        risk
      });
      setMessages((current) => [...current, { role: "assistant", text: data.answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "I couldn't reach the assistant service, so please rely on the explanation and score breakdown panels for now." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-5">
        <p className="text-lg font-semibold text-white">AI Assistant Panel</p>
        <p className="text-sm text-slate-400">Interactive Q&A layer for explaining the current trust result in plain language.</p>
      </div>
      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`rounded-xl px-4 py-3 text-sm ${message.role === "assistant" ? "bg-cyan-400/8 text-slate-200" : "bg-white/5 text-white"}`}>
            {message.text}
          </div>
        ))}
        {loading ? <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">Generating an answer from the current trust context...</div> : null}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about this result..."
          className="h-11 flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-slate-100 outline-none"
        />
        <Button type="submit" disabled={loading || !hash}>
          {loading ? "Thinking..." : "Ask"}
        </Button>
      </form>
    </Card>
  );
}

export const AIAssistantPanel = memo(AIAssistantPanelBase);
