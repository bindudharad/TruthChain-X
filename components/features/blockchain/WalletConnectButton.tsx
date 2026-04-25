"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
    };
  }
}

export function WalletConnectButton() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function connect() {
    if (!window.ethereum) return;
    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0] || "");
    } finally {
      setLoading(false);
    }
  }

  if (address) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
        <Wallet className="h-4 w-4" />
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <Button variant="secondary" onClick={connect} disabled={loading || !window.ethereum}>
      <Wallet className="h-4 w-4" />
      {loading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
